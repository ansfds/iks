export const giftCardStatusLabels = {
  AVAILABLE: "متوفر",
  COMING_SOON: "قريبًا",
  UNAVAILABLE: "غير متوفر",
  HIDDEN: "مخفي",
} as const;

export const giftCardHighlightLabels = {
  NONE: "بدون تأثير",
  FLAME: "Flame",
} as const;

export function formatFaceValue(value: string | number, currency = "USD") {
  const amount = Number(value);
  const displayValue = Number.isInteger(amount)
    ? amount.toFixed(0)
    : amount.toFixed(2);

  if (currency.toUpperCase() === "USD") {
    return `$${displayValue}`;
  }

  return `${displayValue} ${currency}`;
}

export function formatLyd(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return `${new Intl.NumberFormat("ar-LY", {
    maximumFractionDigits: 3,
  }).format(amount)} د.ل`;
}

export function hasValidLydPrice(value: string | number | null | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

export const GIFT_CARD_WHATSAPP_EMOJI = {
  game: String.fromCodePoint(0x1F3AE),
  globe: String.fromCodePoint(0x1F30E),
  card: String.fromCodePoint(0x1F4B3),
  money: String.fromCodePoint(0x1F4B5),
  check: String.fromCodePoint(0x2705),
} as const;

export type GiftCardWhatsAppMessageInput = {
  cardName: string;
  regionLabel?: string | null;
  faceValue: string;
  currency: string;
  priceLyd: string;
};

export function createGiftCardWhatsAppMessage(input: GiftCardWhatsAppMessageInput) {
  const cleanRegion = (input.regionLabel ?? "").replace(/^ريجن\s*/i, "").trim();
  const shouldShowRegion =
    cleanRegion &&
    !["دولي", "global", "international"].includes(cleanRegion.toLowerCase());
  const message = [
    `${GIFT_CARD_WHATSAPP_EMOJI.game} طلب شراء كرت ${input.cardName}`,
    "",
    shouldShowRegion ? `${GIFT_CARD_WHATSAPP_EMOJI.globe} الريجن: ${cleanRegion}` : null,
    `${GIFT_CARD_WHATSAPP_EMOJI.card} الفئة: ${formatFaceValue(input.faceValue, input.currency)}`,
    `${GIFT_CARD_WHATSAPP_EMOJI.money} السعر الحالي: ${input.priceLyd}`,
    "",
    `${GIFT_CARD_WHATSAPP_EMOJI.check} نبي نكمل الطلب ونتفق معاكم على طريقة الدفع.`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  // URLSearchParams converts unpaired UTF-16 surrogates to U+FFFD. Refuse
  // corrupted source data before that conversion instead of repairing it.
  if (/\uFFFD|[\uD800-\uDFFF]/u.test(message)) {
    throw new Error("Gift-card WhatsApp message contains invalid Unicode source data.");
  }
  return message;
}

export type GiftCardWhatsAppTarget = "web" | "app";

export function createGiftCardWhatsAppUrl(
  input: GiftCardWhatsAppMessageInput & { phone: string },
  target: GiftCardWhatsAppTarget = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "app" : "web",
) {
  const message = createGiftCardWhatsAppMessage(input);
  if (import.meta.env?.DEV && typeof window !== "undefined") {
    console.log("WHATSAPP RAW MESSAGE:", message);
    console.log("WHATSAPP CODEPOINTS:", Array.from(message).map(char => `${char} U+${char.codePointAt(0)!.toString(16).toUpperCase()}`));
  }

  // Observed wa.me 302 responses replace the five emojis with U+FFFD.
  // Its API landing page also corrupts the preview. Go to the composer directly.
  const url = new URL(target === "app" ? "whatsapp://send" : "https://web.whatsapp.com/send");
  url.searchParams.set("phone", input.phone.replace(/\D/g, "") || "218935095091");
  url.searchParams.set("text", message);
  return url.toString();
}
