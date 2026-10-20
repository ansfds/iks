import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { optionalImageUrlInput, optionalNavigationInput } from "./media-url";
export const moneyPrecision = 6;
export const nullableNonNegativeDecimal = z
  .preprocess(
    value => (value === "" || value === undefined ? null : value),
    z.coerce.number().finite().nonnegative().nullable()
  )
  .transform(value => (value === null ? null : toDecimalString(value)));
export const requiredPositiveDecimal = z.coerce
  .number()
  .finite()
  .positive()
  .transform(toDecimalString);
export const requiredNonNegativeDecimal = z.coerce
  .number()
  .finite()
  .nonnegative()
  .transform(toDecimalString);
export const nullableString = z
  .preprocess(
    value => (value === "" || value === undefined ? null : value),
    z.string().trim().nullable()
  )
  .optional();
export const slugInput = z
  .string()
  .trim()
  .min(2)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must use lowercase letters, numbers, and hyphens only",
  });
export function toDecimalString(value: number) {
  return value.toFixed(moneyPrecision);
}
export function parseMoney(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
export function pickDefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}
export function rangesOverlap(input: {
  existingMinimum: string;
  existingMaximum: string;
  nextMinimum: string;
  nextMaximum: string;
}) {
  const existingMinimum = parseMoney(input.existingMinimum);
  const existingMaximum = parseMoney(input.existingMaximum);
  const nextMinimum = parseMoney(input.nextMinimum);
  const nextMaximum = parseMoney(input.nextMaximum);

  if (
    existingMinimum === null ||
    existingMaximum === null ||
    nextMinimum === null ||
    nextMaximum === null
  ) {
    return false;
  }

  return existingMinimum <= nextMaximum && existingMaximum >= nextMinimum;
}
export function ensureRange(minimumAmount: string, maximumAmount: string) {
  const min = parseMoney(minimumAmount);
  const max = parseMoney(maximumAmount);

  if (min === null || max === null || max < min) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Maximum amount must be greater than or equal to minimum amount",
    });
  }
}
export function getRateForService(
  service: { calculatorRateType: "buy" | "sell" | "calculator" },
  rate: {
    buyPrice: string | null;
    sellPrice: string | null;
    calculatorRate: string | null;
    isActive: boolean;
  }
) {
  if (!rate.isActive) return null;
  if (service.calculatorRateType === "buy") return parseMoney(rate.buyPrice);
  if (service.calculatorRateType === "sell") return parseMoney(rate.sellPrice);
  return parseMoney(rate.calculatorRate);
}
export function calculateCommission(input: {
  amount: number;
  commissionType: "percentage" | "fixed";
  commissionValue: string;
}) {
  const value = parseMoney(input.commissionValue) ?? 0;
  return input.commissionType === "percentage"
    ? (input.amount * value) / 100
    : value;
}
export const listInput = z
  .object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(50),
    search: z.string().trim().optional(),
  })
  .optional();
export const currencyFields = {
  symbol: z.string().trim().min(1).max(24),
  nameAr: z.string().trim().min(1).max(255),
  nameEn: nullableString,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  buyPrice: nullableNonNegativeDecimal.optional(),
  sellPrice: nullableNonNegativeDecimal.optional(),
  calculatorRate: nullableNonNegativeDecimal.optional(),
  rateIsActive: z.boolean().default(true),
};
export const countryFields = {
  nameAr: z.string().trim().min(1).max(255),
  nameEn: nullableString,
  slug: slugInput,
  isoCode: nullableString,
  flagEmoji: nullableString,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
};
export const serviceFields = {
  nameAr: z.string().trim().min(1).max(255),
  nameEn: nullableString,
  descriptionAr: nullableString,
  descriptionEn: nullableString,
  imageUrl: optionalImageUrlInput,
  icon: nullableString,
  href: optionalNavigationInput,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  isCalculatorEnabled: z.boolean().default(false),
  calculatorCurrencyId: z.number().int().positive().nullable().optional(),
  calculatorRateType: z
    .enum(["buy", "sell", "calculator"])
    .default("calculator"),
};
export const bankAccountFields = {
  countryId: z.number().int().positive(),
  currencyId: z.number().int().positive(),
  bankNameAr: z.string().trim().min(1).max(255),
  bankNameEn: nullableString,
  accountName: z.string().trim().min(1).max(255),
  accountNumber: z.string().trim().min(1).max(255),
  iban: nullableString,
  bankLogoUrl: optionalImageUrlInput,
  notesAr: nullableString,
  notesEn: nullableString,
  slug: slugInput,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
};
export const socialLinkFields = {
  platform: z.string().trim().min(1).max(80),
  label: nullableString,
  url: z.string().trim().url().max(500),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
};
export const trustIndicatorFields = {
  labelAr: z.string().trim().min(1).max(255),
  labelEn: nullableString,
  value: nullableString,
  unitAr: nullableString,
  unitEn: nullableString,
  descriptionAr: nullableString,
  descriptionEn: nullableString,
  icon: nullableString,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
};
export const announcementFields = {
  titleAr: z.string().trim().min(1).max(255),
  titleEn: nullableString,
  bodyAr: nullableString,
  bodyEn: nullableString,
  level: z.enum(["info", "success", "warning"]).default("info"),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().default(0),
};
