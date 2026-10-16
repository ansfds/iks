import { afterEach, describe, expect, it, vi } from "vitest";
import { giftCardRouter } from "./gift-card-router";

afterEach(() => vi.unstubAllEnvs());
describe("anonymous gift-card browsing", () => {
  it("preserves the existing cards, denominations, prices and checkout settings without login", async () => {
    vi.stubEnv("GIFT_CARDS_STORAGE", "local"); vi.stubEnv("VERCEL", "0");
    const caller = giftCardRouter.createCaller({ req: new Request("http://localhost/api/trpc"), resHeaders: new Headers() });
    const cards = await caller.list();
    const xbox = cards.find((card) => card.slug === "xbox");
    expect(xbox?.imageUrl).toBeNull();
    expect(xbox?.backgroundUrl).toBeNull();
    expect((await caller.settings()).homeGiftCardsBackgroundUrl).toBeNull();
    for (const slug of ["playstation", "xbox", "shein"]) {
      const detail = await caller.bySlug({ slug });
      expect(detail?.card.status).toBe("AVAILABLE");
      expect(detail?.denominations.length).toBeGreaterThan(0);
      expect(detail?.denominations.every((item) => Number(item.sellingPriceLyd) > 0)).toBe(true);
      expect(detail?.settings.whatsappNumber).toBe("218935095091");
    }
    expect(cards.some((card) => card.status === "COMING_SOON")).toBe(true);
    expect(cards.every((card) => card.status !== "HIDDEN")).toBe(true);
    await expect(caller.admin.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
