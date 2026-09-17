-- Manual safe migration for the Alwaseet fintech platform.
-- Run only after taking a database backup. This file intentionally creates
-- only the new fintech tables and leaves the existing legacy tables intact.

CREATE TABLE IF NOT EXISTS `countries` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `currencies` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `exchange_rate_history` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `currency_id` bigint unsigned NOT NULL,
  `field` enum('buy','sell','calculator') NOT NULL,
  `old_value` decimal(18,6),
  `new_value` decimal(18,6),
  `changed_by` bigint unsigned,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `exchange_rate_history_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `services` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `commission_rules` (
  `id` serial AUTO_INCREMENT NOT NULL,
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
  CONSTRAINT `commission_rules_id` PRIMARY KEY(`id`),
  CONSTRAINT `commission_rules_amount_check` CHECK (`maximum_amount` >= `minimum_amount`),
  CONSTRAINT `commission_rules_value_check` CHECK (`commission_value` >= 0)
);

CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `social_links` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `trust_indicators` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `user_id` bigint unsigned,
  `action` varchar(120) NOT NULL,
  `entity_type` varchar(120) NOT NULL,
  `entity_id` bigint unsigned,
  `metadata` text,
  `ip_address` varchar(80),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);

CREATE INDEX `countries_active_sort_idx` ON `countries` (`is_active`,`sort_order`);
CREATE INDEX `currencies_active_sort_idx` ON `currencies` (`is_active`,`sort_order`);
CREATE INDEX `exchange_rates_active_idx` ON `exchange_rates` (`is_active`);
CREATE INDEX `exchange_rate_history_currency_idx` ON `exchange_rate_history` (`currency_id`);
CREATE INDEX `exchange_rate_history_created_idx` ON `exchange_rate_history` (`created_at`);
CREATE INDEX `services_active_sort_idx` ON `services` (`is_active`,`sort_order`);
CREATE INDEX `services_calculator_idx` ON `services` (`is_calculator_enabled`,`calculator_currency_id`);
CREATE INDEX `commission_rules_service_active_idx` ON `commission_rules` (`service_id`,`is_active`);
CREATE INDEX `commission_rules_range_idx` ON `commission_rules` (`service_id`,`minimum_amount`,`maximum_amount`);
CREATE INDEX `bank_accounts_public_idx` ON `bank_accounts` (`is_active`,`country_id`,`currency_id`,`sort_order`);
CREATE INDEX `site_settings_public_group_idx` ON `site_settings` (`is_public`,`setting_group`);
CREATE INDEX `social_links_active_sort_idx` ON `social_links` (`is_active`,`sort_order`);
CREATE INDEX `trust_indicators_active_sort_idx` ON `trust_indicators` (`is_active`,`sort_order`);
CREATE INDEX `announcements_active_window_idx` ON `announcements` (`is_active`,`starts_at`,`ends_at`,`sort_order`);
CREATE INDEX `activity_logs_entity_idx` ON `activity_logs` (`entity_type`,`entity_id`);
CREATE INDEX `activity_logs_created_idx` ON `activity_logs` (`created_at`);
CREATE INDEX `activity_logs_user_idx` ON `activity_logs` (`user_id`);

-- Foreign keys are kept separate so hosts that do not support FK constraints
-- can skip this block and still rely on the server-side validation.
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_currency_id_currencies_id_fk` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `exchange_rate_history` ADD CONSTRAINT `exchange_rate_history_currency_id_currencies_id_fk` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `exchange_rate_history` ADD CONSTRAINT `exchange_rate_history_changed_by_users_id_fk` FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `services` ADD CONSTRAINT `services_calculator_currency_id_currencies_id_fk` FOREIGN KEY (`calculator_currency_id`) REFERENCES `currencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `services` ADD CONSTRAINT `services_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `services` ADD CONSTRAINT `services_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `commission_rules` ADD CONSTRAINT `commission_rules_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_country_id_countries_id_fk` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_currency_id_currencies_id_fk` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `site_settings` ADD CONSTRAINT `site_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `social_links` ADD CONSTRAINT `social_links_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `trust_indicators` ADD CONSTRAINT `trust_indicators_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
