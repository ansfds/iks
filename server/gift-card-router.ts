import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, not } from "drizzle-orm";
import { z } from "zod";
import {
  giftCardDenominations,
  giftCards,
  siteSettings,
} from "../db/schema";
import { createRouter, adminQuery, publicQuery } from "./middleware";
import {
  nextLocalId,
  readLocalGiftCardStore,
  updateLocalGiftCardStore,
  type LocalGiftCard,
} from "./gift-card-local-store";
import {
  defaultGiftCardPricingSettings,
  formatDecimal,
  parsePricingRate,
  resolveGiftCardDenomination,
  resolveGiftCardPrice,
  type GiftCardPricingSettings,
} from "./gift-card-pricing";
import { homeImageOverride, inheritGiftCardImages } from "./gift-card-image-defaults";
import { getDb } from "./queries/connection";
import { withGiftCardStorage as withLocalGiftCardFallback } from "./gift-card-storage";
import { giftCardCatalog } from "../src/lib/gift-card-catalog";

const defaultGiftCardSettings = {
  whatsappNumber: "218935095091",
  rate10To100: defaultGiftCardPricingSettings.rate10To100,
  rateAbove100: defaultGiftCardPricingSettings.rateAbove100,
};

const settingKeys = {
  whatsappNumber: "gift_cards_whatsapp_number",
  homeGiftCardsBackgroundUrl: "home_gift_cards_background_url",
  homeServicesBackgroundUrl: "home_services_background_url",
  rate10To100: "gift_card_rate_10_to_100",
  rateAbove100: "gift_card_rate_above_100",
} as const;

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
    (value) => (value === "" || value === undefined ? null : value),
    z.string().trim().nullable(),
  )
  .optional();

const optionalLydPrice = z
  .preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().finite().nonnegative().nullable(),
  )
  .transform((value) => (value === null ? null : value.toFixed(3)))
  .optional();

const optionalUsdPrice = z
  .preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().finite().nonnegative().nullable(),
  )
  .transform((value) => (value === null ? null : value.toFixed(2)))
  .optional();

const faceValueInput = z.coerce
  .number()
  .finite()
  .positive()
  .transform((value) => value.toFixed(2));

const giftCardCreateInput = z.object({
  name: z.string().trim().min(1).max(255),
  displayName: z.string().trim().min(1).max(255),
  slug: slugInput,
  description: nullableString,
  regionCode: z.string().trim().min(1).max(20).default("US"),
  regionLabel: z.string().trim().min(1).max(120).default("ريجن أمريكي"),
  currency: z.string().trim().min(1).max(12).default("USD"),
  imageUrl: nullableString,
  backgroundUrl: nullableString,
  status: z.enum(statusValues).default("COMING_SOON"),
  sortOrder: z.number().int().default(0),
});

const giftCardUpdateInput = giftCardCreateInput.partial().extend({
  id: z.number().int().positive(),
});

const denominationCreateInput = z.object({
  giftCardId: z.number().int().positive(),
  faceValue: faceValueInput,
  currency: z.string().trim().min(1).max(12).default("USD"),
  sellingPriceLyd: optionalLydPrice,
  manualSellingPriceLyd: optionalLydPrice,
  specialPriceUsd: optionalUsdPrice,
  isAvailable: z.boolean().default(true),
  isMostPopular: z.boolean().default(false),
  highlightEffect: z.enum(highlightEffectValues).default("NONE"),
  sortOrder: z.number().int().default(0),
});

const denominationUpdateInput = denominationCreateInput.partial().extend({
  id: z.number().int().positive(),
});

