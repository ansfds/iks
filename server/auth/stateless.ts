import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { parse, serialize } from "cookie";
import { TRPCError } from "@trpc/server";
import { authConfig } from "./config";
import { verifyPassword } from "./password.mjs";
import { cookieSettings } from "./security";

export type AdminIdentity = { id: number; name: string; role: "admin" };
const unavailable = () =>
  new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message: "تسجيل الدخول غير مهيّأ على الخادم.",
  });
function configuration() {
  try {
    return authConfig();
  } catch {
    throw unavailable();
  }
}
const equal = (a: string, b: string) =>
  timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest()
  );
const signature = (payload: string) =>
  createHmac("sha256", configuration().secret)
    .update("admin-cookie-v2:" + payload)
    .digest("base64url");
const identity = (): AdminIdentity => ({
  id: 1,
  name: configuration().username,
  role: "admin",
});
function setCookie(
  request: Request,
  headers: Headers,
  token: string,
  maxAge: number
) {
  const { name, secure } = cookieSettings(request);
  headers.append(
    "set-cookie",
    serialize(name, token, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge,
    })
  );
}
async function verifyChallenge(request: Request, token?: string) {
  if (process.env.VERCEL !== "1") return;
  const secret = process.env.TURNSTILE_SECRET_KEY,
    siteKey = process.env.TURNSTILE_SITE_KEY;
  if (!secret || !siteKey) throw unavailable();
  if (!token || token.length > 2048)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "أكمل التحقق الأمني قبل تسجيل الدخول.",
    });
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
        body: new URLSearchParams({ secret, response: token }),
      }
    );
    const result = (await response.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    if (
      !response.ok ||
      !result.success ||
      result.hostname !== new URL(request.url).hostname ||
      result.action !== "admin-login"
    )
      throw new Error("Invalid challenge");
  } catch {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "فشل التحقق الأمني. أعد المحاولة.",
    });
  }
}
export async function login(
  request: Request,
  headers: Headers,
  username: string,
  password: string,
  challengeToken?: string
) {
  const config = configuration();
  await verifyChallenge(request, challengeToken);
  const valid = await verifyPassword(password, config.passwordHash);
  if (!equal(username, config.username) || !valid)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "اسم المستخدم أو كلمة المرور غير صحيحة.",
    });
  const now = Date.now(),
    expiresAt = now + config.sessionSeconds * 1000;
  const payload = Buffer.from(
    JSON.stringify({
      v: 2,
      iat: now,
      exp: expiresAt,
      fp: config.fingerprint,
      nonce: randomBytes(24).toString("base64url"),
    })
  ).toString("base64url");
  setCookie(
    request,
    headers,
    `${payload}.${signature(payload)}`,
    config.sessionSeconds
  );
  return { user: identity(), expiresAt };
}
export async function authenticateRequest(request: Request) {
  const token = parse(request.headers.get("cookie") || "")[
    cookieSettings(request).name
  ];
  if (
    !token ||
    token.length > 1500 ||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)
  )
    return null;
  const config = configuration();
  const [payload, mac] = token.split(".");
  if (!equal(mac, signature(payload))) return null;
  try {
    const value = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    if (
      value.v !== 2 ||
      value.fp !== config.fingerprint ||
      !Number.isSafeInteger(value.iat) ||
      !Number.isSafeInteger(value.exp) ||
      value.iat > Date.now() ||
      value.exp <= Date.now() ||
      value.exp - value.iat !== config.sessionSeconds * 1000
    )
      return null;
    return { user: identity(), expiresAt: value.exp as number };
  } catch {
    return null;
  }
}
export async function logout(request: Request, headers: Headers) {
  // Stateless logout clears this browser's cookie. A copied token expires after at most 15 minutes.
  setCookie(request, headers, "", 0);
  return { success: true };
}
