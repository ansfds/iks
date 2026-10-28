import {
  mysqlTable,
  mysqlEnum,
  bigint,
  decimal,
  varchar,
  text,
  timestamp,
  boolean,
  int,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export const adminAuthSessions = mysqlTable("admin_auth_sessions", {
  tokenHash: varchar("tokenHash", { length: 64 }).primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
  expiresAt: bigint("expiresAt", { mode: "number", unsigned: true }).notNull(),
}, table => [index("admin_auth_sessions_expiry").on(table.expiresAt)]);

export const adminAuthAttempts = mysqlTable("admin_auth_attempts", {
  bucket: varchar("bucket", { length: 32 }).primaryKey(),
  attempts: int("attempts", { unsigned: true }).default(0).notNull(),
  resetAt: bigint("resetAt", { mode: "number", unsigned: true }).notNull(),
});

export const contacts = mysqlTable("contacts", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  studentName: varchar("studentName", { length: 255 }).notNull(),
  parentName: varchar("parentName", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  grade: varchar("grade", { length: 100 }),
  message: text("message").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  isRead: boolean("isRead").default(false).notNull(),
});

export const galleryItems = mysqlTable("gallery_items", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  category: varchar("category", { length: 50 }).notNull().default("all"),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const newsEvents = mysqlTable("news_events", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  excerpt: text("excerpt"),
  excerptAr: text("excerptAr"),
  content: text("content").notNull(),
  contentAr: text("contentAr"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  eventDate: date("eventDate"),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const testimonials = mysqlTable("testimonials", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  authorNameAr: varchar("authorNameAr", { length: 255 }),
  role: varchar("role", { length: 255 }),
  roleAr: varchar("roleAr", { length: 255 }),
  quote: text("quote").notNull(),
  quoteAr: text("quoteAr"),
  rating: int("rating").default(5).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const countries = mysqlTable(
  "countries",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    nameAr: varchar("name_ar", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }),
    slug: varchar("slug", { length: 180 }).notNull(),
    isoCode: varchar("iso_code", { length: 8 }),
    flagEmoji: varchar("flag_emoji", { length: 16 }),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    slugIdx: uniqueIndex("countries_slug_uq").on(table.slug),
    activeSortIdx: index("countries_active_sort_idx").on(
      table.isActive,
      table.sortOrder,
    ),
  }),
);

export const currencies = mysqlTable(
  "currencies",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    symbol: varchar("symbol", { length: 24 }).notNull(),
    nameAr: varchar("name_ar", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    symbolIdx: uniqueIndex("currencies_symbol_uq").on(table.symbol),
    activeSortIdx: index("currencies_active_sort_idx").on(
      table.isActive,
      table.sortOrder,
    ),
  }),
);

export const exchangeRates = mysqlTable(
  "exchange_rates",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    currencyId: bigint("currency_id", { mode: "number", unsigned: true }).notNull(),
    buyPrice: decimal("buy_price", { precision: 18, scale: 6 }),
    sellPrice: decimal("sell_price", { precision: 18, scale: 6 }),
    calculatorRate: decimal("calculator_rate", { precision: 18, scale: 6 }),
    isActive: boolean("is_active").default(true).notNull(),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    currencyIdx: uniqueIndex("exchange_rates_currency_uq").on(table.currencyId),
    activeIdx: index("exchange_rates_active_idx").on(table.isActive),
  }),
);

export const exchangeRateHistory = mysqlTable(
  "exchange_rate_history",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    currencyId: bigint("currency_id", { mode: "number", unsigned: true }).notNull(),
    field: mysqlEnum("field", ["buy", "sell", "calculator"]).notNull(),
    oldValue: decimal("old_value", { precision: 18, scale: 6 }),
    newValue: decimal("new_value", { precision: 18, scale: 6 }),
    changedBy: bigint("changed_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    currencyIdx: index("exchange_rate_history_currency_idx").on(table.currencyId),
    createdIdx: index("exchange_rate_history_created_idx").on(table.createdAt),
  }),
);

