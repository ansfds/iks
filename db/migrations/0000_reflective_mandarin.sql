CREATE TABLE `activity_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`action` varchar(120) NOT NULL,
	`entity_type` varchar(120) NOT NULL,
	`entity_id` bigint unsigned,
	`metadata` text,
	`ip_address` varchar(80),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_auth_attempts` (
	`bucket` varchar(32) NOT NULL,
	`attempts` int unsigned NOT NULL DEFAULT 0,
	`resetAt` bigint unsigned NOT NULL,
	CONSTRAINT `admin_auth_attempts_bucket` PRIMARY KEY(`bucket`)
);
--> statement-breakpoint
CREATE TABLE `admin_auth_sessions` (
	`tokenHash` varchar(64) NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`fingerprint` varchar(64) NOT NULL,
	`expiresAt` bigint unsigned NOT NULL,
	CONSTRAINT `admin_auth_sessions_tokenHash` PRIMARY KEY(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title_ar` varchar(255) NOT NULL,
	`title_en` varchar(255),
	`body_ar` text,
	`body_en` text,
	`level` enum('info','success','warning') NOT NULL DEFAULT 'info',
	`is_active` boolean NOT NULL DEFAULT true,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`sort_order` int NOT NULL DEFAULT 0,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`country_id` bigint unsigned NOT NULL,
	`currency_id` bigint unsigned NOT NULL,
	`bank_name_ar` varchar(255) NOT NULL,
	`bank_name_en` varchar(255),
	`account_name` varchar(255) NOT NULL,
	`account_number` varchar(255) NOT NULL,
	`iban` varchar(255),
	`bank_logo_url` varchar(500),
	`notes_ar` text,
	`notes_en` text,
	`slug` varchar(180) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bank_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_accounts_country_slug_uq` UNIQUE(`country_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `commission_rules` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`service_id` bigint unsigned NOT NULL,
	`minimum_amount` decimal(18,6) NOT NULL,
	`maximum_amount` decimal(18,6) NOT NULL,
	`commission_type` enum('percentage','fixed') NOT NULL,
	`commission_value` decimal(18,6) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commission_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`studentName` varchar(255) NOT NULL,
	`parentName` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(50),
	`grade` varchar(100),
	`message` text NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`isRead` boolean NOT NULL DEFAULT false,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name_ar` varchar(255) NOT NULL,
	`name_en` varchar(255),
	`slug` varchar(180) NOT NULL,
	`iso_code` varchar(8),
	`flag_emoji` varchar(16),
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`symbol` varchar(24) NOT NULL,
	`name_ar` varchar(255) NOT NULL,
	`name_en` varchar(255),
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `currencies_symbol_uq` UNIQUE(`symbol`)
);
--> statement-breakpoint
CREATE TABLE `exchange_rate_history` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`currency_id` bigint unsigned NOT NULL,
	`field` enum('buy','sell','calculator') NOT NULL,
	`old_value` decimal(18,6),
	`new_value` decimal(18,6),
	`changed_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchange_rate_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`currency_id` bigint unsigned NOT NULL,
	`buy_price` decimal(18,6),
	`sell_price` decimal(18,6),
	`calculator_rate` decimal(18,6),
	`is_active` boolean NOT NULL DEFAULT true,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchange_rates_id` PRIMARY KEY(`id`),
	CONSTRAINT `exchange_rates_currency_uq` UNIQUE(`currency_id`)
);
--> statement-breakpoint
CREATE TABLE `gallery_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`description` text,
	`descriptionAr` text,
	`imageUrl` varchar(500) NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'all',
	`sortOrder` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gallery_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gift_card_denominations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`gift_card_id` bigint unsigned NOT NULL,
	`face_value` decimal(10,2) NOT NULL,
	`currency` varchar(12) NOT NULL DEFAULT 'USD',
	`selling_price_lyd` decimal(18,3),
	`manual_selling_price_lyd` decimal(18,3),
	`special_price_usd` decimal(10,2),
	`is_available` boolean NOT NULL DEFAULT true,
	`is_most_popular` boolean NOT NULL DEFAULT false,
	`highlight_effect` enum('NONE','FLAME') NOT NULL DEFAULT 'NONE',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gift_card_denominations_id` PRIMARY KEY(`id`),
	CONSTRAINT `gift_card_denominations_card_value_uq` UNIQUE(`gift_card_id`,`face_value`,`currency`)
);
--> statement-breakpoint
CREATE TABLE `gift_cards` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`display_name` varchar(255) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`region_code` varchar(20) NOT NULL DEFAULT 'US',
	`region_label` varchar(120) NOT NULL DEFAULT 'ريجن أمريكي',
	`currency` varchar(12) NOT NULL DEFAULT 'USD',
	`image_url` varchar(500),
	`background_url` varchar(500),
	`status` enum('AVAILABLE','COMING_SOON','UNAVAILABLE','HIDDEN') NOT NULL DEFAULT 'COMING_SOON',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gift_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `gift_cards_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `news_events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`excerpt` text,
	`excerptAr` text,
	`content` text NOT NULL,
	`contentAr` text,
	`imageUrl` varchar(500),
	`eventDate` date,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `news_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name_ar` varchar(255) NOT NULL,
	`name_en` varchar(255),
	`description_ar` text,
	`description_en` text,
	`image_url` varchar(500),
	`icon` varchar(80),
	`href` varchar(500),
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_calculator_enabled` boolean NOT NULL DEFAULT false,
	`calculator_currency_id` bigint unsigned,
	`calculator_rate_type` enum('buy','sell','calculator') NOT NULL DEFAULT 'calculator',
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(180) NOT NULL,
	`setting_value` text,
	`setting_type` enum('text','url','image','json') NOT NULL DEFAULT 'text',
	`setting_group` varchar(120) DEFAULT 'general',
	`is_public` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_uq` UNIQUE(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `social_links` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`platform` varchar(80) NOT NULL,
	`label` varchar(120),
	`url` varchar(500) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`authorNameAr` varchar(255),
	`role` varchar(255),
	`roleAr` varchar(255),
	`quote` text NOT NULL,
	`quoteAr` text,
	`rating` int NOT NULL DEFAULT 5,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trust_indicators` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`label_ar` varchar(255) NOT NULL,
	`label_en` varchar(255),
	`value` varchar(80),
	`unit_ar` varchar(80),
	`unit_en` varchar(80),
	`description_ar` text,
	`description_en` text,
	`icon` varchar(80),
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`updated_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trust_indicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`unionId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`avatar` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_unionId_unique` UNIQUE(`unionId`)
);
--> statement-breakpoint
CREATE INDEX `activity_logs_entity_idx` ON `activity_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `activity_logs_created_idx` ON `activity_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `activity_logs_user_idx` ON `activity_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `admin_auth_sessions_expiry` ON `admin_auth_sessions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `announcements_active_window_idx` ON `announcements` (`is_active`,`starts_at`,`ends_at`,`sort_order`);--> statement-breakpoint
CREATE INDEX `bank_accounts_public_idx` ON `bank_accounts` (`is_active`,`country_id`,`currency_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `commission_rules_service_active_idx` ON `commission_rules` (`service_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `commission_rules_range_idx` ON `commission_rules` (`service_id`,`minimum_amount`,`maximum_amount`);--> statement-breakpoint
CREATE INDEX `countries_active_sort_idx` ON `countries` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE INDEX `currencies_active_sort_idx` ON `currencies` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE INDEX `exchange_rate_history_currency_idx` ON `exchange_rate_history` (`currency_id`);--> statement-breakpoint
CREATE INDEX `exchange_rate_history_created_idx` ON `exchange_rate_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `exchange_rates_active_idx` ON `exchange_rates` (`is_active`);--> statement-breakpoint
CREATE INDEX `gift_card_denominations_card_sort_idx` ON `gift_card_denominations` (`gift_card_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `gift_card_denominations_available_idx` ON `gift_card_denominations` (`gift_card_id`,`is_available`);--> statement-breakpoint
CREATE INDEX `gift_cards_public_idx` ON `gift_cards` (`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `services_active_sort_idx` ON `services` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE INDEX `services_calculator_idx` ON `services` (`is_calculator_enabled`,`calculator_currency_id`);--> statement-breakpoint
CREATE INDEX `site_settings_public_group_idx` ON `site_settings` (`is_public`,`setting_group`);--> statement-breakpoint
CREATE INDEX `social_links_active_sort_idx` ON `social_links` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE INDEX `trust_indicators_active_sort_idx` ON `trust_indicators` (`is_active`,`sort_order`);