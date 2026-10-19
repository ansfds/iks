import { DEFAULT_SOCIAL_IMAGE, SITE_NAME, SITE_NAME_EN, SITE_URL, absoluteSiteUrl, seoKeywords, type SeoPage } from "../config/seo";
import { siteConfig } from "../config/site";
import { SITE_IMAGES } from "../config/site-images";

export const ROBOTS_INDEX = "index, follow, max-image-preview:large";
export const ROBOTS_NOINDEX = "noindex, nofollow";
export function buildSeoTags(seo: SeoPage, origin = SITE_URL) {
  const image = seo.image ?? DEFAULT_SOCIAL_IMAGE;
  const url = absoluteSiteUrl(seo.path, origin);
  const imageUrl = absoluteSiteUrl(image.url, origin);
  const robots = seo.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX;
  const meta = [
    { name: "description", content: seo.description },
    { name: "robots", content: robots },
    { name: "author", content: SITE_NAME },
    { name: "keywords", content: seoKeywords.join(", ") },
    { name: "theme-color", content: "#0f3b82" },
    { name: "application-name", content: SITE_NAME },
    { name: "apple-mobile-web-app-title", content: SITE_NAME },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:url", content: url },
    { property: "og:locale", content: "ar_LY" },
    { property: "og:image", content: imageUrl },
    { property: "og:image:secure_url", content: imageUrl },
    { property: "og:image:alt", content: image.alt || `معاينة ${SITE_NAME}` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: image.alt || `معاينة ${SITE_NAME}` },
  ];
  if (image.width && image.height) meta.push({ property: "og:image:width", content: String(image.width) }, { property: "og:image:height", content: String(image.height) });
  if (image.type) meta.push({ property: "og:image:type", content: image.type });
  const links = [
    { rel: "canonical", href: url },
    { rel: "icon", href: SITE_IMAGES.branding.favicon },
    { rel: "apple-touch-icon", href: SITE_IMAGES.branding.appleTouchIcon },
    { rel: "manifest", href: "/site.webmanifest" },
  ];
  const businessId = absoluteSiteUrl("/#financial-service", origin);
  const websiteId = absoluteSiteUrl("/#website", origin);
  const schema: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org", "@type": "FinancialService", "@id": businessId,
      name: SITE_NAME, alternateName: SITE_NAME_EN, url: absoluteSiteUrl("/", origin),
      logo: absoluteSiteUrl(SITE_IMAGES.branding.logo, origin), image: imageUrl,
      telephone: siteConfig.displayPhones.map((phone) => `+218${phone.replace(/^0/, "")}`),
      address: { "@type": "PostalAddress", streetAddress: siteConfig.address.street, addressLocality: siteConfig.address.city, addressCountry: siteConfig.address.countryCode },
      sameAs: siteConfig.socialLinks,
    },
    { "@context": "https://schema.org", "@type": "WebSite", "@id": websiteId, name: SITE_NAME, alternateName: SITE_NAME_EN, url: absoluteSiteUrl("/", origin), inLanguage: "ar-LY", publisher: { "@id": businessId } },
    { "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#webpage`, url, name: seo.title, description: seo.description, inLanguage: "ar-LY", isPartOf: { "@id": websiteId }, about: { "@id": businessId } },
  ];
  if (seo.breadcrumbs) schema.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: seo.breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteSiteUrl(item.path, origin) })) });
  return { title: seo.title, meta, links, schema, robots };
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
export function renderSeoDocument(html: string, seo: SeoPage, origin = SITE_URL) {
  const tags = buildSeoTags(seo, origin);
  const attrs = (value: Record<string, string | undefined>) => Object.entries(value).flatMap(([key, text]) => text === undefined ? [] : [`${key}="${escapeHtml(text)}"`]).join(" ");
  const preload = seo.path === "/" ? `<link rel="preload" as="image" href="${escapeHtml(SITE_IMAGES.homepage.heroBackground)}" fetchpriority="high" referrerpolicy="no-referrer">` : "";
  const head = [
    "<!-- site-seo:start -->",
    `<title>${escapeHtml(tags.title)}</title>`,
    ...tags.meta.map((item) => `<meta ${attrs(item)}>`),
    ...tags.links.map((item) => `<link ${attrs(item)}>`),
    `<script id="alwaseet-schema-jsonld" type="application/ld+json">${serializeJsonLd(tags.schema)}</script>`,
    preload,
    "<!-- site-seo:end -->",
  ].join("\n");
  return html.replace(/<head\b[^>]*>([\s\S]*?)<\/head>/i, (_whole, current: string) => {
    const cleaned = current
      .replace(/<!-- site-seo:start -->[\s\S]*?<!-- site-seo:end -->/g, "")
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
      .replace(/<meta\b[^>]*(?:name=["'](?:description|keywords|robots|author|theme-color|application-name|apple-mobile-web-app-title|twitter:[^"']+)|property=["']og:[^"']+)["'][^>]*>/gi, "")
      .replace(/<link\b[^>]*rel=["'](?:canonical|icon|apple-touch-icon|manifest)["'][^>]*>/gi, "")
      .replace(/<script\b[^>]*id=["']alwaseet-schema-jsonld["'][^>]*>[\s\S]*?<\/script>/gi, "");
    return `<head>${cleaned}\n${head}\n</head>`;
  });
}

export function createRobotsTxt(origin = SITE_URL) {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /api/\nDisallow: /internal/\nDisallow: /dashboard/\nDisallow: /dev/\n\nSitemap: ${absoluteSiteUrl("/sitemap.xml", origin)}\n`;
}
export function createSitemap(entries: Array<{ path: string; lastmod?: string }>, origin = SITE_URL) {
  const seen = new Set<string>();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.filter((entry) => !seen.has(entry.path) && seen.add(entry.path)).map((entry) => `<url><loc>${escapeHtml(absoluteSiteUrl(entry.path, origin))}</loc>${entry.lastmod ? `<lastmod>${escapeHtml(entry.lastmod)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;
}