const settingsUpdateInput = z.object({
  whatsappNumber: z.string().trim().min(5).max(32),
  homeGiftCardsBackgroundUrl: nullableString,
  homeServicesBackgroundUrl: nullableString,
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
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits || defaultGiftCardSettings.whatsappNumber;
}

function normalizeSettingsRate(
  value: string | number | null | undefined,
  fallback: number,
) {
  return parsePricingRate(value, fallback);
}

function serializeSettingsRate(value: number) {
  return formatDecimal(value, 3).replace(/\.?0+$/, "");
}

function getPricingSettings(settings: {
  rate10To100: number;
  rateAbove100: number;
}): GiftCardPricingSettings {
  return {
    rate10To100: normalizeSettingsRate(
      settings.rate10To100,
      defaultGiftCardSettings.rate10To100,
    ),
    rateAbove100: normalizeSettingsRate(
      settings.rateAbove100,
      defaultGiftCardSettings.rateAbove100,
    ),
  };
}

function toOptionalDecimalString(
  value: string | number | null | undefined,
  scale: number,
) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? formatDecimal(amount, scale) : null;
}

function resolveDenominations<T extends {
  faceValue: string | number;
  manualSellingPriceLyd?: string | number | null;
  sellingPriceLyd?: string | number | null;
  specialPriceUsd?: string | number | null;
}>(denominations: T[], settings: GiftCardPricingSettings) {
  return denominations.map((denomination) =>
    resolveGiftCardDenomination(denomination, settings),
  );
}

function getResolvedDenominationValues(
  denomination: {
    faceValue: string | number;
    manualSellingPriceLyd?: string | number | null;
    specialPriceUsd?: string | number | null;
  },
  settings: GiftCardPricingSettings,
) {
  const resolved = resolveGiftCardPrice(denomination, settings);
  return {
    sellingPriceLyd: resolved.sellingPriceLyd,
    manualSellingPriceLyd: toOptionalDecimalString(
      denomination.manualSellingPriceLyd,
      3,
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

function getFaceValueRange(denominations: Array<{ faceValue: string | number }>) {
  if (denominations.length === 0) return null;
  const values = denominations
    .map((denomination) => Number(denomination.faceValue))
    .filter(Number.isFinite);
  if (values.length === 0) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function compareGiftCardStatus(
  a: { status: (typeof statusValues)[number]; sortOrder?: number | null; displayName: string },
  b: { status: (typeof statusValues)[number]; sortOrder?: number | null; displayName: string },
) {
  return (
    statusSortRank[a.status] - statusSortRank[b.status] ||
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
    a.displayName.localeCompare(b.displayName)
  );
}

function ensureLocalSlugIsUnique(
  cards: LocalGiftCard[],
  slug: string,
  ignoreId?: number,
) {
  const exists = cards.some((card) => card.slug === slug && card.id !== ignoreId);
  if (exists) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "هذا الرابط المختصر مستخدم مسبقًا.",
    });
  }
}

async function readDbGiftCardSettings() {
  const rows = await getDb()
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, Object.values(settingKeys)));

  const values = Object.fromEntries(
    rows.map((setting) => [setting.key, setting.value ?? ""]),
  );
  const imageSetting = (key: string, section: "giftCards" | "services") => {
    const row = rows.find((setting) => setting.key === key);
    return homeImageOverride(row?.value, section, row?.updatedBy != null);
  };

  return {
    whatsappNumber: normalizePhone(values[settingKeys.whatsappNumber]),
    homeGiftCardsBackgroundUrl: imageSetting(settingKeys.homeGiftCardsBackgroundUrl, "giftCards"),
    homeServicesBackgroundUrl: imageSetting(settingKeys.homeServicesBackgroundUrl, "services"),
    rate10To100: normalizeSettingsRate(
      values[settingKeys.rate10To100],
      defaultGiftCardSettings.rate10To100,
    ),
    rateAbove100: normalizeSettingsRate(
      values[settingKeys.rateAbove100],
      defaultGiftCardSettings.rateAbove100,
    ),
  };
}

