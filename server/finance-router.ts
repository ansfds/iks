import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  activityLogs,
  announcements,
  bankAccounts,
  commissionRules,
  countries,
  currencies,
  exchangeRateHistory,
  exchangeRates,
  services,
  siteSettings,
  socialLinks,
  trustIndicators,
} from "../db/schema";
import { createRouter, adminQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

const moneyPrecision = 6;

const nullableNonNegativeDecimal = z
  .preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().finite().nonnegative().nullable(),
  )
  .transform((value) => (value === null ? null : toDecimalString(value)));

const requiredPositiveDecimal = z.coerce
  .number()
  .finite()
  .positive()
  .transform(toDecimalString);

const requiredNonNegativeDecimal = z.coerce
  .number()
  .finite()
  .nonnegative()
  .transform(toDecimalString);

const nullableString = z
  .preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.string().trim().nullable(),
  )
  .optional();

const slugInput = z
  .string()
  .trim()
  .min(2)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must use lowercase letters, numbers, and hyphens only",
  });

function toDecimalString(value: number) {
  return value.toFixed(moneyPrecision);
}

export function parseMoney(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickDefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

async function logActivity(
  ctx: { user?: { id: number }; req: Request },
  action: string,
  entityType: string,
  entityId?: number,
  metadata?: Record<string, unknown>,
) {
  await getDb().insert(activityLogs).values({
    userId: ctx.user?.id,
    action,
    entityType,
    entityId,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    ipAddress: getClientIp(ctx.req) ?? undefined,
  });
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

async function assertNoCommissionOverlap(input: {
  serviceId: number;
  minimumAmount: string;
  maximumAmount: string;
  isActive: boolean;
  ignoreId?: number;
}) {
  if (!input.isActive) return;

  const db = getDb();
  const conditions = [
    eq(commissionRules.serviceId, input.serviceId),
    eq(commissionRules.isActive, true),
    sql`${commissionRules.minimumAmount} <= ${input.maximumAmount}`,
    sql`${commissionRules.maximumAmount} >= ${input.minimumAmount}`,
  ];

  if (input.ignoreId) {
    conditions.push(ne(commissionRules.id, input.ignoreId));
  }

  const overlapping = await db
    .select({
      id: commissionRules.id,
      minimumAmount: commissionRules.minimumAmount,
      maximumAmount: commissionRules.maximumAmount,
    })
    .from(commissionRules)
    .where(and(...conditions))
    .limit(1);

  if (overlapping.length > 0) {
    const rule = overlapping[0];
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Commission range overlaps with rule #${rule.id} (${rule.minimumAmount}-${rule.maximumAmount})`,
    });
  }
}

function getRateForService(
  service: { calculatorRateType: "buy" | "sell" | "calculator" },
  rate: {
    buyPrice: string | null;
    sellPrice: string | null;
    calculatorRate: string | null;
    isActive: boolean;
  },
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

const listInput = z
  .object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(50),
    search: z.string().trim().optional(),
  })
  .optional();

