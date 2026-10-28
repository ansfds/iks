import { partialInput } from "./partial-input";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, adminQuery, publicQuery } from "./middleware";
import {
  nextContentId,
  readContentGiftCardStore,
  updateContentGiftCardStore,
  type ContentGiftCard,
} from "./gift-card-content-store";
import {
  defaultGiftCardPricingSettings,
  formatDecimal,
  parsePricingRate,
  resolveGiftCardDenomination,
  resolveGiftCardPrice,
  type GiftCardPricingSettings,
} from "./gift-card-pricing";

import { optionalImageUrlInput } from "./media-url";
import { deleteRow, readContent } from "./cms/store";
const defaultGiftCardSettings = {
  whatsappNumber: "218935095091",
  rate10To100: defaultGiftCardPricingSettings.rate10To100,
  rateAbove100: defaultGiftCardPricingSettings.rateAbove100,
};
const statusValues = [
  "AVAILABLE",
  "COMING_SOON",
  "UNAVAILABLE",
  "HIDDEN",
] as const;
const highlightEffectValues = ["NONE", "FLAME"] as const;
const statusSortRank: Record<(typeof statusValues)[number], number> = {
  AVAILABLE: 0,
  COMING_SOON: 1,
  UNAVAILABLE: 2,
  HIDDEN: 3,
};
const slugInput = z
  .string()
  .trim()
  .min(2)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must use lowercase letters, numbers, and hyphens only",
  });
const nullableString = z
  .preprocess(
    value => (value === "" || value === undefined ? null : value),
    z.string().trim().nullable()
  )
  .optional();
const optionalLydPrice = z
  .preprocess(
    value => (value === "" || value === undefined ? null : value),
    z.coerce.number().finite().nonnegative().nullable()
  )
  .transform(value => (value === null ? null : value.toFixed(3)))
  .optional();
const optionalUsdPrice = z
  .preprocess(
    value => (value === "" || value === undefined ? null : value),
    z.coerce.number().finite().nonnegative().nullable()
  )
  .transform(value => (value === null ? null : value.toFixed(2)))
  .optional();
const faceValueInput = z.coerce
  .number()
  .finite()
  .positive()
  .transform(value => value.toFixed(2));
const giftCardCreateInput = z.object({
  name: z.string().trim().min(1).max(255),
  displayName: z.string().trim().min(1).max(255),
  slug: slugInput,
  description: nullableString,
  regionCode: z.string().trim().min(1).max(20).default("US"),
  regionLabel: z.string().trim().min(1).max(120).default("ريجن أمريكي"),
  currency: z.string().trim().min(1).max(12).default("USD"),
  imageUrl: optionalImageUrlInput,
  backgroundUrl: optionalImageUrlInput,
  status: z.enum(statusValues).default("COMING_SOON"),
  sortOrder: z.number().int().default(0),
});
const giftCardUpdateInput = partialInput(giftCardCreateInput).extend({
  id: z.number().int().positive(),
});
const denominationCreateInput = z.object({
  giftCardId: z.number().int().positive(),
  faceValue: faceValueInput,
  currency: z.string().trim().min(1).max(12).default("USD"),
  sellingPriceLyd: optionalLydPrice,
  manualSellingPriceLyd: optionalLydPrice,
  specialPriceUsd: optionalUsdPrice,
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isMostPopular: z.boolean().default(false),
  highlightEffect: z.enum(highlightEffectValues).default("NONE"),
  sortOrder: z.number().int().default(0),
});
const denominationUpdateInput = partialInput(denominationCreateInput).extend({
  id: z.number().int().positive(),
});
const settingsUpdateInput = z.object({
  whatsappNumber: z.string().trim().min(5).max(32),
  homeGiftCardsBackgroundUrl: optionalImageUrlInput,
  homeServicesBackgroundUrl: optionalImageUrlInput,
  rate10To100: z.coerce.number().finite().positive(),
  rateAbove100: z.coerce.number().finite().positive(),
});
type GiftCardCreateInput = z.infer<typeof giftCardCreateInput>;
type GiftCardUpdateInput = z.infer<typeof giftCardUpdateInput>;
type DenominationCreateInput = z.infer<typeof denominationCreateInput>;
type DenominationUpdateInput = z.infer<typeof denominationUpdateInput>;
type SettingsUpdateInput = z.infer<typeof settingsUpdateInput>;
type DenominationLike = {
  giftCardId: number;
  faceValue: string | number;
};
function pickDefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}
function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits || defaultGiftCardSettings.whatsappNumber;
}
function normalizeSettingsRate(
  value: string | number | null | undefined,
  fallback: number
) {
  return parsePricingRate(value, fallback);
}
function getPricingSettings(settings: {
  rate10To100: number;
  rateAbove100: number;
}): GiftCardPricingSettings {
  return {
    rate10To100: normalizeSettingsRate(
      settings.rate10To100,
      defaultGiftCardSettings.rate10To100
    ),
    rateAbove100: normalizeSettingsRate(
      settings.rateAbove100,
      defaultGiftCardSettings.rateAbove100
    ),
  };
}
function toOptionalDecimalString(
  value: string | number | null | undefined,
  scale: number
) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? formatDecimal(amount, scale) : null;
}
function resolveDenominations<
  T extends {
    faceValue: string | number;
    manualSellingPriceLyd?: string | number | null;
    sellingPriceLyd?: string | number | null;
    specialPriceUsd?: string | number | null;
  },
