import { describe, expect, it } from "vitest";
import { resolvePageSeo } from "../config/seo";
import { applyContentSeo } from "./content-seo";

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
    expect(seo.image?.url).toBe(
      "https://iks-pearl.vercel.app/images/cms/new.png"
    );
    expect(seo.image?.width).toBeUndefined();
  });
  it("preserves missing-page and private-page metadata", () => {
    const page = resolvePageSeo("/not-a-real-page");
    expect(applyContentSeo(page, { seo_title: "General" })).toEqual(page);
    const admin = resolvePageSeo("/admin");
    expect(applyContentSeo(admin, { seo_title: "General" })).toEqual(admin);
  });
});
