// Content schema. Dates are ISO strings on disk and Date objects within server handlers.
import { z } from "zod";
import { safeMediaUrl, safeNavigationUrl } from "../media-url";

export const countriesSchema = z
  .object({
    id: z.number().int().safe().positive(),
    nameAr: z.string().max(255),
    nameEn: z.string().max(255).nullable().default(null),
    slug: z.string().max(180),
    isoCode: z.string().max(8).nullable().default(null),
    flagEmoji: z.string().max(16).nullable().default(null),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().safe().default(0),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const currenciesSchema = z
  .object({
    id: z.number().int().safe().positive(),
    symbol: z.string().max(24),
    nameAr: z.string().max(255),
    nameEn: z.string().max(255).nullable().default(null),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().safe().default(0),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const exchangeRatesSchema = z
  .object({
    id: z.number().int().safe().positive(),
    currencyId: z.number().int().safe().positive(),
    buyPrice: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      )
      .nullable()
      .default(null),
    sellPrice: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      )
      .nullable()
      .default(null),
    calculatorRate: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      )
      .nullable()
      .default(null),
    isActive: z.boolean().default(true),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const exchangeRateHistorySchema = z
  .object({
    id: z.number().int().safe().positive(),
    currencyId: z.number().int().safe().positive(),
    field: z.enum(["buy", "sell", "calculator"]),
    oldValue: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      )
      .nullable()
      .default(null),
    newValue: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      )
      .nullable()
      .default(null),
    changedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const servicesSchema = z
  .object({
    id: z.number().int().safe().positive(),
    nameAr: z.string().max(255),
    nameEn: z.string().max(255).nullable().default(null),
    descriptionAr: z.string().max(24000).nullable().default(null),
    descriptionEn: z.string().max(24000).nullable().default(null),
    imageUrl: z
      .string()
      .max(500)
      .refine(safeMediaUrl, "Use permanent HTTPS or /images/ URLs")
      .nullable()
      .default(null),
    icon: z.string().max(80).nullable().default(null),
    href: z
      .string()
      .max(500)
      .refine(safeNavigationUrl, "Invalid link")
      .nullable()
      .default(null),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().safe().default(0),
    isCalculatorEnabled: z.boolean().default(false),
    calculatorCurrencyId: z
      .number()
      .int()
      .safe()
      .positive()
      .nullable()
      .default(null),
    calculatorRateType: z
      .enum(["buy", "sell", "calculator"])
      .default("calculator"),
    createdBy: z.number().int().safe().nullable().default(null),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const commissionRulesSchema = z
  .object({
    id: z.number().int().safe().positive(),
    serviceId: z.number().int().safe().positive(),
    minimumAmount: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      ),
    maximumAmount: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      ),
    commissionType: z.enum(["percentage", "fixed"]),
    commissionValue: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      ),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().safe().default(0),
    createdBy: z.number().int().safe().nullable().default(null),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const bankAccountsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    countryId: z.number().int().safe().positive(),
    currencyId: z.number().int().safe().positive(),
    bankNameAr: z.string().max(255),
    bankNameEn: z.string().max(255).nullable().default(null),
    accountName: z.string().max(255),
    accountNumber: z.string().max(255),
    iban: z.string().max(255).nullable().default(null),
    bankLogoUrl: z
      .string()
      .max(500)
      .refine(safeMediaUrl, "Use permanent HTTPS or /images/ URLs")
      .nullable()
      .default(null),
    notesAr: z.string().max(24000).nullable().default(null),
    notesEn: z.string().max(24000).nullable().default(null),
    slug: z.string().max(180),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().safe().default(0),
    createdBy: z.number().int().safe().nullable().default(null),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const giftCardsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    name: z.string().max(255),
    displayName: z.string().max(255),
    slug: z.string().max(180),
    description: z.string().max(24000).nullable().default(null),
    regionCode: z.string().max(20).default("US"),
    regionLabel: z.string().max(120).default("ريجن أمريكي"),
    currency: z.string().max(12).default("USD"),
    imageUrl: z
      .string()
      .max(500)
      .refine(safeMediaUrl, "Use permanent HTTPS or /images/ URLs")
      .nullable()
      .default(null),
    backgroundUrl: z
      .string()
      .max(500)
      .refine(safeMediaUrl, "Use permanent HTTPS or /images/ URLs")
      .nullable()
      .default(null),
    status: z
      .enum(["AVAILABLE", "COMING_SOON", "UNAVAILABLE", "HIDDEN"])
      .default("COMING_SOON"),
    sortOrder: z.number().int().safe().default(0),
    createdBy: z.number().int().safe().nullable().default(null),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const giftCardDenominationsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    giftCardId: z.number().int().safe().positive(),
    faceValue: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      ),
    currency: z.string().max(12).default("USD"),
    sellingPriceLyd: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      )
      .nullable()
      .default(null),
    manualSellingPriceLyd: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      )
      .nullable()
      .default(null),
    specialPriceUsd: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/)
      .refine(
        v => Number.isFinite(Number(v)) && Number(v) <= 999999999999,
        "Invalid decimal"
      )
      .nullable()
      .default(null),
    isActive: z.boolean().default(true),
    isAvailable: z.boolean().default(true),
    isMostPopular: z.boolean().default(false),
    highlightEffect: z.enum(["NONE", "FLAME"]).default("NONE"),
    sortOrder: z.number().int().safe().default(0),
    createdBy: z.number().int().safe().nullable().default(null),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const siteSettingsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    key: z.string().max(180),
    value: z.string().max(24000).nullable().default(null),
    type: z.enum(["text", "url", "image", "json"]).default("text"),
    group: z.string().max(120).nullable().default("general"),
    isPublic: z.boolean().default(true),
    sortOrder: z.number().int().safe().default(0),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const socialLinksSchema = z
  .object({
    id: z.number().int().safe().positive(),
    platform: z.string().max(80),
    label: z.string().max(120).nullable().default(null),
    url: z.string().max(500).refine(safeMediaUrl, "Use a permanent HTTPS link"),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().safe().default(0),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const trustIndicatorsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    labelAr: z.string().max(255),
    labelEn: z.string().max(255).nullable().default(null),
    value: z.string().max(80).nullable().default(null),
    unitAr: z.string().max(80).nullable().default(null),
    unitEn: z.string().max(80).nullable().default(null),
    descriptionAr: z.string().max(24000).nullable().default(null),
    descriptionEn: z.string().max(24000).nullable().default(null),
    icon: z.string().max(80).nullable().default(null),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().safe().default(0),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const announcementsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    titleAr: z.string().max(255),
    titleEn: z.string().max(255).nullable().default(null),
    bodyAr: z.string().max(24000).nullable().default(null),
    bodyEn: z.string().max(24000).nullable().default(null),
    level: z.enum(["info", "success", "warning"]).default("info"),
    isActive: z.boolean().default(true),
    startsAt: z.coerce.date().nullable().default(null),
    endsAt: z.coerce.date().nullable().default(null),
    sortOrder: z.number().int().safe().default(0),
    updatedBy: z.number().int().safe().nullable().default(null),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const galleryItemsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    title: z.string().max(255),
    titleAr: z.string().max(255).nullable().default(null),
    description: z.string().max(24000).nullable().default(null),
    descriptionAr: z.string().max(24000).nullable().default(null),
    imageUrl: z
      .string()
      .max(500)
      .refine(safeMediaUrl, "Use permanent HTTPS or /images/ URLs"),
    category: z.string().max(50).default("all"),
    sortOrder: z.number().int().safe().nullable().default(0),
    isActive: z.boolean().default(true),
    createdAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const newsEventsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    title: z.string().max(255),
    titleAr: z.string().max(255).nullable().default(null),
    excerpt: z.string().max(24000).nullable().default(null),
    excerptAr: z.string().max(24000).nullable().default(null),
    content: z.string().max(24000),
    contentAr: z.string().max(24000).nullable().default(null),
    imageUrl: z
      .string()
      .max(500)
      .refine(safeMediaUrl, "Use permanent HTTPS or /images/ URLs")
      .nullable()
      .default(null),
    eventDate: z.coerce.date().nullable().default(null),
    isPublished: z.boolean().default(true),
    createdAt: z.coerce.date().default(() => new Date()),
  })
  .strict();
