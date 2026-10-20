import { partialInput } from "./partial-input";
import { z } from "zod";
import { createRouter, adminQuery, publicQuery } from "./middleware";
import {
  readContent,
  insertRow,
  updateRow,
  deleteRow,
  upsertSetting,
} from "./cms/store";
import type { CollectionName, Collections } from "./cms/models";
import {
  listInput,
  countryFields,
  currencyFields,
  serviceFields,
  bankAccountFields,
  socialLinkFields,
  trustIndicatorFields,
  announcementFields,
  requiredPositiveDecimal,
  requiredNonNegativeDecimal,
  getRateForService,
  calculateCommission,
} from "./finance-fields";
export {
  rangesOverlap,
  ensureRange,
  calculateCommission,
  parseMoney,
} from "./finance-fields";

const c = () => readContent().collections;
export function ordered<T extends { id: number; sortOrder?: number | null }>(
  rows: T[]
) {
  return [...rows].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id
  );
}
function matches(row: object, search?: string) {
  return (
    !search ||
    Object.values(row).some(
      value =>
        typeof value === "string" &&
        value.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    )
  );
}
function paginate<T extends object>(
  rows: T[],
  input?: { page?: number; limit?: number; search?: string }
) {
  const page = input?.page || 1,
    limit = input?.limit || 50,
    filtered = rows.filter(row => matches(row, input?.search));
  return {
    items: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
  };
}
function joinedCurrencies() {
  return ordered(c().currencies).map(currency => {
    const rate = c().exchangeRates.find(r => r.currencyId === currency.id);
    return {
      ...currency,
      buyPrice: rate?.buyPrice ?? null,
      sellPrice: rate?.sellPrice ?? null,
      calculatorRate: rate?.calculatorRate ?? null,
      rateIsActive: rate?.isActive ?? false,
      rateUpdatedAt: rate?.updatedAt ?? null,
      updatedAt: rate?.updatedAt ?? currency.updatedAt,
    };
  });
}
function joinedAccounts(publicOnly = true) {
  return ordered(c().bankAccounts).flatMap(account => {
    const country = c().countries.find(row => row.id === account.countryId),
      currency = c().currencies.find(row => row.id === account.currencyId);
    if (
      !country ||
      !currency ||
      (publicOnly &&
        (!account.isActive || !country.isActive || !currency.isActive))
    )
      return [];
    return [
      {
        ...account,
        countryNameAr: country.nameAr,
        countryNameEn: country.nameEn,
        countrySlug: country.slug,
        countryFlagEmoji: country.flagEmoji,
        currencySymbol: currency.symbol,
        currencyNameAr: currency.nameAr,
        currencyNameEn: currency.nameEn,
      },
    ];
  });
}
function history() {
  // Public-content edits are audited by commit/path; no personal data or IP addresses in Git.
  return readContent().audit.map(row => ({
    ...row,
    entityId: null,
    ipAddress: null,
  }));
}
function collectionRouter<K extends CollectionName, S extends z.ZodRawShape>(
  name: K,
  fields: S
) {
  const schema = z.object(fields).strict();
  return createRouter({
    list: adminQuery
      .input(listInput)
      .query(({ input }) =>
        paginate(
          ordered<Collections[K][number]>(
            c()[name] as Array<Collections[K][number]>
          ),
          input
        )
      ),
    create: adminQuery
      .input(schema)
      .mutation(({ input }) => ({
        success: true,
        id: insertRow(name, input as Partial<Collections[K][number]>).id,
      })),
    update: adminQuery
      .input(partialInput(schema).extend({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        const { id, ...values } = input as unknown as { id: number } & Record<
          string,
          unknown
        >;
        updateRow(
          name,
          id,
          values as unknown as Partial<Collections[K][number]>
        );
        return { success: true };
      }),
    delete: adminQuery
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        if (name === "services")
          for (const rule of [...c().commissionRules])
            if (rule.serviceId === input.id)
              deleteRow("commissionRules", rule.id);
        deleteRow(name, input.id);
        return { success: true };
      }),
  });
}
const commissionFields = {
  serviceId: z.number().int().positive(),
  minimumAmount: requiredPositiveDecimal,
  maximumAmount: requiredPositiveDecimal,
  commissionType: z.enum(["percentage", "fixed"]),
  commissionValue: requiredNonNegativeDecimal,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
};
const ratesFields = ["buyPrice", "sellPrice", "calculatorRate"] as const;
function saveCurrencyRate(
  id: number,
  input: {
    buyPrice?: string | null;
    sellPrice?: string | null;
    calculatorRate?: string | null;
    rateIsActive?: boolean;
  }
) {
  const old = c().exchangeRates.find(row => row.currencyId === id);
  const patch = {
    buyPrice: input.buyPrice,
    sellPrice: input.sellPrice,
    calculatorRate: input.calculatorRate,
    isActive: input.rateIsActive,
    updatedBy: 1,
  };
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  );
  if (old) updateRow("exchangeRates", old.id, defined);
  else insertRow("exchangeRates", { currencyId: id, ...defined });
  for (const field of ratesFields) {
    if (input[field] !== undefined && input[field] !== (old?.[field] ?? null))
      insertRow("exchangeRateHistory", {
        currencyId: id,
        field:
          field === "buyPrice"
            ? "buy"
            : field === "sellPrice"
              ? "sell"
              : "calculator",
        oldValue: old?.[field] ?? null,
        newValue: input[field] ?? null,
        changedBy: 1,
      });
  }
  c().exchangeRateHistory = c().exchangeRateHistory.slice(-1000);
}
function currencyHistory(currencyId?: number) {
  return [...c().exchangeRateHistory]
    .reverse()
    .filter(row => !currencyId || row.currencyId === currencyId)
    .map(row => ({
      ...row,
      currencySymbol:
        c().currencies.find(currency => currency.id === row.currencyId)
          ?.symbol || "",
    }))
    .slice(0, 100);
}
function calculatorOptions() {
  return ordered(c().services)
    .filter(row => row.isActive && row.isCalculatorEnabled)
    .flatMap(service => {
      const currency = joinedCurrencies().find(
        row => row.id === service.calculatorCurrencyId && row.isActive
      );
      return currency
        ? [
            {
              serviceId: service.id,
              serviceNameAr: service.nameAr,
              serviceNameEn: service.nameEn,
              calculatorRateType: service.calculatorRateType,
              currencyId: currency.id,
              currencySymbol: currency.symbol,
              currencyNameAr: currency.nameAr,
              currencyNameEn: currency.nameEn,
              buyPrice: currency.buyPrice,
              sellPrice: currency.sellPrice,
              calculatorRate: currency.calculatorRate,
              rateIsActive: currency.rateIsActive,
              rateUpdatedAt: currency.rateUpdatedAt,
            },
          ]
        : [];
    });
}