export const services = mysqlTable(
  "services",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    nameAr: varchar("name_ar", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),
    imageUrl: varchar("image_url", { length: 500 }),
    icon: varchar("icon", { length: 80 }),
    href: varchar("href", { length: 500 }),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    isCalculatorEnabled: boolean("is_calculator_enabled").default(false).notNull(),
    calculatorCurrencyId: bigint("calculator_currency_id", {
      mode: "number",
      unsigned: true,
    }),
    calculatorRateType: mysqlEnum("calculator_rate_type", [
      "buy",
      "sell",
      "calculator",
    ])
      .default("calculator")
      .notNull(),
    createdBy: bigint("created_by", { mode: "number", unsigned: true }),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    activeSortIdx: index("services_active_sort_idx").on(
      table.isActive,
      table.sortOrder,
    ),
    calculatorIdx: index("services_calculator_idx").on(
      table.isCalculatorEnabled,
      table.calculatorCurrencyId,
    ),
  }),
);

export const commissionRules = mysqlTable(
  "commission_rules",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    serviceId: bigint("service_id", { mode: "number", unsigned: true }).notNull(),
    minimumAmount: decimal("minimum_amount", {
      precision: 18,
      scale: 6,
    }).notNull(),
    maximumAmount: decimal("maximum_amount", {
      precision: 18,
      scale: 6,
    }).notNull(),
    commissionType: mysqlEnum("commission_type", ["percentage", "fixed"]).notNull(),
    commissionValue: decimal("commission_value", {
      precision: 18,
      scale: 6,
    }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    createdBy: bigint("created_by", { mode: "number", unsigned: true }),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    serviceActiveIdx: index("commission_rules_service_active_idx").on(
      table.serviceId,
      table.isActive,
    ),
    rangeIdx: index("commission_rules_range_idx").on(
      table.serviceId,
      table.minimumAmount,
      table.maximumAmount,
    ),
  }),
);

export const bankAccounts = mysqlTable(
  "bank_accounts",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    countryId: bigint("country_id", { mode: "number", unsigned: true }).notNull(),
    currencyId: bigint("currency_id", { mode: "number", unsigned: true }).notNull(),
    bankNameAr: varchar("bank_name_ar", { length: 255 }).notNull(),
    bankNameEn: varchar("bank_name_en", { length: 255 }),
    accountName: varchar("account_name", { length: 255 }).notNull(),
    accountNumber: varchar("account_number", { length: 255 }).notNull(),
    iban: varchar("iban", { length: 255 }),
    bankLogoUrl: varchar("bank_logo_url", { length: 500 }),
    notesAr: text("notes_ar"),
    notesEn: text("notes_en"),
    slug: varchar("slug", { length: 180 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    createdBy: bigint("created_by", { mode: "number", unsigned: true }),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    countrySlugIdx: uniqueIndex("bank_accounts_country_slug_uq").on(
      table.countryId,
      table.slug,
    ),
    publicIdx: index("bank_accounts_public_idx").on(
      table.isActive,
      table.countryId,
      table.currencyId,
      table.sortOrder,
    ),
  }),
);

export const siteSettings = mysqlTable(
  "site_settings",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    key: varchar("setting_key", { length: 180 }).notNull(),
    value: text("setting_value"),
    type: mysqlEnum("setting_type", ["text", "url", "image", "json"])
      .default("text")
      .notNull(),
    group: varchar("setting_group", { length: 120 }).default("general"),
    isPublic: boolean("is_public").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    keyIdx: uniqueIndex("site_settings_key_uq").on(table.key),
    publicGroupIdx: index("site_settings_public_group_idx").on(
      table.isPublic,
      table.group,
    ),
  }),
);

export const socialLinks = mysqlTable(
  "social_links",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    platform: varchar("platform", { length: 80 }).notNull(),
    label: varchar("label", { length: 120 }),
    url: varchar("url", { length: 500 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    activeSortIdx: index("social_links_active_sort_idx").on(
      table.isActive,
      table.sortOrder,
    ),
  }),
);

