export type GiftCardPricingSettings = {
  rate10To100: number;
  rateAbove100: number;
};

export type GiftCardPriceSource =
  | "MANUAL"
  | "SPECIAL_USD"
  | "RULE"
  | "UNAVAILABLE";

export const defaultGiftCardPricingSettings: GiftCardPricingSettings = {
  rate10To100: 10,
  rateAbove100: 9.7,
};

export function parsePriceNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function formatDecimal(value: number, scale: number) {
  const multiplier = 10 ** scale;
  return (Math.round(value * multiplier) / multiplier).toFixed(scale);
}

export function parsePricingRate(
  value: string | number | null | undefined,
  fallback: number,
) {
  const amount = parsePriceNumber(value);
  return amount !== null && amount > 0 ? amount : fallback;
}

export function resolveGiftCardPrice(
  denomination: {
    faceValue: string | number;
    manualSellingPriceLyd?: string | number | null;
    sellingPriceLyd?: string | number | null;
    specialPriceUsd?: string | number | null;
  },
  settings: GiftCardPricingSettings,
) {
  const manualPrice = parsePriceNumber(denomination.manualSellingPriceLyd);
  if (manualPrice !== null && manualPrice > 0) {
    return {
      sellingPriceLyd: formatDecimal(manualPrice, 3),
      priceSource: "MANUAL" as GiftCardPriceSource,
    };
  }

  const specialPriceUsd = parsePriceNumber(denomination.specialPriceUsd);
  if (specialPriceUsd !== null && specialPriceUsd > 0) {
    return {
      sellingPriceLyd: formatDecimal(specialPriceUsd * settings.rateAbove100, 3),
      priceSource: "SPECIAL_USD" as GiftCardPriceSource,
    };
  }

  const faceValue = parsePriceNumber(denomination.faceValue);
  if (faceValue === null || faceValue <= 0) {
    return {
      sellingPriceLyd: null,
      priceSource: "UNAVAILABLE" as GiftCardPriceSource,
    };
  }

  const rate = faceValue <= 100 ? settings.rate10To100 : settings.rateAbove100;
  if (!Number.isFinite(rate) || rate <= 0) {
    return {
      sellingPriceLyd: null,
      priceSource: "UNAVAILABLE" as GiftCardPriceSource,
    };
  }

  return {
    sellingPriceLyd: formatDecimal(faceValue * rate, 3),
    priceSource: "RULE" as GiftCardPriceSource,
  };
}

export function resolveGiftCardDenomination<T extends {
  faceValue: string | number;
  manualSellingPriceLyd?: string | number | null;
  sellingPriceLyd?: string | number | null;
  specialPriceUsd?: string | number | null;
}>(denomination: T, settings: GiftCardPricingSettings) {
  const manualSellingPriceLyd = denomination.manualSellingPriceLyd ?? null;
  const resolved = resolveGiftCardPrice(
    {
      ...denomination,
      manualSellingPriceLyd,
    },
    settings,
  );

  return {
    ...denomination,
    manualSellingPriceLyd,
    sellingPriceLyd: resolved.sellingPriceLyd,
    priceSource: resolved.priceSource,
  };
}
