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

export function createGiftCardWhatsAppUrl(input: {
  phone: string;
  cardName: string;
  regionLabel?: string | null;
  faceValue: string;
  currency: string;
  priceLyd: string;
}) {
  const cleanRegion = (input.regionLabel ?? "").replace(/^ريجن\s*/i, "").trim();
  const shouldShowRegion =
    cleanRegion &&
    !["دولي", "global", "international"].includes(cleanRegion.toLowerCase());
  const message = [
    `🎮 *طلب شراء كرت ${input.cardName}*`,
    "",
    shouldShowRegion ? `🌎 *الريجن:* ${cleanRegion}` : null,
    `💳 *الفئة:* ${formatFaceValue(input.faceValue, input.currency)}`,
    `💵 *السعر الحالي:* ${input.priceLyd}`,
    "",
    "✅ نبي نكمل الطلب ونتفق معاكم على طريقة الدفع.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return `https://wa.me/${input.phone}?text=${encodeURIComponent(message)}`;
}
