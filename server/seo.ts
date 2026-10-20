import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { giftCardRouter } from "./gift-card-router";
import { giftCardSlug, normalizeSeoPath, pageSeo, resolvePageSeo } from "../src/config/seo";
import { createRobotsTxt, createSitemap, renderSeoDocument } from "../src/lib/seo";
import { applyContentSeo } from '../src/lib/content-seo';
import { readContent } from './cms/store';

function catalog() {
  return giftCardRouter.createCaller({ req: new Request('https://internal.invalid/'), resHeaders: new Headers() });
}
export async function resolveServerPageSeo(value: string) {
  const pathname = normalizeSeoPath(value);
  const slug = giftCardSlug(pathname);
  const contentSeo = (seo: ReturnType<typeof resolvePageSeo>) => applyContentSeo(seo, Object.fromEntries(readContent().collections.siteSettings.filter(row => row.isPublic).map(row => [row.key, row.value || ''])));
  if (!slug) return contentSeo(resolvePageSeo(pathname));
  try {
    const data = await catalog().bySlug({ slug });
    return contentSeo(resolvePageSeo(pathname, data ? { giftCard: data.card } : { notFound: true }));
  } catch {
    console.error(`[seo] Gift-card metadata unavailable for ${pathname}`);
    return resolvePageSeo(pathname, { unavailable: true });
  }
}
export async function dynamicSitemap() {
  const cards = await catalog().list();
  const entries: Array<{ path: string; lastmod?: string }> = Object.keys(pageSeo).map((path) => ({ path }));
  for (const card of cards) {
    if (card.status !== "AVAILABLE" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card.slug)) continue;
    const date = card.updatedAt ? new Date(card.updatedAt) : null;
    entries.push({ path: `/gift-cards/${card.slug}`, lastmod: date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : undefined });
  }
  return createSitemap(entries);
}
export function isSeoRequest(pathname: string) {
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") return true;
  return !/^\/(api|assets|src|node_modules|tools|\.preview)(\/|$)/.test(pathname) && !pathname.startsWith("/@") && !/\.[^/]*$/.test(pathname);
}
async function productionTemplate() {
  const bundled = path.resolve(import.meta.dirname, "public/index.html");
  const filename = existsSync(bundled) ? bundled : path.resolve(process.cwd(), "dist/public/index.html");
  return readFile(filename, "utf8");
}
export async function seoResponse(value: string, template: () => Promise<string> = productionTemplate) {
  const pathname = normalizeSeoPath(value);
  if (pathname === "/robots.txt") return new Response(createRobotsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (pathname === "/sitemap.xml") {
    try {
      return new Response(await dynamicSitemap(), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-cache" } });
  } catch {
      console.error("[seo] Sitemap catalog query failed");
      return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "60", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
    }
  }
  const seo = await resolveServerPageSeo(pathname);
  const headers: Record<string, string> = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" };
  if (seo.noindex) headers["X-Robots-Tag"] = "noindex, nofollow";
  if (seo.status === 503) { headers["Retry-After"] = "60"; headers["Cache-Control"] = "no-store"; }
  return new Response(renderSeoDocument(await template(), seo), { status: seo.status, headers });
}
export function registerSeoRoutes(app: Hono<{ Bindings: HttpBindings }>) {
  app.get("*", async (context, next) => isSeoRequest(context.req.path) ? seoResponse(context.req.path) : next());
}
