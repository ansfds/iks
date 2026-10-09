import { describe, expect, it } from "vitest";
import { createGiftCardWhatsAppUrl } from "./giftCards";

function decodeWhatsAppMessage(url: string) {
  const encoded = new URL(url).searchParams.get("text");
  return encoded ? decodeURIComponent(encoded) : "";
}

describe("gift card WhatsApp messages", () => {
  it("includes region for PlayStation orders", () => {
    const message = decodeWhatsAppMessage(
      createGiftCardWhatsAppUrl({
        phone: "218935095091",
        cardName: "PlayStation Store",
        regionLabel: "ريجن أمريكي",
        faceValue: "50.00",
        currency: "USD",
        priceLyd: "500 د.ل",
      }),
    );

    expect(message).toContain("🎮 *طلب شراء كرت PlayStation Store*");
    expect(message).toContain("🌎 *الريجن:* أمريكي");
    expect(message).toContain("💳 *الفئة:* $50");
    expect(message).toContain("💵 *السعر الحالي:* 500 د.ل");
  });

  it("omits misleading region for global SHEIN orders", () => {
    const message = decodeWhatsAppMessage(
      createGiftCardWhatsAppUrl({
        phone: "218935095091",
        cardName: "SHEIN",
        regionLabel: "دولي",
        faceValue: "1000.00",
        currency: "USD",
        priceLyd: "8778.5 د.ل",
      }),
    );

    expect(message).toContain("🎮 *طلب شراء كرت SHEIN*");
    expect(message).not.toContain("الريجن");
    expect(message).toContain("💳 *الفئة:* $1000");
    expect(message).toContain("💵 *السعر الحالي:* 8778.5 د.ل");
  });
});
