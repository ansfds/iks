import { z } from "zod";
import { collectionsSchema } from "./models";
import {
  CONTENT_KEYS,
  validateValue,
  type ContentKey,
} from "../site-content-fields";
import { safeMediaUrl } from "../media-url";

export const contentDocumentSchema = z
  .object({
    version: z.literal(1),
    nextIds: z.record(z.string(), z.number().int().positive().safe()),
    collections: collectionsSchema,
    audit: z
      .array(
        z
          .object({
            id: z.number().int().safe(),
            userId: z.literal(1),
            action: z.string().max(80),
            entityType: z.string().max(120),
            metadata: z.string().max(300),
            createdAt: z.coerce.date(),
          })
          .strict()
      )
      .max(100),
    lastOperation: z.string().max(80),
  })
  .strict();
export type ContentDocument = z.infer<typeof contentDocumentSchema>;

export function validateContent(input: unknown): ContentDocument {
  if (
    /(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]{20,}|(?:mysql|postgresql?):\/\/[^\s"]+|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(
      JSON.stringify(input)
    )
  )
    throw new Error("Credential-like content is forbidden");
  const document = contentDocumentSchema.parse(input);
  const c = document.collections;
  for (const [name, rows] of Object.entries(c)) {
    const ids = new Set(rows.map(row => row.id));
    if (ids.size !== rows.length)
      throw new Error(`Duplicate content identifiers: ${name}`);
    if (
      !document.nextIds[name] ||
      rows.some(row => row.id >= document.nextIds[name])
    )
      throw new Error(`Invalid next identifier: ${name}`);
  }
  const unique = (values: string[]) => {
    if (
      new Set(values.map(value => value.toLowerCase())).size !== values.length
    )
      throw new Error("Duplicate content key");
  };
  unique(c.countries.map(r => r.slug));
  unique(c.currencies.map(r => r.symbol));
  unique(c.giftCards.map(r => r.slug));
  unique(c.bankAccounts.map(r => `${r.countryId}:${r.slug}`));
  unique(c.siteSettings.map(r => r.key));
  unique(c.exchangeRates.map(r => String(r.currencyId)));
  unique(
    c.giftCardDenominations.map(
      r => `${r.giftCardId}:${Number(r.faceValue)}:${r.currency}`
    )
  );
  const has = (name: keyof typeof c, id: number | null) =>
    id === null || c[name].some(row => row.id === id);
  if (
    c.bankAccounts.some(
      r => !has("countries", r.countryId) || !has("currencies", r.currencyId)
    ) ||
    c.giftCardDenominations.some(r => !has("giftCards", r.giftCardId)) ||
    c.exchangeRates.some(r => !has("currencies", r.currencyId)) ||
    c.services.some(
      r =>
        !has("currencies", r.calculatorCurrencyId) ||
        (r.isCalculatorEnabled && !r.calculatorCurrencyId)
    ) ||
    c.commissionRules.some(r => !has("services", r.serviceId))
  )
    throw new Error("Content has a missing parent");
  for (const rule of c.commissionRules) {
    if (Number(rule.maximumAmount) < Number(rule.minimumAmount))
      throw new Error("Invalid commission range");
    if (
      rule.isActive &&
      c.commissionRules.some(
        other =>
          other.id !== rule.id &&
          other.serviceId === rule.serviceId &&
          other.isActive &&
          Number(other.minimumAmount) <= Number(rule.maximumAmount) &&
          Number(other.maximumAmount) >= Number(rule.minimumAmount)
      )
    )
      throw new Error("Overlapping commission ranges");
  }
  for (const setting of c.siteSettings) {
    const giftKeys = [
      "gift_cards_whatsapp_number",
      "gift_card_rate_10_to_100",
      "gift_card_rate_above_100",
      "home_gift_cards_background_url",
      "home_services_background_url",
    ];
    if (
      !setting.isPublic ||
      !(
        CONTENT_KEYS.includes(setting.key as ContentKey) ||
        giftKeys.includes(setting.key)
      )
    )
      throw new Error("Only public CMS settings may be committed");
    if (CONTENT_KEYS.includes(setting.key as ContentKey))
      validateValue(setting.key as ContentKey, setting.value ?? "");
    if (
      setting.key.endsWith("_background_url") &&
      setting.value &&
      !safeMediaUrl(setting.value)
    )
      throw new Error("Invalid permanent media URL");
    if (
      setting.key.startsWith("gift_card_rate_") &&
      (!(Number(setting.value) > 0) || !Number.isFinite(Number(setting.value)))
    )
      throw new Error("Invalid gift rate");
  }
  // No auth tables, customers, contact messages, sessions or IP addresses exist in this format.
  return document;
}
