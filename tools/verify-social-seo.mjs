// Read-only verification of the HTML social crawlers receive and browser navigation.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright-core";

const origin = (
  process.argv[2] ||
  process.env.VERIFY_ORIGIN ||
  "http://127.0.0.1:4180"
).replace(/\/$/, "");
const output = process.env.VERIFY_OUTPUT || ".cache/seo/verification";
await mkdir(output, { recursive: true });
const configurationFile = path.resolve(output, "seo-config.mjs");
await build({
  entryPoints: ["src/config/seo.ts"],
  outfile: configurationFile,
  bundle: true,
  platform: "node",
  format: "esm",
  logLevel: "silent",
});
const config = await import(pathToFileURL(configurationFile).href);
const {
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SEO_SITE_NAME,
  SITE_URL,
  pageSeo,
} = config;
const decode = value =>
  value?.replace(
    /&(?:amp|quot|lt|gt|#39);/g,
    entity =>
      ({ "&amp;": "&", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&#39;": "'" })[
        entity
      ]
  );
const tags = (html, selector) =>
  [...html.matchAll(new RegExp(`<meta\\b[^>]*${selector}[^>]*>`, "g"))].map(
    match => decode(match[0].match(/content="([^"]*)"/)?.[1])
  );
const meta = (html, attribute, key) => {
  const values = tags(html, `${attribute}="${key}"`);
  assert.equal(values.length, 1, `${key} must appear exactly once`);
  return values[0];
};
const request = async (pathname, userAgent) => {
  const response = await fetch(origin + pathname, {
    headers: userAgent ? { "user-agent": userAgent } : {},
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  return { response, html: await response.text() };
};
function inspect(html, pathname, expectedStatus = 200) {
  assert.equal((html.match(/<title>/g) || []).length, 1);
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
  const description = meta(html, "name", "description");
  assert.ok(title && description);
  assert.equal(meta(html, "property", "og:title"), title);
  assert.equal(meta(html, "name", "twitter:title"), title);
  assert.equal(meta(html, "property", "og:description"), description);
  assert.equal(meta(html, "name", "twitter:description"), description);
  assert.equal(meta(html, "property", "og:site_name"), SEO_SITE_NAME);
  assert.equal(meta(html, "property", "og:type"), "website");
  assert.equal(meta(html, "property", "og:image"), DEFAULT_OG_IMAGE);
  assert.equal(meta(html, "property", "og:image:secure_url"), DEFAULT_OG_IMAGE);
  assert.equal(meta(html, "name", "twitter:image"), DEFAULT_OG_IMAGE);
  assert.equal(meta(html, "name", "twitter:card"), "summary_large_image");
  assert.equal(meta(html, "property", "og:image:width"), "1200");
  assert.equal(meta(html, "property", "og:image:height"), "630");
  assert.equal(meta(html, "property", "og:image:type"), "image/jpeg");
  assert.ok(meta(html, "name", "twitter:image:alt"));
  const canonical = [
    ...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/g),
  ];
  assert.equal(canonical.length, 1);
  assert.equal(canonical[0][1], SITE_URL + pathname);
  assert.equal(meta(html, "property", "og:url"), SITE_URL + pathname);
  const robots = meta(html, "name", "robots");
  assert.ok(
    robots.includes(
      expectedStatus === 200 ? "max-image-preview:large" : "noindex"
    )
  );
  const jsonLd = [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    ),
  ];
  assert.equal(jsonLd.length, 1);
  const schema = JSON.parse(jsonLd[0][1]);
  const business = schema.find(row => row["@type"] === "FinancialService");
  const website = schema.find(row => row["@type"] === "WebSite");
  assert.equal(business.name, SEO_SITE_NAME);
  assert.ok(business.description);
  assert.equal(business.url, SITE_URL + "/");
  assert.ok(business.logo.startsWith("https://"));
  assert.equal(business.image, DEFAULT_OG_IMAGE);
  assert.equal(website.publisher["@id"], business["@id"]);
  if (pathname === "/" && expectedStatus === 200) {
    assert.equal(title, DEFAULT_TITLE);
    assert.equal(description, DEFAULT_DESCRIPTION);
    assert.equal(business.description, DEFAULT_DESCRIPTION);
  }
  return { pathname, title, description, canonical: canonical[0][1] };
}
const catalogResponse = await fetch(origin + "/api/trpc/giftCards.list");
assert.equal(catalogResponse.status, 200);
const catalog = (await catalogResponse.json()).result.data.json;
const cardPaths = catalog
  .filter(card => card.status === "AVAILABLE")
  .map(card => "/gift-cards/" + card.slug);
const pages = [];
for (const pathname of [...Object.keys(pageSeo), ...cardPaths]) {
  const { response, html } = await request(pathname);
  assert.equal(response.status, 200, pathname);
  pages.push(inspect(html, pathname));
}
assert.equal(
  new Set(pages.map(page => page.title)).size,
  pages.length,
  "Public pages need distinct titles"
);
assert.equal(
  new Set(pages.map(page => page.description)).size,
  pages.length,
  "Public pages need distinct descriptions"
);
const crawlerResults = [];
for (const agent of [
  "WhatsApp/2.0",
  "facebookexternalhit/1.1",
  "TelegramBot",
  "Twitterbot/1.0",
  "LinkedInBot/1.0",
  "Googlebot",
]) {
  const { response, html } = await request("/", agent);
  assert.equal(response.status, 200, agent);
  inspect(html, "/");
  crawlerResults.push({
    agent,
    status: response.status,
    rawHtmlMetadata: true,
  });
}
for (const pathname of [
  "/login",
  "/seo-check-missing",
  "/gift-cards/seo-check-missing",
]) {
  const { response, html } = await request(pathname);
  assert.equal(response.status, pathname === "/login" ? 200 : 404);
  assert.ok(response.headers.get("x-robots-tag")?.includes("noindex"));
  assert.ok(meta(html, "name", "robots").includes("noindex"));
}
const guest = await fetch(origin + "/admin", { redirect: "manual" });
assert.equal(guest.status, 302);
assert.equal(guest.headers.get("location"), "/login");
const sitemap = await request("/sitemap.xml");
assert.equal(sitemap.response.status, 200);
assert.ok(
  sitemap.response.headers.get("content-type").includes("application/xml")
);
const locations = [...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(match =>
  decode(match[1])
);
assert.deepEqual(
  [...locations].sort(),
  [...Object.keys(pageSeo), ...cardPaths].map(p => SITE_URL + p).sort()
);
assert.ok(!/\/admin|\/login|localhost|127\.0\.0\.1/.test(sitemap.html));
const robots = (await request("/robots.txt")).html;
assert.ok(
  robots.includes("Disallow: /admin") && robots.includes("Disallow: /login")
);
assert.ok(robots.includes("Sitemap: " + SITE_URL + "/sitemap.xml"));
// The system HTTP client also supports the workstation's network/proxy setup.
const imageFile = path.resolve(output, "share-image.jpg");
const imageRequestUrl = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
  origin
)
  ? origin + "/og-image.jpg"
  : DEFAULT_OG_IMAGE;
const { stdout: imageStatus } = await promisify(execFile)(
  process.platform === "win32" ? "curl.exe" : "curl",
  [
    "--fail",
    "--silent",
    "--show-error",
    "--max-time",
    "40",
    "--connect-timeout",
    "15",
    "--user-agent",
    "facebookexternalhit/1.1",
    "--output",
    imageFile,
    "--write-out",
    "%{http_code} %{content_type} %{num_redirects}",
    imageRequestUrl,
  ],
  { windowsHide: true, timeout: 45000 }
);
assert.equal(imageStatus.trim(), "200 image/jpeg 0");
const bytes = await readFile(imageFile);
assert.equal(bytes.subarray(0, 2).toString("hex"), "ffd8");
const imageSha256 = createHash("sha256").update(bytes).digest("hex");
assert.equal(
  imageSha256,
  createHash("sha256")
    .update(await readFile("public/og-image.jpg"))
    .digest("hex")
);
assert.ok(bytes.length < 1024 * 1024);
let browser;
const errors = [];
try {
  browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const size = await page.evaluate(async url => {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { width: img.naturalWidth, height: img.naturalHeight };
  }, imageRequestUrl);
  assert.deepEqual(size, { width: 1200, height: 630 });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.waitForFunction(title => document.title === title, DEFAULT_TITLE);
  inspect(await page.content(), "/");
  await page
    .locator('header nav a[href="/about"], nav a[href="/about"]')
    .first()
    .click();
  await page.waitForURL("**/about");
  await page.waitForFunction(
    title => document.title === title,
    pageSeo["/about"].title
  );
  inspect(await page.content(), "/about");
  await page.reload({ waitUntil: "networkidle" });
  inspect(await page.content(), "/about");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin, { waitUntil: "networkidle" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    true
  );
  await page.screenshot({
    path: output + "/home-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
}
const result = {
  checkedAt: new Date().toISOString(),
  origin,
  canonicalOrigin: SITE_URL,
  pages,
  crawlerResults,
  image: {
    url: DEFAULT_OG_IMAGE,
    width: 1200,
    height: 630,
    bytes: bytes.length,
    sha256: imageSha256,
    requestedUrl: imageRequestUrl,
    httpStatus: 200,
    redirects: 0,
    type: "image/jpeg",
    unauthenticatedCrawlerAccess: true,
  },
  sitemapUrls: locations.length,
  browserNavigationAndRefresh: true,
  guestAdminProtected: true,
  errors,
};
await writeFile(output + "/results.json", JSON.stringify(result, null, 2));
console.log(
  JSON.stringify({
    origin,
    pages: pages.length,
    crawlers: crawlerResults.length,
    browserNavigationAndRefresh: true,
    sitemapUrls: locations.length,
    image: result.image,
    output,
  })
);
