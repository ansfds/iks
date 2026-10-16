import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultGiftCardPricingSettings,
  parsePricingRate,
  resolveGiftCardPrice,
} from "./gift-card-pricing";
import { homeImageOverride, inheritGiftCardImages } from "./gift-card-image-defaults";

export type LocalGiftCardStatus =
  | "AVAILABLE"
  | "COMING_SOON"
  | "UNAVAILABLE"
  | "HIDDEN";

export type LocalHighlightEffect = "NONE" | "FLAME";

export type LocalGiftCard = {
  id: number;
  name: string;
  displayName: string;
  slug: string;
  description: string | null;
  regionCode: string;
  regionLabel: string;
  currency: string;
  imageUrl: string | null;
  backgroundUrl: string | null;
  status: LocalGiftCardStatus;
  sortOrder: number;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LocalGiftCardDenomination = {
  id: number;
  giftCardId: number;
  faceValue: string;
  currency: string;
  sellingPriceLyd: string | null;
  manualSellingPriceLyd: string | null;
  specialPriceUsd: string | null;
  isAvailable: boolean;
  isMostPopular: boolean;
  highlightEffect: LocalHighlightEffect;
  sortOrder: number;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type LocalGiftCardStore = {
  settings: {
    whatsappNumber: string;
    homeGiftCardsBackgroundUrl: string | null;
    homeServicesBackgroundUrl: string | null;
    imageOverrides?: { giftCards?: boolean; services?: boolean };
    rate10To100: number;
    rateAbove100: number;
  };
  giftCards: LocalGiftCard[];
  denominations: LocalGiftCardDenomination[];
};

const localStorePath = path.resolve(process.env.GIFT_CARDS_DATA_FILE || "data/gift-cards-local.json");
const now = () => new Date();

function defaultCard(input: {
  id: number;
  name: string;
  displayName: string;
  slug: string;
  description: string;
  status: LocalGiftCardStatus;
  sortOrder: number;
  regionCode?: string;
  regionLabel?: string;
}): LocalGiftCard {
  return {
    id: input.id,
    name: input.name,
    displayName: input.displayName,
    slug: input.slug,
    description: input.description,
    regionCode: input.regionCode ?? "US",
    regionLabel: input.regionLabel ?? "ريجن أمريكي",
    currency: "USD",
    backgroundUrl: null,
    imageUrl: null,
    status: input.status,
    sortOrder: input.sortOrder,
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now(),
  };
}

function defaultDenomination(input: {
  id: number;
  giftCardId: number;
  faceValue: number;
  specialPriceUsd?: number;
  isMostPopular?: boolean;
  highlightEffect?: LocalHighlightEffect;
  sortOrder: number;
}): LocalGiftCardDenomination {
  return {
    id: input.id,
    giftCardId: input.giftCardId,
    faceValue: input.faceValue.toFixed(2),
    currency: "USD",
    sellingPriceLyd: null,
    manualSellingPriceLyd: null,
    specialPriceUsd: input.specialPriceUsd
      ? input.specialPriceUsd.toFixed(2)
      : null,
    isAvailable: true,
    isMostPopular: input.isMostPopular ?? false,
    highlightEffect: input.highlightEffect ?? "NONE",
    sortOrder: input.sortOrder,
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now(),
  };
}

function createDefaultStore(): LocalGiftCardStore {
  const cards = [
    defaultCard({
      id: 1,
      name: "playstation",
      displayName: "PlayStation Store",
      slug: "playstation",
      description:
        "بطاقات PlayStation Store ريجن أمريكي. السعر النهائي يؤكد وقت الشراء عبر واتس أب.",
      status: "AVAILABLE",
      sortOrder: 1,
    }),
    defaultCard({
      id: 2,
      name: "xbox",
      displayName: "Xbox",
      slug: "xbox",
      description:
        "بطاقات Xbox ريجن أمريكي. اختر الفئة ثم تواصل عبر واتس أب لتأكيد السعر النهائي.",
      status: "AVAILABLE",
      sortOrder: 2,
    }),
    defaultCard({
      id: 3,
      name: "steam",
      displayName: "Steam",
      slug: "steam",
      description: "بطاقات Steam سيتم تفعيلها قريبًا.",
      status: "COMING_SOON",
      sortOrder: 3,
    }),
    defaultCard({
      id: 4,
      name: "apple",
      displayName: "Apple",
      slug: "apple",
      description: "بطاقات Apple سيتم تفعيلها قريبًا.",
      status: "COMING_SOON",
      sortOrder: 4,
    }),
    defaultCard({
      id: 5,
      name: "google-play",
      displayName: "Google Play",
      slug: "google-play",
      description: "بطاقات Google Play سيتم تفعيلها قريبًا.",
      status: "COMING_SOON",
      sortOrder: 5,
    }),
    defaultCard({
      id: 6,
      name: "nintendo",
      displayName: "Nintendo",
      slug: "nintendo",
      description: "بطاقات Nintendo سيتم تفعيلها قريبًا.",
      status: "COMING_SOON",
      sortOrder: 6,
    }),
    defaultCard({
      id: 7,
      name: "roblox",
      displayName: "Roblox",
      slug: "roblox",
      description: "بطاقات Roblox سيتم تفعيلها قريبًا.",
      status: "COMING_SOON",
      sortOrder: 7,
    }),
    defaultCard({
      id: 8,
      name: "razer",
      displayName: "Razer Gold",
      slug: "razer",
      description: "بطاقات Razer Gold سيتم تفعيلها قريبًا.",
      status: "COMING_SOON",
      sortOrder: 8,
    }),
    defaultCard({
      id: 9,
      name: "shein",
      displayName: "SHEIN Gift Card",
      slug: "shein",
      description:
        "بطاقات SHEIN بعروض خاصة على بعض الفئات. اختر الفئة ثم أكمل الطلب عبر واتس أب.",
      status: "AVAILABLE",
      sortOrder: 9,
      regionCode: "GLOBAL",
      regionLabel: "دولي",
    }),
  ];

  const playStationValues = [
    25, 30, 40, 50, 60, 70, 75, 80, 90, 100, 125, 150, 175, 200, 225, 250,
  ];
  const xboxValues = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
  const sheinValues = [
    { faceValue: 100 },
    { faceValue: 300, specialPriceUsd: 285 },
    { faceValue: 500, specialPriceUsd: 455 },
    { faceValue: 800, specialPriceUsd: 750 },
    { faceValue: 1000, specialPriceUsd: 905 },
  ];
  let nextId = 1;

  const denominations = [
    ...playStationValues.map((faceValue, index) =>
      defaultDenomination({
        id: nextId++,
        giftCardId: 1,
        faceValue,
        isMostPopular: faceValue === 50,
        highlightEffect: faceValue === 50 ? "FLAME" : "NONE",
        sortOrder: index + 1,
      }),
    ),
    ...xboxValues.map((faceValue, index) =>
      defaultDenomination({
        id: nextId++,
        giftCardId: 2,
        faceValue,
        isMostPopular: faceValue === 50,
        sortOrder: index + 1,
      }),
    ),
    ...sheinValues.map((item, index) =>
      defaultDenomination({
        id: nextId++,
        giftCardId: 9,
        faceValue: item.faceValue,
        specialPriceUsd: item.specialPriceUsd,
        isMostPopular: item.faceValue === 1000,
        highlightEffect: item.faceValue === 1000 ? "FLAME" : "NONE",
        sortOrder: index + 1,
      }),
    ),
  ];

  return {
    settings: {
      whatsappNumber: "218935095091",
      homeGiftCardsBackgroundUrl: null,
      homeServicesBackgroundUrl: null,
      rate10To100: defaultGiftCardPricingSettings.rate10To100,
      rateAbove100: defaultGiftCardPricingSettings.rateAbove100,
    },
    giftCards: cards,
    denominations,
  };
}

function parseDate(value: Date | string | undefined) {
  return value ? new Date(value) : now();
}

function formatOptionalDecimal(
  value: string | number | null | undefined,
  scale: number,
) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(scale) : null;
}

function withResolvedLocalPrices(store: LocalGiftCardStore) {
  return {
    ...store,
    denominations: store.denominations.map((denomination) => {
      const resolved = resolveGiftCardPrice(denomination, store.settings);
      return {
        ...denomination,
        sellingPriceLyd: resolved.sellingPriceLyd,
      };
    }),
  };
}

function ensureSeedData(store: LocalGiftCardStore) {
  const seed = createDefaultStore();
  const giftCards = [...store.giftCards];
  const denominations = [...store.denominations];
  const cardIdBySlug = new Map(giftCards.map((card) => [card.slug, card.id]));
  const newlySeededSlugs = new Set<string>();

  for (const seedCard of seed.giftCards) {
    if (cardIdBySlug.has(seedCard.slug)) continue;
    const id = nextLocalId(giftCards);
    const card = {
      ...seedCard,
      id,
      createdAt: now(),
      updatedAt: now(),
    };
    giftCards.push(card);
    cardIdBySlug.set(card.slug, card.id);
    newlySeededSlugs.add(card.slug);
  }

  const seedSlugByCardId = new Map(
    seed.giftCards.map((card) => [card.id, card.slug]),
  );

  for (const seedDenomination of seed.denominations) {
    const slug = seedSlugByCardId.get(seedDenomination.giftCardId);
    const giftCardId = slug ? cardIdBySlug.get(slug) : undefined;
    if (!slug || !giftCardId) continue;
    const shouldSeedDenominations =
      newlySeededSlugs.has(slug) ||
      !denominations.some((denomination) => denomination.giftCardId === giftCardId);
    if (!shouldSeedDenominations) continue;

    const exists = denominations.some(
      (denomination) =>
        denomination.giftCardId === giftCardId &&
        denomination.faceValue === seedDenomination.faceValue &&
        denomination.currency === seedDenomination.currency,
    );
    if (exists) continue;

    denominations.push({
      ...seedDenomination,
      id: nextLocalId(denominations),
      giftCardId,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  return { ...store, giftCards, denominations };
}

function normalizeStore(store: LocalGiftCardStore): LocalGiftCardStore {
  const settings = {
    whatsappNumber: store.settings?.whatsappNumber || "218935095091",
    homeGiftCardsBackgroundUrl: homeImageOverride(store.settings?.homeGiftCardsBackgroundUrl, "giftCards", store.settings?.imageOverrides?.giftCards),
    homeServicesBackgroundUrl: homeImageOverride(store.settings?.homeServicesBackgroundUrl, "services", store.settings?.imageOverrides?.services),
    imageOverrides: store.settings?.imageOverrides,
    rate10To100: parsePricingRate(
      store.settings?.rate10To100,
      defaultGiftCardPricingSettings.rate10To100,
    ),
    rateAbove100: parsePricingRate(
      store.settings?.rateAbove100,
      defaultGiftCardPricingSettings.rateAbove100,
    ),
  };

  const normalized: LocalGiftCardStore = {
    settings: {
      ...settings,
    },
    giftCards: (store.giftCards ?? []).map((card) => ({
      ...inheritGiftCardImages(card),
      description: card.description ?? null,
      createdBy: card.createdBy ?? null,
      updatedBy: card.updatedBy ?? null,
      createdAt: parseDate(card.createdAt),
      updatedAt: parseDate(card.updatedAt),
    })),
    denominations: (store.denominations ?? []).map((denomination) => {
      const hasManualField = Object.prototype.hasOwnProperty.call(
        denomination,
        "manualSellingPriceLyd",
      );
      const manualSellingPriceLyd = hasManualField
        ? denomination.manualSellingPriceLyd
        : denomination.sellingPriceLyd;

      return {
        ...denomination,
        faceValue: Number(denomination.faceValue).toFixed(2),
        sellingPriceLyd: formatOptionalDecimal(
          denomination.sellingPriceLyd,
          3,
        ),
        manualSellingPriceLyd: formatOptionalDecimal(
          manualSellingPriceLyd,
          3,
        ),
        specialPriceUsd: formatOptionalDecimal(denomination.specialPriceUsd, 2),
        createdBy: denomination.createdBy ?? null,
        updatedBy: denomination.updatedBy ?? null,
        createdAt: parseDate(denomination.createdAt),
        updatedAt: parseDate(denomination.updatedAt),
      };
    }),
  };

  return withResolvedLocalPrices(ensureSeedData(normalized));
}

async function writeStore(store: LocalGiftCardStore) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(store, null, 2), "utf8");
}

export async function readLocalGiftCardStore() {
  try {
    const raw = await readFile(localStorePath, "utf8");
    const store = normalizeStore(JSON.parse(raw) as LocalGiftCardStore);
    return store;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    const store = normalizeStore(createDefaultStore());
    await writeStore(store);
    return store;
  }
}

export async function updateLocalGiftCardStore(
  updater: (store: LocalGiftCardStore) => LocalGiftCardStore,
) {
  const current = await readLocalGiftCardStore();
  const next = normalizeStore(updater(current));
  await writeStore(next);
  return next;
}

export function nextLocalId(items: Array<{ id: number }>) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}
