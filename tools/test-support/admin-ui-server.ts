// Isolated browser QA only: fake Auth provider + local content repository.
// Never started by the application, Vercel, or any production script.
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import app from "../../server/boot";
import { registerSeoRoutes } from "../../server/seo";
import { bundledSnapshot, installTestRepository } from "../../server/cms/store";
import { validateContent } from "../../server/cms/document";

if (
  process.env.NODE_ENV !== "test" ||
  process.env.VERCEL === "1" ||
  !process.env.QA_PASSWORD ||
  !process.env.QA_DIRECTORY
)
  throw Error("Isolated QA configuration required");
const uid = process.env.SUPABASE_ADMIN_USER_IDS!;
const project = process.env.SUPABASE_URL!;
const user = {
  id: uid,
  email: "qa@example.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const exp = Math.floor(Date.now() / 1000) + 3600;
const token = [
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url"
  ),
  Buffer.from(
    JSON.stringify({
      sub: uid,
      exp,
      role: "authenticated",
      aud: "authenticated",
    })
  ).toString("base64url"),
  "qa-only-signature",
].join(".");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin !== project) return originalFetch(input, init);
  if (url.pathname === "/auth/v1/token") {
    const body = JSON.parse(String(init?.body));
    if (
      body.password !== process.env.QA_PASSWORD &&
      body.refresh_token !== "qa-refresh"
    )
      return Response.json({ msg: "Invalid credentials" }, { status: 400 });
    return Response.json({
      access_token: token,
      refresh_token: "qa-refresh",
      expires_in: 3600,
      expires_at: exp,
      token_type: "bearer",
      user,
    });
  }
  if (url.pathname === "/auth/v1/user")
    return new Headers(init?.headers).get("authorization") === "Bearer " + token
      ? Response.json(user)
      : Response.json({ msg: "Invalid token" }, { status: 401 });
  if (url.pathname === "/auth/v1/logout")
    return new Response(null, { status: 204 });
  throw Error("Unexpected QA provider operation");
};
let document = bundledSnapshot().document;
let revision = "1";
// Copy actual captured display values into the isolated fixture, not Production.
try {
  const values = JSON.parse(
    await readFile(".cache/visual-content-values.json", "utf8")
  );
  for (const [key, value] of Object.entries(values)) {
    if (document.collections.siteSettings.some(r => r.key === key)) continue;
    const id = document.nextIds.siteSettings++;
    document.collections.siteSettings.push({
      id,
      key,
      value: String(value),
      type:
        key.endsWith("_image") || key.endsWith("_background_url")
          ? "image"
          : "text",
      group: "visual",
      isPublic: true,
      sortOrder: 0,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
} catch {
  /* Captured values are optional in an isolated fixture. */
}
installTestRepository({
  async read() {
    return { document: structuredClone(document), revision };
  },
  async write(next, expected) {
    if (expected !== revision) throw Error("QA revision conflict");
    document = validateContent(next);
    revision = String(Number(revision) + 1);
    await writeFile(
      process.env.QA_DIRECTORY + "/document.json",
      JSON.stringify(document, null, 2)
    );
    return {
      revision,
      commit: createHash("sha1").update(revision).digest("hex"),
    };
  },
});
registerSeoRoutes(app);
app.use("*", serveStatic({ root: "dist/public" }));
serve(
  { fetch: app.fetch, hostname: "127.0.0.1", port: Number(process.env.PORT) },
  () => console.log("Isolated Admin UI QA server ready")
);