export const trustIndicators = mysqlTable(
  "trust_indicators",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    labelAr: varchar("label_ar", { length: 255 }).notNull(),
    labelEn: varchar("label_en", { length: 255 }),
    value: varchar("value", { length: 80 }),
    unitAr: varchar("unit_ar", { length: 80 }),
    unitEn: varchar("unit_en", { length: 80 }),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),
    icon: varchar("icon", { length: 80 }),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    activeSortIdx: index("trust_indicators_active_sort_idx").on(
      table.isActive,
      table.sortOrder,
    ),
  }),
);

export const announcements = mysqlTable(
  "announcements",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    titleAr: varchar("title_ar", { length: 255 }).notNull(),
    titleEn: varchar("title_en", { length: 255 }),
    bodyAr: text("body_ar"),
    bodyEn: text("body_en"),
    level: mysqlEnum("level", ["info", "success", "warning"])
      .default("info")
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    sortOrder: int("sort_order").default(0).notNull(),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    activeWindowIdx: index("announcements_active_window_idx").on(
      table.isActive,
      table.startsAt,
      table.endsAt,
      table.sortOrder,
    ),
  }),
);

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true }),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entity_type", { length: 120 }).notNull(),
    entityId: bigint("entity_id", { mode: "number", unsigned: true }),
    metadata: text("metadata"),
    ipAddress: varchar("ip_address", { length: 80 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index("activity_logs_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    createdIdx: index("activity_logs_created_idx").on(table.createdAt),
    userIdx: index("activity_logs_user_idx").on(table.userId),
  }),
);

export const giftCardStatusEnum = mysqlEnum("status", [
  "AVAILABLE",
  "COMING_SOON",
  "UNAVAILABLE",
  "HIDDEN",
]);

export const giftCardHighlightEffectEnum = mysqlEnum("highlight_effect", [
  "NONE",
  "FLAME",
]);

export const giftCards = mysqlTable(
  "gift_cards",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    regionCode: varchar("region_code", { length: 20 }).default("US").notNull(),
    regionLabel: varchar("region_label", { length: 120 })
      .default("ريجن أمريكي")
      .notNull(),
    currency: varchar("currency", { length: 12 }).default("USD").notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    backgroundUrl: varchar("background_url", { length: 500 }),
    status: giftCardStatusEnum.default("COMING_SOON").notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    createdBy: bigint("created_by", { mode: "number", unsigned: true }),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    slugIdx: uniqueIndex("gift_cards_slug_uq").on(table.slug),
    publicIdx: index("gift_cards_public_idx").on(table.status, table.sortOrder),
  }),
);

export const giftCardDenominations = mysqlTable(
  "gift_card_denominations",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    giftCardId: bigint("gift_card_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    faceValue: decimal("face_value", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 12 }).default("USD").notNull(),
    sellingPriceLyd: decimal("selling_price_lyd", { precision: 18, scale: 3 }),
    manualSellingPriceLyd: decimal("manual_selling_price_lyd", {
      precision: 18,
      scale: 3,
    }),
    specialPriceUsd: decimal("special_price_usd", {
      precision: 10,
      scale: 2,
    }),
    isAvailable: boolean("is_available").default(true).notNull(),
    isMostPopular: boolean("is_most_popular").default(false).notNull(),
    highlightEffect: giftCardHighlightEffectEnum.default("NONE").notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    createdBy: bigint("created_by", { mode: "number", unsigned: true }),
    updatedBy: bigint("updated_by", { mode: "number", unsigned: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    cardValueIdx: uniqueIndex("gift_card_denominations_card_value_uq").on(
      table.giftCardId,
      table.faceValue,
      table.currency,
    ),
    cardSortIdx: index("gift_card_denominations_card_sort_idx").on(
      table.giftCardId,
      table.sortOrder,
    ),
    availableIdx: index("gift_card_denominations_available_idx").on(
      table.giftCardId,
      table.isAvailable,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = typeof galleryItems.$inferInsert;
export type NewsEvent = typeof newsEvents.$inferSelect;
export type InsertNewsEvent = typeof newsEvents.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = typeof giftCards.$inferInsert;
export type GiftCardDenomination = typeof giftCardDenominations.$inferSelect;
export type InsertGiftCardDenomination =
  typeof giftCardDenominations.$inferInsert;
