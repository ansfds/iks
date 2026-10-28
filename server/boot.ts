import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { adminPageResponse } from "./auth/page-guard";
import { registerSeoRoutes } from "./seo";
import { appendAuthHeaders } from './supabase/client';

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 4 * 1024 * 1024 }));
app.use("*", async (c, next) => {
  const authHeaders = new Headers();
  const response = await adminPageResponse(c.req.raw, authHeaders);
  if (response) return response;
  await next();
  appendAuthHeaders(c.res.headers, authHeaders);
  c.header("X-Content-Type-Options", "nosniff");
  if (/^\/(admin|login|api)(\/|$)/.test(c.req.path)) {
    c.header("Cache-Control", "no-store");
    c.header("X-Robots-Tag", "noindex, nofollow");
    c.header("Referrer-Policy", "same-origin");
    c.header("Content-Security-Policy", "frame-ancestors 'none'");
  }
});
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction && process.env.VERCEL !== "1") {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  registerSeoRoutes(app);
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
