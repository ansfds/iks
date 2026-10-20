import { describe, expect, it } from "vitest";
import source from "../config/gift-card-catalog.json";
import { createGiftCardCatalog, giftCardCatalog, type GiftCardCatalogFile } from "./gift-card-catalog";
import { createGiftCardWhatsAppUrl, formatLyd } from "./giftCards";

describe("file-based gift cards", () => {
  it("preserves existing cards, denominations, unchanged prices and WhatsApp destination", () => {
    for (const [slug, faceValue, price] of [['xbox', 50, '500.000'], ['playstation', 100, '1000.000']] as const) {
      const detail = giftCardCatalog.bySlug(slug)!;
      expect(detail.card.status).toBe('AVAILABLE');
      const denomination = detail.denominations.find(item => Number(item.faceValue) === faceValue)!;
      expect(denomination.isAvailable).toBe(true);
      expect(denomination.sellingPriceLyd).toBe(price);
    }
    expect(giftCardCatalog.settings().whatsappNumber).toBe("218935095091");
  });

  it("uses an edited file price internally and in the prepared WhatsApp message", () => {
    const edited = structuredClone(source) as GiftCardCatalogFile;
    edited.giftCards.find(card => card.slug === "xbox")!.displayName = "Xbox Custom";
    const value = edited.denominations.find(item => item.giftCardId === 2)!;
    value.manualSellingPriceLyd = "173.500";
    const detail = createGiftCardCatalog(edited).bySlug("xbox")!;
    const denomination = detail.denominations.find(item => item.id === value.id)!;
    expect(denomination.sellingPriceLyd).toBe("173.500");
    const priceLyd = formatLyd(denomination.sellingPriceLyd)!;
    const url = new URL(createGiftCardWhatsAppUrl({ phone: detail.settings.whatsappNumber, cardName: detail.card.displayName, faceValue: denomination.faceValue, currency: denomination.currency, regionLabel: detail.card.regionLabel, priceLyd }));
    expect(url.hostname).toBe("web.whatsapp.com");
    expect(url.searchParams.get("phone")).toBe("218935095091");
    expect(url.searchParams.get("text")).toContain("Xbox Custom");
    expect(url.searchParams.get("text")).toContain(priceLyd);
    expect(url.searchParams.get("text")).toContain("$5");
  });

  it("does not publish hidden cards or invent missing card pages", () => {
    const edited = structuredClone(source) as GiftCardCatalogFile;
    edited.giftCards.find(card => card.slug === "xbox")!.status = "HIDDEN";
    const catalog = createGiftCardCatalog(edited);
    expect(catalog.bySlug("xbox")).toBeNull();
    expect(catalog.list().some(card => card.slug === "xbox")).toBe(false);
    expect(catalog.bySlug("missing-card")).toBeNull();
  });
});
