import { describe, expect, it } from "vitest";
import { homeImageOverride, inheritGiftCardImages } from "./gift-card-image-defaults";

describe("gift-card image inheritance", () => {
  const seededCard = {
    slug: "xbox",
    imageUrl: "https://placehold.co/1200x760/107c10/ffffff?text=Xbox",
    backgroundUrl: "https://placehold.co/1600x900/107c10/ffffff?text=Xbox",
    createdBy: null,
    updatedBy: null,
  };

  it("lets config changes replace the historical seed images", () => {
    expect(inheritGiftCardImages(seededCard)).toMatchObject({ imageUrl: null, backgroundUrl: null });
  });
  it("preserves Admin overrides, including an explicitly chosen historical URL", () => {
    const custom = { ...seededCard, updatedBy: 12 };
    expect(inheritGiftCardImages(custom)).toEqual(custom);
  });
  it("preserves custom URLs even if the old data has no author metadata", () => {
    const custom = { ...seededCard, imageUrl: "https://example.com/custom.png" };
    expect(inheritGiftCardImages(custom).imageUrl).toBe(custom.imageUrl);
  });
  it("inherits each image independently", () => {
    const custom = { ...seededCard, imageUrl: "https://example.com/custom.png" };
    expect(inheritGiftCardImages(custom)).toMatchObject({ imageUrl: custom.imageUrl, backgroundUrl: null });
  });
  it("does not freeze the home tile to a seeded PlayStation background", () => {
    const seed = "https://placehold.co/1600x900/003087/ffffff?text=PlayStation+Store";
    expect(homeImageOverride(seed, "giftCards")).toBeNull();
    expect(homeImageOverride(seed, "giftCards", true)).toBe(seed);
  });
});
