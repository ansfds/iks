import type { Plugin, ViteDevServer } from "vite";
import fs from "node:fs/promises";
import path from "node:path";
import { SITE_IMAGES } from "../src/config/site-images";
import { SITE_NAME, SITE_NAME_EN, SITE_URL, resolvePageSeo, validateSiteUrl } from "../src/config/seo";
import { createRobotsTxt, renderSeoDocument } from "../src/lib/seo";

export function siteMetadata(): Plugin {
  let origin = SITE_URL;
  let root = process.cwd();
  const manifest = () => JSON.stringify({
    id: "/", name: SITE_NAME, short_name: SITE_NAME, lang: "ar", dir: "rtl",
    description: `${SITE_NAME_EN} للدفع الإلكتروني والتحويلات`,
    start_url: "/", scope: "/", display: "standalone",
    theme_color: "#0f3b82", background_color: "#ffffff",
    icons: [
      { src: SITE_IMAGES.branding.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: SITE_IMAGES.branding.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  });
  return {
    name: "site-brand-metadata",
    configResolved(config) {
      origin = validateSiteUrl(config.env.VITE_SITE_URL || SITE_URL);
      root = config.root;
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const pathname = new URL(req.url || "/", "http://dev.invalid").pathname;
          if (pathname === "/site.webmanifest") {
            res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
            res.end(manifest()); return;
          }
          if (req.method !== "GET" || /^\/(api|assets|src|node_modules|tools|\.preview)(\/|$)/.test(pathname) || pathname.startsWith("/@") || (/\.[^/]*$/.test(pathname) && !["/robots.txt", "/sitemap.xml"].includes(pathname))) return next();
          const seo = await server.ssrLoadModule("/server/seo.ts");
          const response: Response = await seo.seoResponse(pathname, async () => {
            const html = await fs.readFile(path.join(root, "index.html"), "utf8");
            return server.transformIndexHtml(req.url || pathname, html);
          });
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch (error) { next(error); }
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "site.webmanifest", source: manifest() });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: createRobotsTxt(origin) });
    },
    transformIndexHtml(html) {
      return renderSeoDocument(html, resolvePageSeo("/"), origin);
    },
  };
}
