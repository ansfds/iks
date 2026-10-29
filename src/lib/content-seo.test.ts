import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE, resolvePageSeo, SITE_URL } from "../config/seo";
import { applyContentSeo } from "./content-seo";
import { buildSeoTags } from "./seo";

describe("shared browser and server content metadata", () => {
  it("uses per-page content titles over the general title", () => {
    expect(
      applyContentSeo(resolvePageSeo("/contact"), {
        seo_contact_title: "Contact title",
        seo_title: "General",
      }).title
    ).toBe("Contact title");
  });
  it("replaces image metadata without inheriting incorrect dimensions", () => {
    const seo = applyContentSeo(resolvePageSeo("/"), {
      seo_og_image: "/images/cms/new.png",
    });
    expect(seo.image?.url).toBe(`${SITE_URL}/images/cms/new.png`);
    expect(seo.image?.width).toBeUndefined();
  });
  it("preserves missing-page and private-page metadata", () => {
    const page = resolvePageSeo("/not-a-real-page");
    expect(applyContentSeo(page, { seo_title: "General" })).toEqual(page);
    const admin = resolvePageSeo("/admin");
    expect(applyContentSeo(admin, { seo_title: "General" })).toEqual(admin);
  });
  it("keeps inner-page and card titles distinct from the general home settings", () => {
    const values = {
      seo_title: "Home title",
      seo_description: "Home description",
    };
    expect(applyContentSeo(resolvePageSeo("/"), values)).toMatchObject({
      title: "Home title",
      description: "Home description",
    });
    for (const path of [
      "/about",
      "/contact",
      "/gift-cards",
      "/gift-cards/playstation",
    ]) {
      const page = resolvePageSeo(path);
      const result = applyContentSeo(page, values);
      expect(result.title).toBe(page.title);
      expect(result.description).toBe(page.description);
    }
  });
  it("keeps verified image dimensions when Supabase selects the official share image", () => {
    const tags = buildSeoTags(
      applyContentSeo(resolvePageSeo("/"), { seo_og_image: DEFAULT_OG_IMAGE })
    );
    expect(tags.meta).toContainEqual({
      property: "og:image:width",
      content: "1200",
    });
    expect(tags.meta).toContainEqual({
      property: "og:image:height",
      content: "630",
    });
    expect(tags.meta).toContainEqual({
      property: "og:image:type",
      content: "image/jpeg",
    });
  });
  it("ignores legacy external share-image settings without losing the bundled image dimensions", () => {
    const tags = buildSeoTags(
      applyContentSeo(resolvePageSeo("/"), {
        seo_og_image: "https://i.postimg.cc/brfL89yd/old.png",
      })
    );
    expect(tags.meta).toContainEqual({
      property: "og:image",
      content: DEFAULT_OG_IMAGE,
    });
    expect(tags.meta).toContainEqual({
      name: "twitter:image",
      content: DEFAULT_OG_IMAGE,
    });
    expect(tags.meta).toContainEqual({
      property: "og:image:width",
      content: "1200",
    });
    expect(tags.meta).toContainEqual({
      property: "og:image:height",
      content: "630",
    });
  });
  it("uses public business settings and excludes hidden phone numbers", () => {
    const seo = applyContentSeo(resolvePageSeo("/"), {
      site_logo: "/images/custom-logo.png",
      site_address: "Visible address",
      site_phones: JSON.stringify([
        { number: "0911111111", visible: true },
        { number: "0922222222", visible: false },
      ]),
    });
    expect(
      buildSeoTags(seo).schema.find(row => row["@type"] === "FinancialService")
    ).toMatchObject({
      logo: SITE_URL + "/images/custom-logo.png",
      telephone: ["+218911111111"],
      address: { streetAddress: "Visible address" },
    });
  });
});