>(denominations: T[], settings: GiftCardPricingSettings) {
  return denominations.map(denomination =>
    resolveGiftCardDenomination(denomination, settings)
  );
}
function getResolvedDenominationValues(
  denomination: {
    faceValue: string | number;
    manualSellingPriceLyd?: string | number | null;
    specialPriceUsd?: string | number | null;
  },
  settings: GiftCardPricingSettings
) {
  const resolved = resolveGiftCardPrice(denomination, settings);
  return {
    sellingPriceLyd: resolved.sellingPriceLyd,
    manualSellingPriceLyd: toOptionalDecimalString(
      denomination.manualSellingPriceLyd,
      3
    ),
    specialPriceUsd: toOptionalDecimalString(denomination.specialPriceUsd, 2),
  };
}
function groupDenominations<T extends DenominationLike>(denominations: T[]) {
  const grouped = new Map<number, T[]>();
  for (const denomination of denominations) {
    const items = grouped.get(denomination.giftCardId) ?? [];
    items.push(denomination);
    grouped.set(denomination.giftCardId, items);
  }
  return grouped;
}
function getFaceValueRange(
  denominations: Array<{ faceValue: string | number }>
) {
  if (denominations.length === 0) return null;
  const values = denominations
    .map(denomination => Number(denomination.faceValue))
    .filter(Number.isFinite);
  if (values.length === 0) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
function compareGiftCardStatus(
  a: {
    status: (typeof statusValues)[number];
    sortOrder?: number | null;
    displayName: string;
  },
  b: {
    status: (typeof statusValues)[number];
    sortOrder?: number | null;
    displayName: string;
  }
) {
  return (
    statusSortRank[a.status] - statusSortRank[b.status] ||
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
    a.displayName.localeCompare(b.displayName)
  );
}
function ensureContentSlugIsUnique(
  cards: ContentGiftCard[],
  slug: string,
  ignoreId?: number
) {
  const exists = cards.some(card => card.slug === slug && card.id !== ignoreId);
  if (exists) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "هذا الرابط المختصر مستخدم مسبقًا.",
    });
  }
}
async function readContentGiftCardSettings() {
  const store = await readContentGiftCardStore();
  return {
    whatsappNumber: normalizePhone(store.settings.whatsappNumber),
    homeGiftCardsBackgroundUrl: store.settings.homeGiftCardsBackgroundUrl,
    homeServicesBackgroundUrl: store.settings.homeServicesBackgroundUrl,
    rate10To100: normalizeSettingsRate(
      store.settings.rate10To100,
      defaultGiftCardSettings.rate10To100
    ),
    rateAbove100: normalizeSettingsRate(
      store.settings.rateAbove100,
      defaultGiftCardSettings.rateAbove100
    ),
  };
}
async function getContentCardsWithDenominations(includeHidden = false) {
  const store = await readContentGiftCardStore();
  const settings = await readContentGiftCardSettings();
  const cards = store.giftCards
    .filter(card => includeHidden || card.status !== "HIDDEN")
    .sort(compareGiftCardStatus);

  const denominations = resolveDenominations(
    store.denominations.filter(row=>includeHidden||row.isActive),
    settings
  ).sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      Number(a.faceValue) - Number(b.faceValue)
  );
  const grouped = groupDenominations(denominations);

  return cards.map(card => {
    const cardDenominations = grouped.get(card.id) ?? [];
    return {
      ...card,
      denominations: cardDenominations,
      denominationCount: cardDenominations.length,
      valueRange: getFaceValueRange(cardDenominations),
    };
  });
}
async function getContentGiftCardById(id: number) {
  const store = await readContentGiftCardStore();
  const card = store.giftCards.find(item => item.id === id) ?? null;
  if (!card) return null;

  const settings = await readContentGiftCardSettings();
  const denominations = resolveDenominations(store.denominations, settings)
    .filter(denomination => denomination.giftCardId === card.id)
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        Number(a.faceValue) - Number(b.faceValue)
    );

  return { card, denominations };
}
async function createContentGiftCard(
  input: GiftCardCreateInput,
  userId: number
) {
  const store = await updateContentGiftCardStore(current => {
    ensureContentSlugIsUnique(current.giftCards, input.slug);
    const id = nextContentId("giftCards");
    const createdAt = new Date();
    return {
      ...current,
      giftCards: [
        ...current.giftCards,
        {
          id,
          name: input.name,
          displayName: input.displayName,
          slug: input.slug,
          description: input.description ?? null,
          regionCode: input.regionCode,
          regionLabel: input.regionLabel,
          currency: input.currency,
          imageUrl: input.imageUrl ?? null,
          backgroundUrl: input.backgroundUrl ?? null,
          status: input.status,
          sortOrder: input.sortOrder,
          createdBy: userId,
          updatedBy: userId,
          createdAt,
          updatedAt: createdAt,
        },
      ],
    };
  });

  return {
    success: true,
    id: Math.max(...store.giftCards.map(card => card.id)),
  };
}
async function updateContentGiftCard(
  input: GiftCardUpdateInput,
  userId: number
) {
  await updateContentGiftCardStore(current => {
    if (input.slug) {
      ensureContentSlugIsUnique(current.giftCards, input.slug, input.id);
    }

    return {
      ...current,
      giftCards: current.giftCards.map(card =>
        card.id === input.id
          ? {
              ...card,
              ...pickDefined(input),
              updatedBy: userId,
              updatedAt: new Date(),
            }
          : card
      ),
    };
  });
  return { success: true };
}
async function createContentDenomination(
  input: DenominationCreateInput,
  userId: number
) {
  const store = await updateContentGiftCardStore(current => {
    const cardExists = current.giftCards.some(
      card => card.id === input.giftCardId
    );
    if (!cardExists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Gift Card غير موجود.",
      });
    }

    const duplicate = current.denominations.some(
      denomination =>
        denomination.giftCardId === input.giftCardId &&
        denomination.faceValue === input.faceValue &&
        denomination.currency === input.currency
    );
    if (duplicate) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "هذه الفئة موجودة مسبقًا لهذا الكرت.",
      });
    }

    const id = nextContentId("giftCardDenominations");
    const createdAt = new Date();
    const manualSellingPriceLyd =
      input.manualSellingPriceLyd ?? input.sellingPriceLyd ?? null;
    const resolved = getResolvedDenominationValues(
      {
        faceValue: input.faceValue,
        manualSellingPriceLyd,
        specialPriceUsd: input.specialPriceUsd ?? null,
      },
      getPricingSettings(current.settings)
    );
    return {
      ...current,
      denominations: [
        ...current.denominations,
        {
          id,
          giftCardId: input.giftCardId,
          faceValue: input.faceValue,
          currency: input.currency,
          sellingPriceLyd: resolved.sellingPriceLyd,
          manualSellingPriceLyd: resolved.manualSellingPriceLyd,
          specialPriceUsd: resolved.specialPriceUsd,
          isActive: input.isActive,
          isAvailable: input.isAvailable,
          isMostPopular: input.isMostPopular,
          highlightEffect: input.highlightEffect,
          sortOrder: input.sortOrder,
          createdBy: userId,
          updatedBy: userId,
          createdAt,
          updatedAt: createdAt,
        },
      ],
    };
  });

  return {
    success: true,
    id: Math.max(...store.denominations.map(denomination => denomination.id)),
  };
}
async function updateContentDenomination(
  input: DenominationUpdateInput,
  userId: number
) {
  await updateContentGiftCardStore(current => ({
    ...current,
    denominations: current.denominations.map(denomination => {
      if (denomination.id !== input.id) return denomination;
      const manualSellingPriceLyd =
        input.manualSellingPriceLyd !== undefined
          ? input.manualSellingPriceLyd
          : input.sellingPriceLyd !== undefined
            ? input.sellingPriceLyd
            : denomination.manualSellingPriceLyd;
      const merged = {
        ...denomination,
        ...pickDefined(input),
        manualSellingPriceLyd,
      };
      const resolved = getResolvedDenominationValues(
        merged,
        getPricingSettings(current.settings)
      );
      return {
        ...merged,
        sellingPriceLyd: resolved.sellingPriceLyd,
        manualSellingPriceLyd: resolved.manualSellingPriceLyd,
        specialPriceUsd: resolved.specialPriceUsd,
        updatedBy: userId,
        updatedAt: new Date(),
      };
    }),
  }));
  return { success: true };
}
async function updateContentSettings(input: SettingsUpdateInput) {
  await updateContentGiftCardStore(current => ({
    ...current,
    settings: {
      whatsappNumber: normalizePhone(input.whatsappNumber),
      homeGiftCardsBackgroundUrl: input.homeGiftCardsBackgroundUrl || null,
      homeServicesBackgroundUrl: input.homeServicesBackgroundUrl || null,
      imageOverrides: {
        giftCards: Boolean(input.homeGiftCardsBackgroundUrl),
        services: Boolean(input.homeServicesBackgroundUrl),
      },
      rate10To100: input.rate10To100,
      rateAbove100: input.rateAbove100,
    },
  }));
  return { success: true };
}
export const giftCardRouter = createRouter({
  list: publicQuery.query(async () => (await getContentCardsWithDenominations()).map(publicCard)),
  settings: publicQuery.query(publicSettings),
  bySlug: publicQuery
    .input(z.object({ slug: slugInput }))
    .query(async ({ input }) => {
      const card = (await getContentCardsWithDenominations()).map(publicCard).find(
        row => row.slug === input.slug
      );
      return card
        ? {
            card,
            denominations: card.denominations,
            settings: await publicSettings(),
          }
        : null;
    }),
  admin: createRouter({
    list: adminQuery.query(() => getContentCardsWithDenominations(true)),
    getById: adminQuery
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => getContentGiftCardById(input.id)),
    create: adminQuery
      .input(giftCardCreateInput)
      .mutation(({ input, ctx }) => createContentGiftCard(input, ctx.user.id)),
    update: adminQuery.input(giftCardUpdateInput).mutation(({ input, ctx }) => {
      if (!readContent().collections.giftCards.some(row => row.id === input.id))
        throw new TRPCError({ code: "NOT_FOUND" });
      return updateContentGiftCard(input, ctx.user.id);
    }),
    delete: adminQuery
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        for (const row of [...readContent().collections.giftCardDenominations])
          if (row.giftCardId === input.id)
            deleteRow("giftCardDenominations", row.id);
        deleteRow("giftCards", input.id);
        return { success: true };
      }),
    denominations: createRouter({
      create: adminQuery
        .input(denominationCreateInput)
        .mutation(({ input, ctx }) =>
          createContentDenomination(input, ctx.user.id)
        ),
      update: adminQuery
        .input(denominationUpdateInput)
        .mutation(({ input, ctx }) => {
          if (
            !readContent().collections.giftCardDenominations.some(
              row => row.id === input.id
            )
          )
            throw new TRPCError({ code: "NOT_FOUND" });
          return updateContentDenomination(input, ctx.user.id);
        }),
      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(({ input }) => {
          deleteRow("giftCardDenominations", input.id);
          return { success: true };
        }),
    }),
    settings: createRouter({
      get: adminQuery.query(readContentGiftCardSettings),
      update: adminQuery
        .input(settingsUpdateInput)
        .mutation(({ input }) => updateContentSettings(input)),
    }),
  }),
});

// Selling prices remain in a private RLS-protected table. The public catalog
// contains face values and availability; a price is agreed at purchase time.
function publicCard(card: Awaited<ReturnType<typeof getContentCardsWithDenominations>>[number]) {
  return {...card,denominations:card.denominations.map(row=>({
    ...row,sellingPriceLyd:null,manualSellingPriceLyd:null,specialPriceUsd:null,
  }))};
}
async function publicSettings() {
  const {whatsappNumber,homeGiftCardsBackgroundUrl,homeServicesBackgroundUrl} = await readContentGiftCardSettings();
  return {whatsappNumber,homeGiftCardsBackgroundUrl,homeServicesBackgroundUrl};
}
