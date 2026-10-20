import source from "../config/gift-card-catalog.json";
import { homeImageOverride, inheritGiftCardImages } from "../../server/gift-card-image-defaults";
import { resolveGiftCardDenomination } from "../../server/gift-card-pricing";
import type { Collections } from '../../server/cms/models';
type LocalGiftCard = Collections['giftCards'][number];
type LocalGiftCardDenomination = Collections['giftCardDenominations'][number];

type FileDates = { createdAt: string; updatedAt: string };
export type GiftCardCatalogFile = {
  settings: {
    whatsappNumber: string;
    homeGiftCardsBackgroundUrl: string | null;
    homeServicesBackgroundUrl: string | null;
    imageOverrides?: { giftCards?: boolean; services?: boolean };
    rate10To100: number;
    rateAbove100: number;
  };
  giftCards: Array<Omit<LocalGiftCard, keyof FileDates> & FileDates>;
  denominations: Array<Omit<LocalGiftCardDenomination, keyof FileDates | "sellingPriceLyd"> & FileDates>;
};

// One published file feeds the browser, API compatibility routes, and SEO.
// Browsing cards and composing WhatsApp orders never query a database.
export function createGiftCardCatalog(file: GiftCardCatalogFile) {
  const settings = {
    ...file.settings,
    whatsappNumber: file.settings.whatsappNumber.replace(/\D/g, ""),
    homeGiftCardsBackgroundUrl: homeImageOverride(file.settings.homeGiftCardsBackgroundUrl, "giftCards", file.settings.imageOverrides?.giftCards),
    homeServicesBackgroundUrl: homeImageOverride(file.settings.homeServicesBackgroundUrl, "services", file.settings.imageOverrides?.services),
  };
  const cards = file.giftCards.map(card => ({
    ...inheritGiftCardImages(card),
    createdAt: new Date(card.createdAt),
    updatedAt: new Date(card.updatedAt),
  }));
  const denominations = file.denominations.map(item => resolveGiftCardDenomination({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }, settings)).sort((a, b) => a.sortOrder - b.sortOrder || Number(a.faceValue) - Number(b.faceValue));
  const statusOrder = { AVAILABLE: 0, COMING_SOON: 1, UNAVAILABLE: 2, HIDDEN: 3 };
  const bySlug = (slug: string) => {
    const card = cards.find(item => item.slug === slug && item.status !== "HIDDEN");
    return card ? { card, denominations: denominations.filter(item => item.giftCardId === card.id), settings } : null;
  };
  return {
    settings: () => settings,
    bySlug,
    list: () => cards.filter(card => card.status !== "HIDDEN")
      .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName))
      .map(card => {
        const values = denominations.filter(item => item.giftCardId === card.id);
        const faceValues = values.map(item => Number(item.faceValue)).filter(Number.isFinite);
        return {
          ...card,
          denominations: values,
          denominationCount: values.length,
          valueRange: faceValues.length ? { min: Math.min(...faceValues), max: Math.max(...faceValues) } : null,
        };
      }),
  };
}

export const giftCardCatalog = createGiftCardCatalog(source as GiftCardCatalogFile);