export const financeRouter = createRouter({
  overview: publicQuery.query(() => ({
    currencies: joinedCurrencies(),
    services: ordered(c().services).filter(row => row.isActive),
    countries: ordered(c().countries).filter(row => row.isActive),
    accounts: joinedAccounts(),
    socialLinks: ordered(c().socialLinks).filter(row => row.isActive),
    trustIndicators: ordered(c().trustIndicators).filter(
      row => row.isActive && row.value?.trim()
    ),
    announcements: ordered(c().announcements).filter(
      row =>
        row.isActive &&
        (!row.startsAt || row.startsAt.getTime() <= Date.now()) &&
        (!row.endsAt || row.endsAt.getTime() >= Date.now())
    ),
    settings: Object.fromEntries(
      c()
        .siteSettings.filter(row => row.isPublic)
        .map(row => [row.key, row.value ?? ""])
    ),
  })),
  rates: publicQuery.query(joinedCurrencies),
  calculatorOptions: publicQuery.query(calculatorOptions),
  calculate: publicQuery
    .input(
      z.object({
        serviceId: z.number().int().positive(),
        amount: z.coerce.number().finite().positive(),
      })
    )
    .query(({ input }) => {
      const service = calculatorOptions().find(
        row => row.serviceId === input.serviceId
      );
      if (!service)
        return {
          status: "unavailable" as const,
          reason: "الخدمة غير متوفرة حاليًا",
        };
      const rate = getRateForService(service, {
        ...service,
        isActive: service.rateIsActive,
      });
      if (rate === null)
        return {
          status: "unavailable" as const,
          reason: "السعر غير متوفر حاليًا",
        };
      const rule = c().commissionRules.find(
        row =>
          row.serviceId === input.serviceId &&
          row.isActive &&
          Number(row.minimumAmount) <= input.amount &&
          Number(row.maximumAmount) >= input.amount
      );
      if (!rule)
        return {
          status: "unavailable" as const,
          reason: "لا توجد شريحة عمولة مناسبة لهذا المبلغ",
        };
      const commissionAmount = calculateCommission({
        amount: input.amount,
        commissionType: rule.commissionType,
        commissionValue: rule.commissionValue,
      });
      const baseAmount = input.amount * rate;
      return {
        status: "ok" as const,
        amount: input.amount,
        exchangeRate: rate,
        baseAmount,
        commissionAmount,
        totalAmount: baseAmount + commissionAmount,
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
        commissionRule: rule,
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
            countrySlug: z.string().optional(),
            currencySymbol: z.string().optional(),
            bank: z.string().optional(),
          })
          .optional()
      )
      .query(({ input }) =>
        joinedAccounts().filter(
          row =>
            matches(row, input?.search) &&
            (!input?.countrySlug || row.countrySlug === input.countrySlug) &&
            (!input?.currencySymbol ||
              row.currencySymbol === input.currencySymbol) &&
            (!input?.bank ||
              matches({ ar: row.bankNameAr, en: row.bankNameEn }, input.bank))
        )
      ),
    bySlug: publicQuery
      .input(z.object({ countrySlug: z.string(), accountSlug: z.string() }))
      .query(
        ({ input }) =>
          joinedAccounts().find(
            row =>
              row.countrySlug === input.countrySlug &&
              row.slug === input.accountSlug
          ) ?? null
      ),
  }),
  admin: createRouter({
    dashboard: adminQuery.query(() => ({
      totalCurrencies: c().currencies.length,
      activeCurrencies: c().currencies.filter(row => row.isActive).length,
      totalAccounts: c().bankAccounts.length,
      activeAccounts: c().bankAccounts.filter(row => row.isActive).length,
      totalServices: c().services.length,
      activeServices: c().services.filter(row => row.isActive).length,
      lastRateUpdate:
        [...c().exchangeRates].sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        )[0]?.updatedAt ?? null,
      recentChanges: currencyHistory().slice(0, 8),
      recentActivity: history().slice(0, 10),
    })),
    countries: collectionRouter("countries", countryFields),
    currencies: createRouter({
      list: adminQuery
        .input(listInput)
        .query(({ input }) => paginate(joinedCurrencies(), input)),
      create: adminQuery
        .input(z.object(currencyFields).strict())
        .mutation(({ input }) => {
          const {
            buyPrice,
            sellPrice,
            calculatorRate,
            rateIsActive,
            ...value
          } = input;
          const row = insertRow("currencies", value);
          saveCurrencyRate(row.id, {
            buyPrice,
            sellPrice,
            calculatorRate,
            rateIsActive,
          });
          return { success: true, id: row.id };
        }),
      update: adminQuery
        .input(
          partialInput(z.object(currencyFields))
            .extend({ id: z.number().int().positive() })
            .strict()
        )
        .mutation(({ input }) => {
          const {
            id,
            buyPrice,
            sellPrice,
            calculatorRate,
            rateIsActive,
            ...value
          } = input;
          updateRow("currencies", id, value);
          if (
            ratesFields.some(key => input[key] !== undefined) ||
            rateIsActive !== undefined
          )
            saveCurrencyRate(id, {
              buyPrice,
              sellPrice,
              calculatorRate,
              rateIsActive,
            });
          return { success: true };
        }),
      delete: adminQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(({ input }) => {
          for (const rate of c().exchangeRates.filter(
            row => row.currencyId === input.id
          ))
            deleteRow("exchangeRates", rate.id);
          deleteRow("currencies", input.id);
          return { success: true };
        }),
      history: adminQuery
        .input(
          z
            .object({ currencyId: z.number().int().positive().optional() })
            .optional()
        )
        .query(({ input }) => currencyHistory(input?.currencyId)),
    }),
    services: collectionRouter("services", serviceFields),
    bankAccounts: createRouter({
      ...collectionRouter("bankAccounts", bankAccountFields)._def.record,
      list: adminQuery
        .input(listInput)
        .query(({ input }) => paginate(joinedAccounts(false), input)),
    }),
    commissionRules: createRouter({
      ...collectionRouter("commissionRules", commissionFields)._def.record,
      list: adminQuery
        .input(
          z
            .object({ serviceId: z.number().int().positive().optional() })
            .optional()
        )
        .query(({ input }) =>
          ordered(c().commissionRules)
            .filter(
              row => !input?.serviceId || row.serviceId === input.serviceId
            )
            .map(row => ({
              ...row,
              serviceNameAr: c().services.find(
                service => service.id === row.serviceId
              )!.nameAr,
            }))
        ),
    }),
    settings: createRouter({
      list: adminQuery.query(() => ordered(c().siteSettings)),
      upsert: adminQuery
        .input(
          z.object({
            key: z.string().max(180),
            value: z.string().max(12000).nullable().optional(),
            type: z.enum(["text", "url", "image", "json"]).default("text"),
            isPublic: z.literal(true).default(true),
            group: z.string().optional(),
            sortOrder: z.number().int().optional(),
          })
        )
        .mutation(({ input }) => {
          upsertSetting(input.key, input.value ?? null, input.type);
          return { success: true };
        }),
    }),
    socialLinks: collectionRouter("socialLinks", socialLinkFields),
    trustIndicators: collectionRouter("trustIndicators", trustIndicatorFields),
    announcements: collectionRouter("announcements", announcementFields),
    activityLogs: createRouter({ list: adminQuery.query(history) }),
  }),
});
