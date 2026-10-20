import { readContent, upsertSetting } from "./cms/store";
import type { Collections } from "./cms/models";
import {
  defaultGiftCardPricingSettings,
  parsePricingRate,
  resolveGiftCardPrice,
} from "./gift-card-pricing";
import {
  homeImageOverride,
  inheritGiftCardImages,
} from "./gift-card-image-defaults";

export type ContentGiftCard = Collections["giftCards"][number];
type ContentGiftStore = {
  giftCards: Collections["giftCards"];
  denominations: Collections["giftCardDenominations"];
  settings: {
    whatsappNumber: string;
    homeGiftCardsBackgroundUrl: string | null;
    homeServicesBackgroundUrl: string | null;
    imageOverrides?: { giftCards?: boolean; services?: boolean };
    rate10To100: number;
    rateAbove100: number;
  };
};
const keys = {
  whatsappNumber: "gift_cards_whatsapp_number",
  homeGiftCardsBackgroundUrl: "home_gift_cards_background_url",
  homeServicesBackgroundUrl: "home_services_background_url",
  rate10To100: "gift_card_rate_10_to_100",
  rateAbove100: "gift_card_rate_above_100",
};
export function readContentGiftCardStore(): ContentGiftStore {
  const c = readContent().collections;
  const value = (key: string) =>
    c.siteSettings.find(row => row.key === key)?.value;
  const image = (key: string, section: "giftCards" | "services") =>
    homeImageOverride(
      value(key),
      section,
      c.siteSettings.find(row => row.key === key)?.updatedBy != null
    );
  return {
    giftCards: c.giftCards.map(inheritGiftCardImages),
    denominations: c.giftCardDenominations,
    settings: {
      whatsappNumber: value(keys.whatsappNumber) || "218935095091",
      homeGiftCardsBackgroundUrl: image(
        keys.homeGiftCardsBackgroundUrl,
        "giftCards"
      ),
      homeServicesBackgroundUrl: image(
        keys.homeServicesBackgroundUrl,
        "services"
      ),
      rate10To100: parsePricingRate(
        value(keys.rate10To100),
        defaultGiftCardPricingSettings.rate10To100
      ),
      rateAbove100: parsePricingRate(
        value(keys.rateAbove100),
        defaultGiftCardPricingSettings.rateAbove100
      ),
    },
  };
}
export function nextContentId(name: "giftCards" | "giftCardDenominations") {
  const document = readContent();
  return document.nextIds[name]++;
}
export function updateContentGiftCardStore(
  update: (store: ContentGiftStore) => ContentGiftStore
) {
  const previous = readContentGiftCardStore();
  const next = update(previous);
  const c = readContent().collections;
  c.giftCards = next.giftCards;
  c.giftCardDenominations = next.denominations;
  if (
    next.settings.rate10To100 !== previous.settings.rate10To100 ||
    next.settings.rateAbove100 !== previous.settings.rateAbove100
  ) {
    c.giftCardDenominations = c.giftCardDenominations.map(row => ({
      ...row,
      sellingPriceLyd: resolveGiftCardPrice(row, next.settings).sellingPriceLyd,
    }));
  }
  for (const key of Object.keys(keys) as Array<keyof typeof keys>) {
    if (next.settings[key] !== previous.settings[key])
      upsertSetting(
        keys[key],
        next.settings[key] == null ? null : String(next.settings[key]),
        key.includes("Background") ? "image" : "text"
      );
  }
  return next;
}
