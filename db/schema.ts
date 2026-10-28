// PostgreSQL reference schema. Runtime uses Supabase Data API and transactional RPCs.
import { pgTable, bigint, integer, text, boolean, timestamp, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';

export const countries = pgTable('countries', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  slug: text('slug').notNull(),
  isoCode: text('iso_code'),
  flagEmoji: text('flag_emoji'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const currencies = pgTable('currencies', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  symbol: text('symbol').notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const exchangeRates = pgTable('exchange_rates', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  currencyId: bigint('currency_id', { mode: 'number' }).notNull(),
  buyPrice: numeric('buy_price'),
  sellPrice: numeric('sell_price'),
  calculatorRate: numeric('calculator_rate'),
  isActive: boolean('is_active').notNull().default(true),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const exchangeRateHistory = pgTable('exchange_rate_history', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  currencyId: bigint('currency_id', { mode: 'number' }).notNull(),
  field: text('field').notNull(),
  oldValue: numeric('old_value'),
  newValue: numeric('new_value'),
  changedBy: bigint('changed_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const services = pgTable('services', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),
  imageUrl: text('image_url'),
  icon: text('icon'),
  href: text('href'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  isCalculatorEnabled: boolean('is_calculator_enabled').notNull().default(false),
  calculatorCurrencyId: bigint('calculator_currency_id', { mode: 'number' }),
  calculatorRateType: text('calculator_rate_type').notNull().default("calculator"),
  createdBy: bigint('created_by', { mode: 'number' }),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const commissionRules = pgTable('commission_rules', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  serviceId: bigint('service_id', { mode: 'number' }).notNull(),
  minimumAmount: numeric('minimum_amount').notNull(),
  maximumAmount: numeric('maximum_amount').notNull(),
  commissionType: text('commission_type').notNull(),
  commissionValue: numeric('commission_value').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdBy: bigint('created_by', { mode: 'number' }),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const bankAccounts = pgTable('bank_accounts', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  countryId: bigint('country_id', { mode: 'number' }).notNull(),
  currencyId: bigint('currency_id', { mode: 'number' }).notNull(),
  bankNameAr: text('bank_name_ar').notNull(),
  bankNameEn: text('bank_name_en'),
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number').notNull(),
  iban: text('iban'),
  bankLogoUrl: text('bank_logo_url'),
  notesAr: text('notes_ar'),
  notesEn: text('notes_en'),
  slug: text('slug').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdBy: bigint('created_by', { mode: 'number' }),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const giftCards = pgTable('gift_cards', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  regionCode: text('region_code').notNull().default("US"),
  regionLabel: text('region_label').notNull().default("ريجن أمريكي"),
  currency: text('currency').notNull().default("USD"),
  imageUrl: text('image_url'),
  backgroundUrl: text('background_url'),
  status: text('status').notNull().default("COMING_SOON"),
  sortOrder: integer('sort_order').notNull().default(0),
  createdBy: bigint('created_by', { mode: 'number' }),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const giftCardDenominations = pgTable('gift_card_denominations', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  giftCardId: bigint('gift_card_id', { mode: 'number' }).notNull(),
  faceValue: numeric('face_value').notNull(),
  currency: text('currency').notNull().default("USD"),
  isAvailable: boolean('is_available').notNull().default(true),
  isMostPopular: boolean('is_most_popular').notNull().default(false),
  highlightEffect: text('highlight_effect').notNull().default("NONE"),
  sortOrder: integer('sort_order').notNull().default(0),
  createdBy: bigint('created_by', { mode: 'number' }),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const siteSettings = pgTable('site_settings', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  key: text('setting_key').notNull(),
  value: text('setting_value'),
  type: text('setting_type').notNull().default("text"),
  group: text('setting_group').default("general"),
  isPublic: boolean('is_public').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const socialLinks = pgTable('social_links', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  platform: text('platform').notNull(),
  label: text('label'),
  url: text('url').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const trustIndicators = pgTable('trust_indicators', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  labelAr: text('label_ar').notNull(),
  labelEn: text('label_en'),
  value: text('value'),
  unitAr: text('unit_ar'),
  unitEn: text('unit_en'),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),
  icon: text('icon'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const announcements = pgTable('announcements', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en'),
  bodyAr: text('body_ar'),
  bodyEn: text('body_en'),
  level: text('level').notNull().default("info"),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' }),
  endsAt: timestamp('ends_at', { withTimezone: true, mode: 'date' }),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedBy: bigint('updated_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const galleryItems = pgTable('gallery_items', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  title: text('title').notNull(),
  titleAr: text('title_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  imageUrl: text('image_url').notNull(),
  category: text('category').notNull().default("all"),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const newsEvents = pgTable('news_events', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  title: text('title').notNull(),
  titleAr: text('title_ar'),
  excerpt: text('excerpt'),
  excerptAr: text('excerpt_ar'),
  content: text('content').notNull(),
  contentAr: text('content_ar'),
  imageUrl: text('image_url'),
  eventDate: timestamp('event_date', { withTimezone: true, mode: 'date' }),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const testimonials = pgTable('testimonials', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  authorName: text('author_name').notNull(),
  authorNameAr: text('author_name_ar'),
  role: text('role'),
  roleAr: text('role_ar'),
  quote: text('quote').notNull(),
  quoteAr: text('quote_ar'),
  rating: integer('rating').notNull().default(5),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const giftCardPricing = pgTable('gift_card_pricing', { id: bigint('id', {mode:'number'}).primaryKey().references(()=>giftCardDenominations.id,{onDelete:'cascade'}), sellingPriceLyd: numeric('selling_price_lyd'), manualSellingPriceLyd: numeric('manual_selling_price_lyd'), specialPriceUsd: numeric('special_price_usd') });
export const cmsState = pgTable('cms_state', { id: integer('id').primaryKey(), revision: bigint('revision',{mode:'number'}).notNull().default(1), nextIds: jsonb('next_ids').notNull(), lastOperation: text('last_operation').notNull().default(''), migrationVerified: boolean('migration_verified').notNull().default(false) });
export const activityLogs = pgTable('activity_logs', { id: bigint('id',{mode:'number'}).generatedByDefaultAsIdentity().primaryKey(), userId: uuid('user_id'), legacyUserId: bigint('legacy_user_id',{mode:'number'}), action: text('action').notNull(), entityType: text('entity_type').notNull(), entityId: bigint('entity_id',{mode:'number'}), metadata: text('metadata').notNull().default(''), createdAt: timestamp('created_at',{withTimezone:true}).defaultNow().notNull() });
export const contacts = pgTable('contacts', { id: bigint('id',{mode:'number'}).generatedByDefaultAsIdentity().primaryKey(), studentName:text('student_name').notNull(), parentName:text('parent_name').notNull(), email:text('email').notNull(),phone:text('phone'),grade:text('grade'),message:text('message').notNull(),language:text('language').notNull().default('ar'),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),isRead:boolean('is_read').default(false).notNull() });