async function readLocalGiftCardSettings() {
  const store = await readLocalGiftCardStore();
  return {
    whatsappNumber: normalizePhone(store.settings.whatsappNumber),
    homeGiftCardsBackgroundUrl: store.settings.homeGiftCardsBackgroundUrl,
    homeServicesBackgroundUrl: store.settings.homeServicesBackgroundUrl,
    rate10To100: normalizeSettingsRate(
      store.settings.rate10To100,
      defaultGiftCardSettings.rate10To100,
    ),
    rateAbove100: normalizeSettingsRate(
      store.settings.rateAbove100,
      defaultGiftCardSettings.rateAbove100,
    ),
  };
}

async function assertDbUniqueSlug(slug: string, ignoreId?: number) {
  const conditions = [eq(giftCards.slug, slug)];
  if (ignoreId) {
    conditions.push(not(eq(giftCards.id, ignoreId)));
  }

  const existing = await getDb()
    .select({ id: giftCards.id })
    .from(giftCards)
    .where(and(...conditions))
    .limit(1);

  if (existing.length > 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "هذا الرابط المختصر مستخدم مسبقًا.",
    });
  }
}

async function getDbCardsWithDenominations(includeHidden = false) {
  const settings = await readDbGiftCardSettings();
  const cards = await getDb()
    .select()
    .from(giftCards)
    .where(includeHidden ? undefined : not(eq(giftCards.status, "HIDDEN")))
    .orderBy(
      asc(giftCards.status),
      asc(giftCards.sortOrder),
      asc(giftCards.displayName),
    );

  if (cards.length === 0) return [];

  const rawDenominations = await getDb()
    .select()
    .from(giftCardDenominations)
    .where(
      inArray(
        giftCardDenominations.giftCardId,
        cards.map((card) => card.id),
      ),
    )
    .orderBy(
      asc(giftCardDenominations.sortOrder),
      asc(giftCardDenominations.faceValue),
    );
  const denominations = resolveDenominations(rawDenominations, settings);

  const grouped = groupDenominations(denominations);
  return cards.map((card) => {
    const cardDenominations = grouped.get(card.id) ?? [];
    return {
      ...inheritGiftCardImages(card),
      denominations: cardDenominations,
      denominationCount: cardDenominations.length,
      valueRange: getFaceValueRange(cardDenominations),
    };
  });
}

async function getLocalCardsWithDenominations(includeHidden = false) {
  const store = await readLocalGiftCardStore();
  const settings = await readLocalGiftCardSettings();
  const cards = store.giftCards
    .filter((card) => includeHidden || card.status !== "HIDDEN")
    .sort(compareGiftCardStatus);

  const denominations = resolveDenominations([...store.denominations], settings).sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      Number(a.faceValue) - Number(b.faceValue),
  );
  const grouped = groupDenominations(denominations);

  return cards.map((card) => {
    const cardDenominations = grouped.get(card.id) ?? [];
    return {
      ...card,
      denominations: cardDenominations,
      denominationCount: cardDenominations.length,
      valueRange: getFaceValueRange(cardDenominations),
    };
  });
}

async function getDbGiftCardById(id: number) {
  const rows = await getDb()
    .select()
    .from(giftCards)
    .where(eq(giftCards.id, id))
    .limit(1);

  const card = rows[0] ? inheritGiftCardImages(rows[0]) : null;
  if (!card) return null;

  const settings = await readDbGiftCardSettings();
  const rawDenominations = await getDb()
    .select()
    .from(giftCardDenominations)
    .where(eq(giftCardDenominations.giftCardId, card.id))
    .orderBy(
      asc(giftCardDenominations.sortOrder),
      asc(giftCardDenominations.faceValue),
    );
  const denominations = resolveDenominations(rawDenominations, settings);

  return { card, denominations };
}

async function getLocalGiftCardById(id: number) {
  const store = await readLocalGiftCardStore();
  const card = store.giftCards.find((item) => item.id === id) ?? null;
  if (!card) return null;

  const settings = await readLocalGiftCardSettings();
  const denominations = resolveDenominations(store.denominations, settings)
    .filter((denomination) => denomination.giftCardId === card.id)
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        Number(a.faceValue) - Number(b.faceValue),
    );

  return { card, denominations };
}

