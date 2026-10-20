import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomBytes } from "node:crypto";
import app from "./boot";
import { appRouter } from "./router";
import { hashPassword } from "./auth/password.mjs";
import { authenticateRequest, login, logout } from "./auth/service";
import { handleVercelRequest } from "./vercel";
import { assertSameOrigin } from "./auth/security";

const password = randomBytes(32).toString("base64url");
let hash: string;
const origin = "http://localhost:4173";
function request(cookie = "", host = origin) {
  return new Request(host + "/admin", { headers: { cookie } });
}
async function rpc(
  path: string,
  input?: unknown,
  cookie = "",
  method = "POST",
  headers = {}
) {
  const url = new URL(origin + "/api/trpc/" + path);
  if (method === "GET")
    url.searchParams.set("input", JSON.stringify({ json: input ?? null }));
  return app.request(
    new Request(url, {
      method,
      headers: {
        origin,
        cookie,
        "content-type": "application/json",
        "x-admin-request": "1",
        ...headers,
      },
      ...(method === "POST"
        ? { body: JSON.stringify({ json: input ?? null }) }
        : {}),
    })
  );
}
async function signedIn(host = origin) {
  const headers = new Headers();
  await login(request("", host), headers, "owner", password);
  return headers.get("set-cookie")!.split(";")[0];
}
beforeAll(async () => {
  hash = await hashPassword(password);
});
beforeEach(() => {
  vi.stubEnv("ADMIN_USERNAME", "owner");
  vi.stubEnv("ADMIN_PASSWORD_HASH", hash);
  vi.stubEnv("ADMIN_SESSION_SECRET", randomBytes(48).toString("base64url"));
  vi.stubEnv("ADMIN_SESSION_HOURS", "0.25");
  vi.stubEnv("VERCEL", "0");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("single admin signed sessions without database storage", () => {
  it("logs in through HTTP, returns only the public identity and no credentials", async () => {
    const response = await rpc("auth.login", { username: "owner", password });
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Max-Age=900");
    const me = await rpc("auth.me", undefined, cookie.split(";")[0], "GET");
    const body = await me.text();
    expect(body).toContain("owner");
    expect(body).not.toContain(hash);
    expect(body).not.toContain(process.env.ADMIN_SESSION_SECRET!);
  });
  it("rejects bad credentials without disclosing which credential was wrong", async () => {
    const a = await rpc("auth.login", {
      username: "owner",
      password: "incorrect",
    });
    const b = await rpc("auth.login", {
      username: "another",
      password: "incorrect",
    });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    const first = (await a.json()) as { error: { json: { message: string } } },
      second = (await b.json()) as { error: { json: { message: string } } };
    expect(first.error.json.message).toBe(second.error.json.message);
  });
  it("uses a host-only secure cookie for HTTPS", async () => {
    const headers = new Headers();
    await login(
      request("", "https://preview.example"),
      headers,
      "owner",
      password
    );
    expect(headers.get("set-cookie")).toContain("__Host-elwaseet_admin=");
    expect(headers.get("set-cookie")).toContain("Secure");
    expect(headers.get("set-cookie")).not.toContain("Domain=");
  });
  it("rejects forged signatures and altered payloads", async () => {
    const cookie = await signedIn();
    expect(await authenticateRequest(request(cookie))).not.toBeNull();
    const [name, value] = cookie.split("=");
    const [body] = value.split(".");
    expect(
      await authenticateRequest(request(`${name}=${body}.${"A".repeat(43)}`))
    ).toBeNull();
    expect(await authenticateRequest(request(`${name}=A${value}`))).toBeNull();
    expect(await authenticateRequest(request("kimi_sid=old"))).toBeNull();
  });
  it("expires after 15 minutes and never slides the expiration", async () => {
    const cookie = await signedIn();
    const before = await authenticateRequest(request(cookie));
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 300000);
    expect((await authenticateRequest(request(cookie)))?.expiresAt).toBe(
      before?.expiresAt
    );
    vi.setSystemTime(Date.now() + 600001);
    expect(await authenticateRequest(request(cookie))).toBeNull();
  });
  it("invalidates sessions when the secret or credentials change", async () => {
    const cookie = await signedIn();
    vi.stubEnv("ADMIN_USERNAME", "changed");
    expect(await authenticateRequest(request(cookie))).toBeNull();
    vi.stubEnv("ADMIN_USERNAME", "owner");
    vi.stubEnv("ADMIN_SESSION_SECRET", randomBytes(48).toString("base64url"));
    expect(await authenticateRequest(request(cookie))).toBeNull();
  });
  it("clears the browser cookie and explicitly documents the bounded stateless replay limit", async () => {
    const cookie = await signedIn();
    const headers = new Headers();
    await logout(request(cookie), headers);
    expect(headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await authenticateRequest(request())).toBeNull();
    // Without a central revocation list, an already copied token lasts until its short expiry.
    expect(await authenticateRequest(request(cookie))).not.toBeNull();
  });
  it("fails closed when secrets are missing or the configured lifetime is too long", async () => {
    vi.stubEnv("ADMIN_SESSION_HOURS", "8");
    expect(
      (await rpc("auth.login", { username: "owner", password })).status
    ).toBe(503);
    vi.stubEnv("ADMIN_SESSION_HOURS", "0.25");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    expect(
      (await rpc("auth.login", { username: "owner", password })).status
    ).toBe(503);
  });
  it("requires a server-verified single-use Turnstile token on Vercel", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TURNSTILE_SITE_KEY", "public-site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    await expect(
      login(
        request("", "https://preview.example"),
        new Headers(),
        "owner",
        password
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          hostname: "another.example",
          action: "admin-login",
        })
      )
    );
    await expect(
      login(
        request("", "https://preview.example"),
        new Headers(),
        "owner",
        password,
        "challenge"
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          hostname: "preview.example",
          action: "admin-login",
        })
      )
    );
    const headers = new Headers();
    await login(
      request("", "https://preview.example"),
      headers,
      "owner",
      password,
      "valid-challenge"
    );
    expect(headers.get("set-cookie")).toContain("Secure");
  });
  it("rejects missing, foreign and cross-site mutation origins", () => {
    for (const headers of [
      {},
      { origin: "https://evil.example" },
      { origin, "content-type": "text/plain" },
      {
        origin,
        "content-type": "application/json",
        "x-admin-request": "1",
        "sec-fetch-site": "cross-site",
      },
    ]) {
      expect(() =>
        assertSameOrigin(
          new Request(origin + "/api/trpc", { method: "POST", headers })
        )
      ).toThrow();
    }
  });
  it("checks origin for login and logout at the real HTTP boundary", async () => {
    for (const path of ["auth.login", "auth.logout"])
      expect(
        (
          await rpc(path, { username: "owner", password }, "", "POST", {
            origin: "https://evil.example",
          })
        ).status
      ).toBe(403);
  });
  it("protects direct and refreshed nested admin paths through the Vercel rewrite handler", async () => {
    for (const path of ["/admin", "/admin/settings", "/admin/"]) {
      const response = await handleVercelRequest(
        new Request(`https://example.com/api/index?__path=${path}`)
      );
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/login");
    }
  });
  it("denies every private API before content validation or GitHub access", async () => {
    let checked = 0;
    for (const [path, procedure] of Object.entries(appRouter._def.procedures)) {
      if (
        !/^(cms\.|admin\.|finance\.admin\.|giftCards\.admin\.|siteContent\.admin\.|contact\.(?!submit$)|gallery\.(?!list$)|news\.(?!list$|getById$)|testimonial\.(?!list$))/.test(
          path
        )
      )
        continue;
      const type = (procedure as unknown as { _def: { type: string } })._def
        .type;
      expect(
        (await rpc(path, {}, "", type === "mutation" ? "POST" : "GET")).status,
        path
      ).toBe(401);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
  });
  it("keeps the public site available without credentials or a database URL", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    vi.stubEnv("DATABASE_URL", "");
    expect((await rpc("giftCards.list", undefined, "", "GET")).status).toBe(
      200
    );
    expect((await rpc("finance.overview", undefined, "", "GET")).status).toBe(
      200
    );
    expect((await rpc("siteContent.public", undefined, "", "GET")).status).toBe(
      200
    );
  });
});