const currencyFields = {
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

const countryFields = {
  nameAr: z.string().trim().min(1).max(255),
  nameEn: nullableString,
  slug: slugInput,
  isoCode: nullableString,
  flagEmoji: nullableString,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
};

const serviceFields = {
  nameAr: z.string().trim().min(1).max(255),
  nameEn: nullableString,
  descriptionAr: nullableString,
  descriptionEn: nullableString,
  imageUrl: nullableString,
  icon: nullableString,
  href: nullableString,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  isCalculatorEnabled: z.boolean().default(false),
  calculatorCurrencyId: z.number().int().positive().nullable().optional(),
  calculatorRateType: z.enum(["buy", "sell", "calculator"]).default("calculator"),
};

const bankAccountFields = {
  countryId: z.number().int().positive(),
  currencyId: z.number().int().positive(),
  bankNameAr: z.string().trim().min(1).max(255),
  bankNameEn: nullableString,
  accountName: z.string().trim().min(1).max(255),
  accountNumber: z.string().trim().min(1).max(255),
  iban: nullableString,
  bankLogoUrl: nullableString,
  notesAr: nullableString,
  notesEn: nullableString,
  slug: slugInput,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
};

const socialLinkFields = {
  platform: z.string().trim().min(1).max(80),
  label: nullableString,
  url: z.string().trim().url().max(500),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
};

const trustIndicatorFields = {
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

const announcementFields = {
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

export const financeRouter = createRouter({
  overview: publicQuery.query(async () => {
    const db = getDb();
    const now = sql`NOW()`;

    const [
      currencyRows,
      serviceRows,
      countryRows,
      accountRows,
      socialRows,
      trustRows,
      announcementRows,
      settingRows,
    ] = await Promise.all([
      db
        .select({
          id: currencies.id,
          symbol: currencies.symbol,
          nameAr: currencies.nameAr,
          nameEn: currencies.nameEn,
          isActive: currencies.isActive,
          sortOrder: currencies.sortOrder,
          buyPrice: exchangeRates.buyPrice,
          sellPrice: exchangeRates.sellPrice,
          calculatorRate: exchangeRates.calculatorRate,
          rateIsActive: exchangeRates.isActive,
          rateUpdatedAt: exchangeRates.updatedAt,
        })
        .from(currencies)
        .leftJoin(exchangeRates, eq(exchangeRates.currencyId, currencies.id))
        .orderBy(asc(currencies.sortOrder), asc(currencies.symbol)),
      db
        .select()
        .from(services)
        .where(eq(services.isActive, true))
        .orderBy(asc(services.sortOrder), asc(services.id)),
      db
        .select()
        .from(countries)
        .where(eq(countries.isActive, true))
        .orderBy(asc(countries.sortOrder), asc(countries.nameAr)),
      db
        .select({
          id: bankAccounts.id,
          bankNameAr: bankAccounts.bankNameAr,
          bankNameEn: bankAccounts.bankNameEn,
          accountName: bankAccounts.accountName,
          accountNumber: bankAccounts.accountNumber,
          iban: bankAccounts.iban,
          bankLogoUrl: bankAccounts.bankLogoUrl,
          notesAr: bankAccounts.notesAr,
          notesEn: bankAccounts.notesEn,
          slug: bankAccounts.slug,
          isActive: bankAccounts.isActive,
          sortOrder: bankAccounts.sortOrder,
          countryId: countries.id,
          countryNameAr: countries.nameAr,
          countryNameEn: countries.nameEn,
          countrySlug: countries.slug,
          currencyId: currencies.id,
          currencySymbol: currencies.symbol,
          currencyNameAr: currencies.nameAr,
          currencyNameEn: currencies.nameEn,
        })
        .from(bankAccounts)
        .innerJoin(countries, eq(bankAccounts.countryId, countries.id))
        .innerJoin(currencies, eq(bankAccounts.currencyId, currencies.id))
        .where(
          and(
            eq(bankAccounts.isActive, true),
            eq(countries.isActive, true),
            eq(currencies.isActive, true),
          ),
        )
        .orderBy(asc(bankAccounts.sortOrder), asc(bankAccounts.bankNameAr)),
      db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.isActive, true))
        .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.platform)),
      db
        .select()
        .from(trustIndicators)
        .where(eq(trustIndicators.isActive, true))
        .orderBy(asc(trustIndicators.sortOrder), asc(trustIndicators.id)),
      db
        .select()
        .from(announcements)
        .where(
          and(
            eq(announcements.isActive, true),
            sql`(${announcements.startsAt} IS NULL OR ${announcements.startsAt} <= ${now})`,
            sql`(${announcements.endsAt} IS NULL OR ${announcements.endsAt} >= ${now})`,
          ),
        )
        .orderBy(asc(announcements.sortOrder), desc(announcements.createdAt)),
      db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.isPublic, true))
        .orderBy(asc(siteSettings.sortOrder), asc(siteSettings.key)),
    ]);

    return {
      currencies: currencyRows,
      services: serviceRows,
      countries: countryRows,
      accounts: accountRows,
      socialLinks: socialRows,
      trustIndicators: trustRows.filter((item) => item.value?.trim()),
      announcements: announcementRows,
      settings: Object.fromEntries(
        settingRows.map((setting) => [setting.key, setting.value ?? ""]),
      ),
    };
  }),

  rates: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: currencies.id,
        symbol: currencies.symbol,
        nameAr: currencies.nameAr,
        nameEn: currencies.nameEn,
        isActive: currencies.isActive,
        sortOrder: currencies.sortOrder,
        buyPrice: exchangeRates.buyPrice,
        sellPrice: exchangeRates.sellPrice,
        calculatorRate: exchangeRates.calculatorRate,
        rateIsActive: exchangeRates.isActive,
        updatedAt: exchangeRates.updatedAt,
      })
      .from(currencies)
      .leftJoin(exchangeRates, eq(exchangeRates.currencyId, currencies.id))
      .orderBy(asc(currencies.sortOrder), asc(currencies.symbol));
  }),

  calculatorOptions: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        serviceId: services.id,
        serviceNameAr: services.nameAr,
        serviceNameEn: services.nameEn,
        calculatorRateType: services.calculatorRateType,
        currencyId: currencies.id,
        currencySymbol: currencies.symbol,
        currencyNameAr: currencies.nameAr,
        currencyNameEn: currencies.nameEn,
        buyPrice: exchangeRates.buyPrice,
        sellPrice: exchangeRates.sellPrice,
        calculatorRate: exchangeRates.calculatorRate,
        rateIsActive: exchangeRates.isActive,
        rateUpdatedAt: exchangeRates.updatedAt,
      })
      .from(services)
      .innerJoin(currencies, eq(services.calculatorCurrencyId, currencies.id))
      .leftJoin(exchangeRates, eq(exchangeRates.currencyId, currencies.id))
      .where(
        and(
          eq(services.isActive, true),
          eq(services.isCalculatorEnabled, true),
          eq(currencies.isActive, true),
        ),
      )
      .orderBy(asc(services.sortOrder), asc(services.id));
  }),

  calculate: publicQuery
    .input(
      z.object({
        serviceId: z.number().int().positive(),
        amount: z.coerce.number().finite().positive(),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({
          serviceId: services.id,
          serviceNameAr: services.nameAr,
          serviceNameEn: services.nameEn,
          calculatorRateType: services.calculatorRateType,
          currencyId: currencies.id,
          currencySymbol: currencies.symbol,
          currencyNameAr: currencies.nameAr,
          currencyNameEn: currencies.nameEn,
          currencyActive: currencies.isActive,
          buyPrice: exchangeRates.buyPrice,
          sellPrice: exchangeRates.sellPrice,
          calculatorRate: exchangeRates.calculatorRate,
          rateIsActive: exchangeRates.isActive,
          rateUpdatedAt: exchangeRates.updatedAt,
        })
        .from(services)
        .innerJoin(currencies, eq(services.calculatorCurrencyId, currencies.id))
        .leftJoin(exchangeRates, eq(exchangeRates.currencyId, currencies.id))
        .where(
          and(
            eq(services.id, input.serviceId),
            eq(services.isActive, true),
            eq(services.isCalculatorEnabled, true),
          ),
        )
        .limit(1);

      const service = rows[0];
      if (!service || !service.currencyActive) {
        return {
          status: "unavailable" as const,
          reason: "الخدمة غير متوفرة حاليًا",
        };
      }

      const rate = getRateForService(service, {
        buyPrice: service.buyPrice,
        sellPrice: service.sellPrice,
        calculatorRate: service.calculatorRate,
        isActive: service.rateIsActive ?? false,
      });

      if (rate === null) {
        return {
          status: "unavailable" as const,
          reason: "السعر غير متوفر حاليًا",
        };
      }

      const amountAsDecimal = toDecimalString(input.amount);
      const matchingRules = await db
        .select()
        .from(commissionRules)
        .where(
          and(
            eq(commissionRules.serviceId, input.serviceId),
            eq(commissionRules.isActive, true),
            sql`${commissionRules.minimumAmount} <= ${amountAsDecimal}`,
            sql`${commissionRules.maximumAmount} >= ${amountAsDecimal}`,
          ),
        )
        .orderBy(asc(commissionRules.minimumAmount))
        .limit(2);

      if (matchingRules.length === 0) {
        return {
          status: "unavailable" as const,
          reason: "لا توجد شريحة عمولة مناسبة لهذا المبلغ",
        };
      }

      if (matchingRules.length > 1) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "More than one active commission rule covers this amount",
        });
      }

      const rule = matchingRules[0];
      const commissionAmount = calculateCommission({
        amount: input.amount,
        commissionType: rule.commissionType,
        commissionValue: rule.commissionValue,
      });
      const baseAmount = input.amount * rate;
      const totalAmount = baseAmount + commissionAmount;

      return {
        status: "ok" as const,
        amount: input.amount,
        exchangeRate: rate,
        baseAmount,
        commissionAmount,
        totalAmount,
        currency: {
          id: service.currencyId,
          symbol: service.currencySymbol,
          nameAr: service.currencyNameAr,
          nameEn: service.currencyNameEn,
        },
        service: {
          id: service.serviceId,
          nameAr: service.serviceNameAr,
          nameEn: service.serviceNameEn,
          rateType: service.calculatorRateType,
        },
        commissionRule: {
          id: rule.id,
          minimumAmount: rule.minimumAmount,
          maximumAmount: rule.maximumAmount,
          commissionType: rule.commissionType,
          commissionValue: rule.commissionValue,
        },
        rateUpdatedAt: service.rateUpdatedAt,
        disclaimer:
          "السعر استرشادي حسب آخر تحديث، يرجى التأكيد قبل تنفيذ العملية.",
      };
    }),

  accounts: createRouter({
    list: publicQuery
      .input(
        z
          .object({
            search: z.string().trim().optional(),
            countrySlug: z.string().trim().optional(),
            currencySymbol: z.string().trim().optional(),
            bank: z.string().trim().optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const db = getDb();
        const conditions = [
          eq(bankAccounts.isActive, true),
          eq(countries.isActive, true),
          eq(currencies.isActive, true),
        ];

        if (input?.countrySlug) {
          conditions.push(eq(countries.slug, input.countrySlug));
        }
        if (input?.currencySymbol) {
          conditions.push(eq(currencies.symbol, input.currencySymbol));
        }
        if (input?.bank) {
          conditions.push(
            or(
              like(bankAccounts.bankNameAr, `%${input.bank}%`),
              like(bankAccounts.bankNameEn, `%${input.bank}%`),
            )!,
          );
        }
        if (input?.search) {
          const term = `%${input.search}%`;
          conditions.push(
            or(
              like(bankAccounts.bankNameAr, term),
              like(bankAccounts.bankNameEn, term),
              like(bankAccounts.accountName, term),
              like(bankAccounts.accountNumber, term),
              like(bankAccounts.iban, term),
              like(countries.nameAr, term),
              like(currencies.symbol, term),
            )!,
          );
        }

        return db
          .select({
            id: bankAccounts.id,
            bankNameAr: bankAccounts.bankNameAr,
            bankNameEn: bankAccounts.bankNameEn,
            accountName: bankAccounts.accountName,
            accountNumber: bankAccounts.accountNumber,
            iban: bankAccounts.iban,
            bankLogoUrl: bankAccounts.bankLogoUrl,
            notesAr: bankAccounts.notesAr,
            notesEn: bankAccounts.notesEn,
            slug: bankAccounts.slug,
            countryId: countries.id,
            countryNameAr: countries.nameAr,
            countryNameEn: countries.nameEn,
            countrySlug: countries.slug,
            countryFlagEmoji: countries.flagEmoji,
            currencyId: currencies.id,
            currencySymbol: currencies.symbol,
            currencyNameAr: currencies.nameAr,
            currencyNameEn: currencies.nameEn,
          })
          .from(bankAccounts)
          .innerJoin(countries, eq(bankAccounts.countryId, countries.id))
          .innerJoin(currencies, eq(bankAccounts.currencyId, currencies.id))
          .where(and(...conditions))
          .orderBy(asc(bankAccounts.sortOrder), asc(bankAccounts.bankNameAr));
      }),

    bySlug: publicQuery
      .input(
        z.object({
          countrySlug: z.string().trim().min(1),
          accountSlug: z.string().trim().min(1),
        }),
      )
      .query(async ({ input }) => {
        const db = getDb();
        const rows = await db
          .select({
            id: bankAccounts.id,
            bankNameAr: bankAccounts.bankNameAr,
            bankNameEn: bankAccounts.bankNameEn,
            accountName: bankAccounts.accountName,
            accountNumber: bankAccounts.accountNumber,
            iban: bankAccounts.iban,
            bankLogoUrl: bankAccounts.bankLogoUrl,
            notesAr: bankAccounts.notesAr,
            notesEn: bankAccounts.notesEn,
            slug: bankAccounts.slug,
            countryId: countries.id,
            countryNameAr: countries.nameAr,
            countryNameEn: countries.nameEn,
            countrySlug: countries.slug,
            countryFlagEmoji: countries.flagEmoji,
            currencyId: currencies.id,
            currencySymbol: currencies.symbol,
            currencyNameAr: currencies.nameAr,
            currencyNameEn: currencies.nameEn,
          })
          .from(bankAccounts)
          .innerJoin(countries, eq(bankAccounts.countryId, countries.id))
          .innerJoin(currencies, eq(bankAccounts.currencyId, currencies.id))
          .where(
            and(
              eq(bankAccounts.slug, input.accountSlug),
              eq(countries.slug, input.countrySlug),
              eq(bankAccounts.isActive, true),
              eq(countries.isActive, true),
              eq(currencies.isActive, true),
            ),
          )
          .limit(1);

        return rows[0] ?? null;
      }),
  }),

  admin: createRouter({
    dashboard: adminQuery.query(async () => {
      const db = getDb();
      const [
        currencyCount,
        activeCurrencyCount,
        accountCount,
        activeAccountCount,
        serviceCount,
        activeServiceCount,
        latestRate,
        recentChanges,
        recentActivity,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(currencies),
        db
          .select({ count: sql<number>`count(*)` })
          .from(currencies)
          .where(eq(currencies.isActive, true)),
        db.select({ count: sql<number>`count(*)` }).from(bankAccounts),
        db
          .select({ count: sql<number>`count(*)` })
          .from(bankAccounts)
          .where(eq(bankAccounts.isActive, true)),
        db.select({ count: sql<number>`count(*)` }).from(services),
        db
          .select({ count: sql<number>`count(*)` })
          .from(services)
          .where(eq(services.isActive, true)),
        db
          .select({ updatedAt: exchangeRates.updatedAt })
          .from(exchangeRates)
          .orderBy(desc(exchangeRates.updatedAt))
          .limit(1),
        db
          .select({
            id: exchangeRateHistory.id,
            field: exchangeRateHistory.field,
            oldValue: exchangeRateHistory.oldValue,
            newValue: exchangeRateHistory.newValue,
            createdAt: exchangeRateHistory.createdAt,
            currencySymbol: currencies.symbol,
          })
          .from(exchangeRateHistory)
          .innerJoin(currencies, eq(exchangeRateHistory.currencyId, currencies.id))
          .orderBy(desc(exchangeRateHistory.createdAt))
          .limit(8),
        db
          .select()
          .from(activityLogs)
          .orderBy(desc(activityLogs.createdAt))
          .limit(10),
      ]);

      return {
        totalCurrencies: currencyCount[0]?.count ?? 0,
        activeCurrencies: activeCurrencyCount[0]?.count ?? 0,
        totalAccounts: accountCount[0]?.count ?? 0,
        activeAccounts: activeAccountCount[0]?.count ?? 0,
        totalServices: serviceCount[0]?.count ?? 0,
        activeServices: activeServiceCount[0]?.count ?? 0,
        lastRateUpdate: latestRate[0]?.updatedAt ?? null,
        recentChanges,
        recentActivity,
      };
    }),

    countries: createRouter({
      list: adminQuery.input(listInput).query(async ({ input }) => {
        const db = getDb();
        const page = input?.page ?? 1;
        const limit = input?.limit ?? 50;
        const offset = (page - 1) * limit;
        const where = input?.search
          ? or(
              like(countries.nameAr, `%${input.search}%`),
              like(countries.nameEn, `%${input.search}%`),
              like(countries.slug, `%${input.search}%`),
            )
          : undefined;

        const [items, countRows] = await Promise.all([
          db
            .select()
            .from(countries)
            .where(where)
            .orderBy(asc(countries.sortOrder), asc(countries.nameAr))
            .limit(limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(countries).where(where),
        ]);

        return {
          items,
          total: countRows[0]?.count ?? 0,
          page,
          totalPages: Math.ceil((countRows[0]?.count ?? 0) / limit),
        };
      }),

      create: adminQuery.input(z.object(countryFields)).mutation(async ({ input, ctx }) => {
        const db = getDb();
        const result = await db.insert(countries).values(input);
        const id = Number(result[0].insertId);
        await logActivity(ctx, "create", "country", id, { slug: input.slug });
        return { success: true, id };
      }),

      update: adminQuery
        .input(z.object({ id: z.number().int().positive(), ...countryFields }).partial({ nameAr: true, slug: true }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          const { id, ...data } = input;
          await db.update(countries).set(pickDefined(data)).where(eq(countries.id, id));
          await logActivity(ctx, "update", "country", id, pickDefined(data));
          return { success: true };
        }),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db.delete(countries).where(eq(countries.id, input.id));
          await logActivity(ctx, "delete", "country", input.id);
          return { success: true };
        }),
    }),

    currencies: createRouter({
      list: adminQuery.input(listInput).query(async ({ input }) => {
        const db = getDb();
        const page = input?.page ?? 1;
        const limit = input?.limit ?? 50;
        const offset = (page - 1) * limit;
        const where = input?.search
          ? or(
              like(currencies.symbol, `%${input.search}%`),
              like(currencies.nameAr, `%${input.search}%`),
              like(currencies.nameEn, `%${input.search}%`),
            )
          : undefined;

        const [items, countRows] = await Promise.all([
          db
            .select({
              id: currencies.id,
              symbol: currencies.symbol,
              nameAr: currencies.nameAr,
              nameEn: currencies.nameEn,
              isActive: currencies.isActive,
              sortOrder: currencies.sortOrder,
              createdAt: currencies.createdAt,
              updatedAt: currencies.updatedAt,
              buyPrice: exchangeRates.buyPrice,
              sellPrice: exchangeRates.sellPrice,
              calculatorRate: exchangeRates.calculatorRate,
              rateIsActive: exchangeRates.isActive,
              rateUpdatedAt: exchangeRates.updatedAt,
            })
            .from(currencies)
            .leftJoin(exchangeRates, eq(exchangeRates.currencyId, currencies.id))
            .where(where)
            .orderBy(asc(currencies.sortOrder), asc(currencies.symbol))
            .limit(limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(currencies).where(where),
        ]);

        return {
          items,
          total: countRows[0]?.count ?? 0,
          page,
          totalPages: Math.ceil((countRows[0]?.count ?? 0) / limit),
        };
      }),

      create: adminQuery.input(z.object(currencyFields)).mutation(async ({ input, ctx }) => {
        const db = getDb();
        const {
          buyPrice,
          sellPrice,
          calculatorRate,
          rateIsActive,
          ...currencyData
        } = input;
        const result = await db.insert(currencies).values(currencyData);
        const id = Number(result[0].insertId);
        await db.insert(exchangeRates).values({
          currencyId: id,
          buyPrice: buyPrice ?? null,
          sellPrice: sellPrice ?? null,
          calculatorRate: calculatorRate ?? null,
          isActive: rateIsActive,
          updatedBy: ctx.user.id,
        });
        await logActivity(ctx, "create", "currency", id, {
          symbol: input.symbol,
        });
        return { success: true, id };
      }),

      update: adminQuery
        .input(
          z
            .object({
              id: z.number().int().positive(),
              ...currencyFields,
            })
            .partial({
              symbol: true,
              nameAr: true,
              isActive: true,
              sortOrder: true,
              rateIsActive: true,
            }),
        )
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          const {
            id,
            buyPrice,
            sellPrice,
            calculatorRate,
            rateIsActive,
            ...currencyData
          } = input;

          if (Object.keys(pickDefined(currencyData)).length > 0) {
            await db
              .update(currencies)
              .set(pickDefined(currencyData))
              .where(eq(currencies.id, id));
          }

          const existingRate = await db
            .select()
            .from(exchangeRates)
            .where(eq(exchangeRates.currencyId, id))
            .limit(1);
          const oldRate = existingRate[0];
          const rateData = pickDefined({
            buyPrice,
            sellPrice,
            calculatorRate,
            isActive: rateIsActive,
            updatedBy: ctx.user.id,
          });

          if (oldRate) {
            await db
              .update(exchangeRates)
              .set(rateData)
              .where(eq(exchangeRates.currencyId, id));
          } else if (Object.keys(rateData).length > 1) {
            await db.insert(exchangeRates).values({
              currencyId: id,
              buyPrice: buyPrice ?? null,
              sellPrice: sellPrice ?? null,
              calculatorRate: calculatorRate ?? null,
              isActive: rateIsActive ?? true,
              updatedBy: ctx.user.id,
            });
          }

          const historyEntries = [
            ["buy", oldRate?.buyPrice, buyPrice],
            ["sell", oldRate?.sellPrice, sellPrice],
            ["calculator", oldRate?.calculatorRate, calculatorRate],
          ] as const;

          for (const [field, oldValue, newValue] of historyEntries) {
            if (newValue !== undefined && (oldValue ?? null) !== newValue) {
              await db.insert(exchangeRateHistory).values({
                currencyId: id,
                field,
                oldValue: oldValue ?? null,
                newValue,
                changedBy: ctx.user.id,
              });
            }
          }

          await logActivity(ctx, "update", "currency", id, pickDefined(input));
          return { success: true };
        }),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db.delete(currencies).where(eq(currencies.id, input.id));
          await logActivity(ctx, "delete", "currency", input.id);
          return { success: true };
        }),

      history: adminQuery
        .input(z.object({ currencyId: z.number().int().positive().optional() }).optional())
        .query(async ({ input }) => {
          const conditions = input?.currencyId
            ? eq(exchangeRateHistory.currencyId, input.currencyId)
            : undefined;
          return getDb()
            .select({
              id: exchangeRateHistory.id,
              field: exchangeRateHistory.field,
              oldValue: exchangeRateHistory.oldValue,
              newValue: exchangeRateHistory.newValue,
              createdAt: exchangeRateHistory.createdAt,
              currencySymbol: currencies.symbol,
            })
            .from(exchangeRateHistory)
            .innerJoin(currencies, eq(exchangeRateHistory.currencyId, currencies.id))
            .where(conditions)
            .orderBy(desc(exchangeRateHistory.createdAt))
            .limit(100);
        }),
    }),

    services: createRouter({
      list: adminQuery.input(listInput).query(async ({ input }) => {
        const db = getDb();
        const page = input?.page ?? 1;
        const limit = input?.limit ?? 50;
        const offset = (page - 1) * limit;
        const where = input?.search
          ? or(
              like(services.nameAr, `%${input.search}%`),
              like(services.nameEn, `%${input.search}%`),
            )
          : undefined;
        const [items, countRows] = await Promise.all([
          db
            .select()
            .from(services)
            .where(where)
            .orderBy(asc(services.sortOrder), asc(services.id))
            .limit(limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(services).where(where),
        ]);

        return {
          items,
          total: countRows[0]?.count ?? 0,
          page,
          totalPages: Math.ceil((countRows[0]?.count ?? 0) / limit),
        };
      }),

      create: adminQuery.input(z.object(serviceFields)).mutation(async ({ input, ctx }) => {
        if (input.isCalculatorEnabled && !input.calculatorCurrencyId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Calculator services require a currency",
          });
        }
        const db = getDb();
        const result = await db.insert(services).values({
          ...input,
          createdBy: ctx.user.id,
          updatedBy: ctx.user.id,
        });
        const id = Number(result[0].insertId);
        await logActivity(ctx, "create", "service", id, {
          nameAr: input.nameAr,
        });
        return { success: true, id };
      }),

      update: adminQuery
        .input(
          z
            .object({ id: z.number().int().positive(), ...serviceFields })
            .partial({
              nameAr: true,
              isActive: true,
              sortOrder: true,
              isCalculatorEnabled: true,
              calculatorRateType: true,
            }),
        )
        .mutation(async ({ input, ctx }) => {
          if (input.isCalculatorEnabled && input.calculatorCurrencyId === null) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Calculator services require a currency",
            });
          }
          const db = getDb();
          const { id, ...data } = input;
          await db
            .update(services)
            .set({ ...pickDefined(data), updatedBy: ctx.user.id })
            .where(eq(services.id, id));
          await logActivity(ctx, "update", "service", id, pickDefined(data));
          return { success: true };
        }),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db.delete(services).where(eq(services.id, input.id));
          await logActivity(ctx, "delete", "service", input.id);
          return { success: true };
        }),
    }),

    commissionRules: createRouter({
      list: adminQuery
        .input(z.object({ serviceId: z.number().int().positive().optional() }).optional())
        .query(async ({ input }) => {
          const where = input?.serviceId
            ? eq(commissionRules.serviceId, input.serviceId)
            : undefined;
          return getDb()
            .select({
              id: commissionRules.id,
              serviceId: commissionRules.serviceId,
              minimumAmount: commissionRules.minimumAmount,
              maximumAmount: commissionRules.maximumAmount,
              commissionType: commissionRules.commissionType,
              commissionValue: commissionRules.commissionValue,
              isActive: commissionRules.isActive,
              sortOrder: commissionRules.sortOrder,
              createdAt: commissionRules.createdAt,
              updatedAt: commissionRules.updatedAt,
              serviceNameAr: services.nameAr,
            })
            .from(commissionRules)
            .innerJoin(services, eq(commissionRules.serviceId, services.id))
            .where(where)
            .orderBy(
              asc(commissionRules.serviceId),
              asc(commissionRules.minimumAmount),
            );
        }),

      create: adminQuery
        .input(
          z.object({
            serviceId: z.number().int().positive(),
            minimumAmount: requiredPositiveDecimal,
            maximumAmount: requiredPositiveDecimal,
            commissionType: z.enum(["percentage", "fixed"]),
            commissionValue: requiredNonNegativeDecimal,
            isActive: z.boolean().default(true),
            sortOrder: z.number().int().default(0),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          ensureRange(input.minimumAmount, input.maximumAmount);
          await assertNoCommissionOverlap(input);

          const db = getDb();
          const result = await db.insert(commissionRules).values({
            ...input,
            createdBy: ctx.user.id,
            updatedBy: ctx.user.id,
          });
          const id = Number(result[0].insertId);
          await logActivity(ctx, "create", "commission_rule", id, input);
          return { success: true, id };
        }),

      update: adminQuery
        .input(
          z
            .object({
              id: z.number().int().positive(),
              serviceId: z.number().int().positive(),
              minimumAmount: requiredPositiveDecimal,
              maximumAmount: requiredPositiveDecimal,
              commissionType: z.enum(["percentage", "fixed"]),
              commissionValue: requiredNonNegativeDecimal,
              isActive: z.boolean(),
              sortOrder: z.number().int(),
            })
            .partial({
              serviceId: true,
              minimumAmount: true,
              maximumAmount: true,
              commissionType: true,
              commissionValue: true,
              isActive: true,
              sortOrder: true,
            }),
        )
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          const existing = await db
            .select()
            .from(commissionRules)
            .where(eq(commissionRules.id, input.id))
            .limit(1);
          const current = existing[0];
          if (!current) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Commission rule not found",
            });
          }

          const merged = {
            serviceId: input.serviceId ?? current.serviceId,
            minimumAmount: input.minimumAmount ?? current.minimumAmount,
            maximumAmount: input.maximumAmount ?? current.maximumAmount,
            isActive: input.isActive ?? current.isActive,
          };

          ensureRange(merged.minimumAmount, merged.maximumAmount);
          await assertNoCommissionOverlap({
            ...merged,
            ignoreId: input.id,
          });

          const { id, ...data } = input;
          await db
            .update(commissionRules)
            .set({ ...pickDefined(data), updatedBy: ctx.user.id })
            .where(eq(commissionRules.id, id));
          await logActivity(ctx, "update", "commission_rule", id, pickDefined(data));
          return { success: true };
        }),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db.delete(commissionRules).where(eq(commissionRules.id, input.id));
          await logActivity(ctx, "delete", "commission_rule", input.id);
          return { success: true };
        }),
    }),

    bankAccounts: createRouter({
      list: adminQuery.input(listInput).query(async ({ input }) => {
        const db = getDb();
        const page = input?.page ?? 1;
        const limit = input?.limit ?? 50;
        const offset = (page - 1) * limit;
        const where = input?.search
          ? or(
              like(bankAccounts.bankNameAr, `%${input.search}%`),
              like(bankAccounts.bankNameEn, `%${input.search}%`),
              like(bankAccounts.accountName, `%${input.search}%`),
              like(bankAccounts.accountNumber, `%${input.search}%`),
              like(bankAccounts.slug, `%${input.search}%`),
            )
          : undefined;
        const [items, countRows] = await Promise.all([
          db
            .select({
              id: bankAccounts.id,
              countryId: bankAccounts.countryId,
              currencyId: bankAccounts.currencyId,
              bankNameAr: bankAccounts.bankNameAr,
              bankNameEn: bankAccounts.bankNameEn,
              accountName: bankAccounts.accountName,
              accountNumber: bankAccounts.accountNumber,
              iban: bankAccounts.iban,
              bankLogoUrl: bankAccounts.bankLogoUrl,
              notesAr: bankAccounts.notesAr,
              notesEn: bankAccounts.notesEn,
              slug: bankAccounts.slug,
              isActive: bankAccounts.isActive,
              sortOrder: bankAccounts.sortOrder,
              createdAt: bankAccounts.createdAt,
              updatedAt: bankAccounts.updatedAt,
              countryNameAr: countries.nameAr,
              countrySlug: countries.slug,
              currencySymbol: currencies.symbol,
            })
            .from(bankAccounts)
            .innerJoin(countries, eq(bankAccounts.countryId, countries.id))
            .innerJoin(currencies, eq(bankAccounts.currencyId, currencies.id))
            .where(where)
            .orderBy(asc(bankAccounts.sortOrder), asc(bankAccounts.bankNameAr))
            .limit(limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(bankAccounts).where(where),
        ]);

        return {
          items,
          total: countRows[0]?.count ?? 0,
          page,
          totalPages: Math.ceil((countRows[0]?.count ?? 0) / limit),
        };
      }),

      create: adminQuery.input(z.object(bankAccountFields)).mutation(async ({ input, ctx }) => {
        const db = getDb();
        const result = await db.insert(bankAccounts).values({
          ...input,
          createdBy: ctx.user.id,
          updatedBy: ctx.user.id,
        });
        const id = Number(result[0].insertId);
        await logActivity(ctx, "create", "bank_account", id, {
          slug: input.slug,
        });
        return { success: true, id };
      }),

      update: adminQuery
        .input(
          z
            .object({ id: z.number().int().positive(), ...bankAccountFields })
            .partial({
              countryId: true,
              currencyId: true,
              bankNameAr: true,
              accountName: true,
              accountNumber: true,
              slug: true,
              isActive: true,
              sortOrder: true,
            }),
        )
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          const { id, ...data } = input;
          await db
            .update(bankAccounts)
            .set({ ...pickDefined(data), updatedBy: ctx.user.id })
            .where(eq(bankAccounts.id, id));
          await logActivity(ctx, "update", "bank_account", id, pickDefined(data));
          return { success: true };
        }),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db.delete(bankAccounts).where(eq(bankAccounts.id, input.id));
          await logActivity(ctx, "delete", "bank_account", input.id);
          return { success: true };
        }),
    }),

    settings: createRouter({
      list: adminQuery.query(async () => {
        return getDb()
          .select()
          .from(siteSettings)
          .orderBy(asc(siteSettings.group), asc(siteSettings.sortOrder));
      }),

      upsert: adminQuery
        .input(
          z.object({
            key: z.string().trim().min(1).max(180),
            value: nullableString,
            type: z.enum(["text", "url", "image", "json"]).default("text"),
            group: z.string().trim().min(1).max(120).default("general"),
            isPublic: z.boolean().default(true),
            sortOrder: z.number().int().default(0),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db
            .insert(siteSettings)
            .values({ ...input, updatedBy: ctx.user.id })
            .onDuplicateKeyUpdate({
              set: { ...input, updatedBy: ctx.user.id },
            });
          await logActivity(ctx, "upsert", "site_setting", undefined, {
            key: input.key,
          });
          return { success: true };
        }),
    }),

    socialLinks: createRouter({
      list: adminQuery.query(async () => {
        return getDb()
          .select()
          .from(socialLinks)
          .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.platform));
      }),

      create: adminQuery.input(z.object(socialLinkFields)).mutation(async ({ input, ctx }) => {
        const db = getDb();
        const result = await db.insert(socialLinks).values({
          ...input,
          updatedBy: ctx.user.id,
        });
        const id = Number(result[0].insertId);
        await logActivity(ctx, "create", "social_link", id, input);
        return { success: true, id };
      }),

      update: adminQuery
        .input(
          z
            .object({ id: z.number().int().positive(), ...socialLinkFields })
            .partial({
              platform: true,
              url: true,
              isActive: true,
              sortOrder: true,
            }),
        )
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          const { id, ...data } = input;
          await db
            .update(socialLinks)
            .set({ ...pickDefined(data), updatedBy: ctx.user.id })
            .where(eq(socialLinks.id, id));
          await logActivity(ctx, "update", "social_link", id, pickDefined(data));
          return { success: true };
        }),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db.delete(socialLinks).where(eq(socialLinks.id, input.id));
          await logActivity(ctx, "delete", "social_link", input.id);
          return { success: true };
        }),
    }),

    trustIndicators: createRouter({
      list: adminQuery.query(async () => {
        return getDb()
          .select()
          .from(trustIndicators)
          .orderBy(asc(trustIndicators.sortOrder), asc(trustIndicators.id));
      }),

      create: adminQuery.input(z.object(trustIndicatorFields)).mutation(async ({ input, ctx }) => {
        const db = getDb();
        const result = await db.insert(trustIndicators).values({
          ...input,
          updatedBy: ctx.user.id,
        });
        const id = Number(result[0].insertId);
        await logActivity(ctx, "create", "trust_indicator", id, input);
        return { success: true, id };
      }),

      update: adminQuery
        .input(
          z
            .object({ id: z.number().int().positive(), ...trustIndicatorFields })
            .partial({
              labelAr: true,
              isActive: true,
              sortOrder: true,
            }),
        )
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          const { id, ...data } = input;
          await db
            .update(trustIndicators)
            .set({ ...pickDefined(data), updatedBy: ctx.user.id })
            .where(eq(trustIndicators.id, id));
          await logActivity(ctx, "update", "trust_indicator", id, pickDefined(data));
          return { success: true };
        }),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db.delete(trustIndicators).where(eq(trustIndicators.id, input.id));
          await logActivity(ctx, "delete", "trust_indicator", input.id);
          return { success: true };
        }),
    }),

    announcements: createRouter({
      list: adminQuery.query(async () => {
        return getDb()
          .select()
          .from(announcements)
          .orderBy(asc(announcements.sortOrder), desc(announcements.createdAt));
      }),

      create: adminQuery.input(z.object(announcementFields)).mutation(async ({ input, ctx }) => {
        const db = getDb();
        const result = await db.insert(announcements).values({
          ...input,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          updatedBy: ctx.user.id,
        });
        const id = Number(result[0].insertId);
        await logActivity(ctx, "create", "announcement", id, input);
        return { success: true, id };
      }),

      update: adminQuery
        .input(
          z
            .object({ id: z.number().int().positive(), ...announcementFields })
            .partial({
              titleAr: true,
              level: true,
              isActive: true,
              sortOrder: true,
            }),
        )
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          const { id, startsAt, endsAt, ...data } = input;
          await db
            .update(announcements)
            .set({
              ...pickDefined(data),
              ...(startsAt !== undefined
                ? { startsAt: startsAt ? new Date(startsAt) : null }
                : {}),
              ...(endsAt !== undefined
                ? { endsAt: endsAt ? new Date(endsAt) : null }
                : {}),
              updatedBy: ctx.user.id,
            })
            .where(eq(announcements.id, id));
          await logActivity(ctx, "update", "announcement", id, pickDefined(input));
          return { success: true };
        }),

      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          await db.delete(announcements).where(eq(announcements.id, input.id));
          await logActivity(ctx, "delete", "announcement", input.id);
          return { success: true };
        }),
    }),

    activityLogs: createRouter({
      list: adminQuery.query(async () => {
        return getDb()
          .select()
          .from(activityLogs)
          .orderBy(desc(activityLogs.createdAt))
          .limit(100);
      }),
    }),
  }),
});
