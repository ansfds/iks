import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SEO_SITE_NAME,
  SITE_URL,
  resolvePageSeo,
  validateSiteUrl,
} from "../config/seo";
import { buildSeoTags, createSitemap, renderSeoDocument } from "./seo";

describe("shared server/client SEO", () => {
  it("includes complete social metadata in HTML without JavaScript", () => {
    const html = renderSeoDocument(
      '<html lang="ar" dir="rtl"><head><title>Old</title><meta name="description" content="Old"></head><body><div id="root"></div></body></html>',
      resolvePageSeo("/gift-cards/xbox")
    );
    expect(html).toContain("Xbox Gift Cards في ليبيا");
    expect(html).toContain(`property="og:image" content="${DEFAULT_OG_IMAGE}"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('property="og:image:type" content="image/jpeg"');
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).not.toContain("localhost");
  });
  it("publishes the requested identity and description with linked business, website and page data", () => {
    const tags = buildSeoTags(resolvePageSeo("/"));
    expect(tags.title).toBe(DEFAULT_TITLE);
    expect(tags.meta).toContainEqual({
      property: "og:site_name",
      content: SEO_SITE_NAME,
    });
    expect(tags.meta).toContainEqual({
      property: "og:description",
      content: DEFAULT_DESCRIPTION,
    });
    const business = tags.schema.find(
      row => row["@type"] === "FinancialService"
    )!;
    expect(business).toMatchObject({
      name: SEO_SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL + "/",
      image: DEFAULT_OG_IMAGE,
    });
    expect(business.logo).toBe(
      SITE_URL + "/images/elwaseet-el-moatamad-logo.png"
    );
    const website = tags.schema.find(row => row["@type"] === "WebSite")!;
    expect(website).toMatchObject({
      name: SEO_SITE_NAME,
      publisher: { "@id": business["@id"] },
    });
    expect(tags.schema.find(row => row["@type"] === "WebPage")).toMatchObject({
      isPartOf: { "@id": website["@id"] },
      primaryImageOfPage: { url: DEFAULT_OG_IMAGE, width: 1200, height: 630 },
    });
  });
  it("does not duplicate metadata when a built HTML template is rendered again", () => {
    const first = renderSeoDocument(
      "<head></head><body></body>",
      resolvePageSeo("/")
    );
    const next = renderSeoDocument(first, resolvePageSeo("/contact"));
    expect(next.match(/property="og:image"/g)).toHaveLength(1);
    expect(next.match(/rel="canonical"/g)).toHaveLength(1);
    expect(next.match(/application\/ld\+json/g)).toHaveLength(1);
    expect(next).toContain(`${SITE_URL}/contact`);
  });
  it("removes tracking parameters and trailing slashes from canonical URLs", () => {
    const tags = buildSeoTags(
      resolvePageSeo("/gift-cards/xbox/?utm_source=test#buy")
    );
    expect(tags.links[0].href).toBe(`${SITE_URL}/gift-cards/xbox`);
  });
  it("rejects local or insecure production origins", () => {
    for (const origin of [
      "https://localhost:4173",
      "https://127.0.0.1",
      "http://example.com",
      "https://example.com/path",
    ])
      expect(() => validateSiteUrl(origin)).toThrow();
  });
  it("sets noindex for admin, login, missing pages and unavailable cards", () => {
    for (const path of ["/admin", "/login", "/not-a-real-page"])
      expect(resolvePageSeo(path).noindex).toBe(true);
    expect(
      resolvePageSeo("/gift-cards/steam", {
        giftCard: {
          slug: "steam",
          displayName: "Steam",
          status: "COMING_SOON",
        },
      }).noindex
    ).toBe(true);
  });
  it("escapes custom product names in HTML and JSON-LD", () => {
    const seo = resolvePageSeo("/gift-cards/custom", {
      giftCard: {
        slug: "custom",
        displayName: '</script><script>alert("x")</script>',
        status: "AVAILABLE",
      },
    });
    const html = renderSeoDocument("<head></head>", seo);
    expect(html).not.toContain('<script>alert("x")</script>');
    const schema = html.match(
      /type="application\/ld\+json">([\s\S]*?)<\/script>/
    )?.[1];
    expect(() => JSON.parse(schema!)).not.toThrow();
  });
  it("supports a page-specific image without inventing its dimensions", () => {
    const seo = {
      ...resolvePageSeo("/contact"),
      image: { url: `${SITE_URL}/images/photo.jpg` },
    };
    const tags = buildSeoTags(seo);
    expect(tags.meta.some(item => item.property === "og:image:width")).toBe(
      false
    );
    expect(
      tags.meta.some(
        item => item.property === "og:image" && item.content === seo.image.url
      )
    ).toBe(true);
  });
  it("rejects externally hosted or invalid share images even for page overrides", () => {
    for (const url of [
      "https://i.postimg.cc/old.png",
      "https://external.example/photo.jpg",
      "javascript:alert(1)",
    ]) {
      const tags = buildSeoTags({ ...resolvePageSeo("/"), image: { url } });
      expect(tags.meta).toContainEqual({
        property: "og:image",
        content: DEFAULT_OG_IMAGE,
      });
      expect(tags.meta).toContainEqual({
        property: "og:image:type",
        content: "image/jpeg",
      });
    }
  });
  it("creates valid sitemap URLs without invented modification dates", () => {
    const xml = createSitemap([
      { path: "/" },
      { path: "/gift-cards/xbox" },
      { path: "/" },
    ]);
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml).not.toContain("lastmod");
    expect(xml).not.toContain("localhost");
  });
});