export const testimonialsSchema = z
  .object({
    id: z.number().int().safe().positive(),
    authorName: z.string().max(255),
    authorNameAr: z.string().max(255).nullable().default(null),
    role: z.string().max(255).nullable().default(null),
    roleAr: z.string().max(255).nullable().default(null),
    quote: z.string().max(24000),
    quoteAr: z.string().max(24000).nullable().default(null),
    rating: z.number().int().safe().default(5),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().safe().nullable().default(0),
    createdAt: z.coerce.date().default(() => new Date()),
  })
  .strict();

export const collectionsSchema = z
  .object({
    countries: z.array(countriesSchema).max(10000),
    currencies: z.array(currenciesSchema).max(10000),
    exchangeRates: z.array(exchangeRatesSchema).max(10000),
    exchangeRateHistory: z.array(exchangeRateHistorySchema).max(10000),
    services: z.array(servicesSchema).max(10000),
    commissionRules: z.array(commissionRulesSchema).max(10000),
    bankAccounts: z.array(bankAccountsSchema).max(10000),
    giftCards: z.array(giftCardsSchema).max(10000),
    giftCardDenominations: z.array(giftCardDenominationsSchema).max(10000),
    siteSettings: z.array(siteSettingsSchema).max(10000),
    socialLinks: z.array(socialLinksSchema).max(10000),
    trustIndicators: z.array(trustIndicatorsSchema).max(10000),
    announcements: z.array(announcementsSchema).max(10000),
    galleryItems: z.array(galleryItemsSchema).max(10000),
    newsEvents: z.array(newsEventsSchema).max(10000),
    testimonials: z.array(testimonialsSchema).max(10000),
  })
  .strict();
export type Collections = z.infer<typeof collectionsSchema>;
export type CollectionName = keyof Collections;