async function createDbGiftCard(input: GiftCardCreateInput, userId: number) {
  await assertDbUniqueSlug(input.slug);
  const result = await getDb().insert(giftCards).values({
    ...input,
    createdBy: userId,
    updatedBy: userId,
  });
  return { success: true, id: Number(result[0].insertId) };
}

async function createLocalGiftCard(input: GiftCardCreateInput, userId: number) {
  const store = await updateLocalGiftCardStore((current) => {
    ensureLocalSlugIsUnique(current.giftCards, input.slug);
    const id = nextLocalId(current.giftCards);
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
    id: Math.max(...store.giftCards.map((card) => card.id)),
  };
}

async function updateDbGiftCard(input: GiftCardUpdateInput, userId: number) {
  if (input.slug) {
    await assertDbUniqueSlug(input.slug, input.id);
  }

  const { id, ...data } = input;
  await getDb()
    .update(giftCards)
    .set({ ...pickDefined(data), updatedBy: userId })
    .where(eq(giftCards.id, id));

  return { success: true };
}

async function updateLocalGiftCard(input: GiftCardUpdateInput, userId: number) {
  await updateLocalGiftCardStore((current) => {
    if (input.slug) {
      ensureLocalSlugIsUnique(current.giftCards, input.slug, input.id);
    }

    return {
      ...current,
      giftCards: current.giftCards.map((card) =>
        card.id === input.id
          ? {
              ...card,
              ...pickDefined(input),
              updatedBy: userId,
              updatedAt: new Date(),
            }
          : card,
      ),
    };
  });
  return { success: true };
}

async function hideDbGiftCard(id: number, userId: number) {
  await getDb()
    .update(giftCards)
    .set({ status: "HIDDEN", updatedBy: userId })
    .where(eq(giftCards.id, id));
  return { success: true };
}

async function hideLocalGiftCard(id: number, userId: number) {
  await updateLocalGiftCardStore((current) => ({
    ...current,
    giftCards: current.giftCards.map((card) =>
      card.id === id
        ? {
            ...card,
            status: "HIDDEN",
            updatedBy: userId,
            updatedAt: new Date(),
          }
        : card,
    ),
  }));
  return { success: true };
}

async function createDbDenomination(
  input: DenominationCreateInput,
  userId: number,
) {
  const card = await getDb()
    .select({ id: giftCards.id })
    .from(giftCards)
    .where(eq(giftCards.id, input.giftCardId))
    .limit(1);

  if (!card[0]) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Gift Card غير موجود.",
    });
  }

  const settings = getPricingSettings(await readDbGiftCardSettings());
  const manualSellingPriceLyd =
    input.manualSellingPriceLyd ?? input.sellingPriceLyd ?? null;
  const resolved = getResolvedDenominationValues(
    {
      faceValue: input.faceValue,
      manualSellingPriceLyd,
      specialPriceUsd: input.specialPriceUsd ?? null,
    },
    settings,
  );

  const result = await getDb().insert(giftCardDenominations).values({
    ...input,
    ...resolved,
    createdBy: userId,
    updatedBy: userId,
  });
  return { success: true, id: Number(result[0].insertId) };
}

async function createLocalDenomination(
  input: DenominationCreateInput,
  userId: number,
) {
  const store = await updateLocalGiftCardStore((current) => {
    const cardExists = current.giftCards.some(
      (card) => card.id === input.giftCardId,
    );
    if (!cardExists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Gift Card غير موجود.",
      });
    }

    const duplicate = current.denominations.some(
      (denomination) =>
        denomination.giftCardId === input.giftCardId &&
        denomination.faceValue === input.faceValue &&
        denomination.currency === input.currency,
    );
    if (duplicate) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "هذه الفئة موجودة مسبقًا لهذا الكرت.",
      });
    }

    const id = nextLocalId(current.denominations);
    const createdAt = new Date();
    const manualSellingPriceLyd =
      input.manualSellingPriceLyd ?? input.sellingPriceLyd ?? null;
    const resolved = getResolvedDenominationValues(
      {
        faceValue: input.faceValue,
        manualSellingPriceLyd,
        specialPriceUsd: input.specialPriceUsd ?? null,
      },
      getPricingSettings(current.settings),
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
    id: Math.max(...store.denominations.map((denomination) => denomination.id)),
  };
}

