import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGiftCardWhatsAppMessage,
  createGiftCardWhatsAppUrl,
  GIFT_CARD_WHATSAPP_EMOJI,
  type GiftCardWhatsAppMessageInput,
} from "./giftCards";

afterEach(() => vi.unstubAllGlobals());
const phone = "218935095091";
const examples: Array<{ input: GiftCardWhatsAppMessageInput; expected: string }> = [
  {
    input: { cardName: "Xbox", regionLabel: "ريجن أمريكي", faceValue: "50.00", currency: "USD", priceLyd: "500 د.ل" },
    expected: "🎮 طلب شراء كرت Xbox\n\n🌎 الريجن: أمريكي\n💳 الفئة: $50\n💵 السعر الحالي: 500 د.ل\n\n✅ نبي نكمل الطلب ونتفق معاكم على طريقة الدفع.",
  },
  {
    input: { cardName: "PlayStation Store", regionLabel: "ريجن أمريكي", faceValue: "100.00", currency: "USD", priceLyd: "1000 د.ل" },
    expected: "🎮 طلب شراء كرت PlayStation Store\n\n🌎 الريجن: أمريكي\n💳 الفئة: $100\n💵 السعر الحالي: 1000 د.ل\n\n✅ نبي نكمل الطلب ونتفق معاكم على طريقة الدفع.",
  },
  {
    input: { cardName: "SHEIN", regionLabel: "دولي", faceValue: "500.00", currency: "USD", priceLyd: "4413.5 د.ل" },
    expected: "🎮 طلب شراء كرت SHEIN\n\n💳 الفئة: $500\n💵 السعر الحالي: 4413.5 د.ل\n\n✅ نبي نكمل الطلب ونتفق معاكم على طريقة الدفع.",
  },
];

describe("gift-card WhatsApp Unicode", () => {
  it.each(examples)("preserves exact raw text and single-encoded round trip for $input.cardName", ({ input, expected }) => {
    const message = createGiftCardWhatsAppMessage(input);
    expect(message).toBe(expected);
    expect(message).not.toContain("\uFFFD");
    expect(message).not.toContain("*");
    for (const target of ["web", "app"] as const) {
      const url = new URL(createGiftCardWhatsAppUrl({ ...input, phone }, target));
      // searchParams.get already decodes once. Never decodeURIComponent again.
      expect(url.searchParams.get("text")).toBe(message);
      expect(url.searchParams.get("phone")).toBe(phone);
      expect(url.toString()).not.toMatch(/%25F0|%25E2|%25D8|%25D9/i);
      expect(url.searchParams.get("text")).not.toContain("\\");
      expect(url.searchParams.get("text")).not.toContain("<br>");
    }
  });

  it("creates all five emojis with the required Unicode code points", () => {
    expect(Object.values(GIFT_CARD_WHATSAPP_EMOJI).map(value => value.codePointAt(0))).toEqual([0x1F3AE, 0x1F30E, 0x1F4B3, 0x1F4B5, 0x2705]);
    const message = createGiftCardWhatsAppMessage(examples[0].input);
    for (const point of [0x1F3AE, 0x1F30E, 0x1F4B3, 0x1F4B5, 0x2705]) expect(message).toContain(String.fromCodePoint(point));
    for (const text of ["طلب شراء كرت", "الريجن", "أمريكي", "الفئة", "السعر الحالي", "د.ل", "$50"]) expect(message).toContain(text);
  });

  it("uses plain text without formatting stars and preserves actual newlines", () => {
    const message = createGiftCardWhatsAppMessage(examples[0].input);
    expect(message.split("\n")).toHaveLength(7);
    expect(message).not.toContain("\\n");
    expect(message).not.toContain("%0A");
    expect(message).not.toContain("*");
    expect(message).toContain("طلب شراء كرت Xbox\n\n");
  });

  it("preserves percent signs, plus signs, Arabic and ampersands without extra decoding or Markdown escapes", () => {
    const input = { ...examples[0].input, cardName: "Xbox 100% + A&B_عربي" };
    const message = createGiftCardWhatsAppMessage(input);
    expect(new URL(createGiftCardWhatsAppUrl({ ...input, phone }, "web")).searchParams.get("text")).toBe(message);
    expect(message).toContain(input.cardName);
  });

  it("rejects existing replacement characters and unpaired surrogates instead of replacing them", () => {
    for (const cardName of ["Xbox\uFFFD", "Xbox\uD83C", "Xbox\uDFAE"]) {
      expect(() => createGiftCardWhatsAppUrl({ ...examples[0].input, cardName, phone })).toThrow("invalid Unicode");
    }
  });

  it("opens Web on desktop and the native composer on mobile without the corrupting redirect", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0" });
    expect(new URL(createGiftCardWhatsAppUrl({ ...examples[0].input, phone })).origin).toBe("https://web.whatsapp.com");
    for (const userAgent of ["Mozilla/5.0 (Linux; Android 15)", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)"]) {
      vi.stubGlobal("navigator", { userAgent });
      expect(new URL(createGiftCardWhatsAppUrl({ ...examples[0].input, phone })).protocol).toBe("whatsapp:");
    }
    expect(new URL(createGiftCardWhatsAppUrl({ ...examples[0].input, phone: "" }, "web")).searchParams.get("phone")).toBe(phone);
  });
});