async function updateDbDenomination(
  input: DenominationUpdateInput,
  userId: number,
) {
  const { id, ...data } = input;
  const rows = await getDb()
    .select()
    .from(giftCardDenominations)
    .where(eq(giftCardDenominations.id, id))
    .limit(1);

  if (!rows[0]) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "الفئة غير موجودة.",
    });
  }

  const settings = getPricingSettings(await readDbGiftCardSettings());
  const manualSellingPriceLyd =
    data.manualSellingPriceLyd ?? data.sellingPriceLyd ?? rows[0].manualSellingPriceLyd;
  const merged = {
    faceValue: data.faceValue ?? rows[0].faceValue,
    manualSellingPriceLyd,
    specialPriceUsd: data.specialPriceUsd ?? rows[0].specialPriceUsd,
  };
  const resolved = getResolvedDenominationValues(merged, settings);

  await getDb()
    .update(giftCardDenominations)
    .set({
      ...pickDefined(data),
      sellingPriceLyd: resolved.sellingPriceLyd,
      manualSellingPriceLyd: resolved.manualSellingPriceLyd,
      specialPriceUsd: resolved.specialPriceUsd,
      updatedBy: userId,
    })
    .where(eq(giftCardDenominations.id, id));
  return { success: true };
}

async function updateLocalDenomination(
  input: DenominationUpdateInput,
  userId: number,
) {
  await updateLocalGiftCardStore((current) => ({
    ...current,
    denominations: current.denominations.map((denomination) => {
      if (denomination.id !== input.id) return denomination;
      const manualSellingPriceLyd =
        input.manualSellingPriceLyd ??
        input.sellingPriceLyd ??
        denomination.manualSellingPriceLyd;
      const merged = {
        ...denomination,
        ...pickDefined(input),
        manualSellingPriceLyd,
      };
      const resolved = getResolvedDenominationValues(
        merged,
        getPricingSettings(current.settings),
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

async function deleteDbDenomination(id: number) {
  await getDb()
    .delete(giftCardDenominations)
    .where(eq(giftCardDenominations.id, id));
  return { success: true };
}

async function deleteLocalDenomination(id: number) {
  await updateLocalGiftCardStore((current) => ({
    ...current,
    denominations: current.denominations.filter(
      (denomination) => denomination.id !== id,
    ),
  }));
  return { success: true };
}

async function repriceAllDbDenominations(settings: GiftCardPricingSettings) {
  const denominations = await getDb().select().from(giftCardDenominations);

  for (const denomination of denominations) {
    const resolved = getResolvedDenominationValues(denomination, settings);
    await getDb()
      .update(giftCardDenominations)
      .set({
        sellingPriceLyd: resolved.sellingPriceLyd,
        updatedAt: new Date(),
      })
      .where(eq(giftCardDenominations.id, denomination.id));
  }
}

async function updateDbSettings(input: SettingsUpdateInput, userId: number) {
  const settings = [
    {
      key: settingKeys.whatsappNumber,
      value: normalizePhone(input.whatsappNumber),
      type: "text" as const,
      sortOrder: 1,
    },
    {
      key: settingKeys.homeGiftCardsBackgroundUrl,
      value: input.homeGiftCardsBackgroundUrl || null,
      type: "image" as const,
      sortOrder: 2,
    },
    {
      key: settingKeys.homeServicesBackgroundUrl,
      value: input.homeServicesBackgroundUrl || null,
      type: "image" as const,
      sortOrder: 3,
    },
    {
      key: settingKeys.rate10To100,
      value: serializeSettingsRate(input.rate10To100),
      type: "text" as const,
      sortOrder: 4,
    },
    {
      key: settingKeys.rateAbove100,
      value: serializeSettingsRate(input.rateAbove100),
      type: "text" as const,
      sortOrder: 5,
    },
  ];

  for (const setting of settings) {
    await getDb()
      .insert(siteSettings)
      .values({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        group: "gift_cards",
        isPublic: true,
        sortOrder: setting.sortOrder,
        updatedBy: userId,
      })
      .onDuplicateKeyUpdate({
        set: {
          value: setting.value,
          type: setting.type,
          group: "gift_cards",
          isPublic: true,
          sortOrder: setting.sortOrder,
          updatedBy: userId,
        },
      });
  }

  await repriceAllDbDenominations(getPricingSettings(input));

  return { success: true };
}

async function updateLocalSettings(input: SettingsUpdateInput) {
  await updateLocalGiftCardStore((current) => ({
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
  list: publicQuery.query(() => giftCardCatalog.list()),

  settings: publicQuery.query(() => giftCardCatalog.settings()),

  bySlug: publicQuery
    .input(z.object({ slug: slugInput }))
    .query(({ input }) => giftCardCatalog.bySlug(input.slug)),

  admin: createRouter({
    list: adminQuery.query(async () =>
      withLocalGiftCardFallback(
        "admin list",
        () => getDbCardsWithDenominations(true),
        () => getLocalCardsWithDenominations(true),
      ),
    ),

    getById: adminQuery
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) =>
        withLocalGiftCardFallback(
          "admin detail",
          () => getDbGiftCardById(input.id),
          () => getLocalGiftCardById(input.id),
        ),
      ),

    create: adminQuery
      .input(giftCardCreateInput)
      .mutation(async ({ input, ctx }) =>
        withLocalGiftCardFallback(
          "admin create card",
          () => createDbGiftCard(input, ctx.user.id),
          () => createLocalGiftCard(input, ctx.user.id),
        ),
      ),

    update: adminQuery
      .input(giftCardUpdateInput)
      .mutation(async ({ input, ctx }) =>
        withLocalGiftCardFallback(
          "admin update card",
          () => updateDbGiftCard(input, ctx.user.id),
          () => updateLocalGiftCard(input, ctx.user.id),
        ),
      ),

    delete: adminQuery
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) =>
        withLocalGiftCardFallback(
          "admin hide card",
          () => hideDbGiftCard(input.id, ctx.user.id),
          () => hideLocalGiftCard(input.id, ctx.user.id),
        ),
      ),

    denominations: createRouter({
      create: adminQuery
        .input(denominationCreateInput)
        .mutation(async ({ input, ctx }) =>
          withLocalGiftCardFallback(
            "admin create denomination",
            () => createDbDenomination(input, ctx.user.id),
            () => createLocalDenomination(input, ctx.user.id),
          ),
        ),

      update: adminQuery
        .input(denominationUpdateInput)
        .mutation(async ({ input, ctx }) =>
          withLocalGiftCardFallback(
            "admin update denomination",
            () => updateDbDenomination(input, ctx.user.id),
            () => updateLocalDenomination(input, ctx.user.id),
          ),
        ),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input }) =>
          withLocalGiftCardFallback(
            "admin delete denomination",
            () => deleteDbDenomination(input.id),
            () => deleteLocalDenomination(input.id),
          ),
        ),
    }),

    settings: createRouter({
      get: adminQuery.query(async () =>
        withLocalGiftCardFallback(
          "admin settings",
          () => readDbGiftCardSettings(),
          () => readLocalGiftCardSettings(),
        ),
      ),

      update: adminQuery
        .input(settingsUpdateInput)
        .mutation(async ({ input, ctx }) =>
          withLocalGiftCardFallback(
            "admin update settings",
            () => updateDbSettings(input, ctx.user.id),
            () => updateLocalSettings(input),
          ),
        ),
    }),
  }),
});
