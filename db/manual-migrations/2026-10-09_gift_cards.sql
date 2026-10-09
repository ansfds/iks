-- Gift Cards platform tables and initial data.
-- Run locally after taking a backup:
-- node tools/backup-db.mjs
-- node tools/run-sql-file.mjs db/manual-migrations/2026-10-09_gift_cards.sql --skip-fks

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

CREATE TABLE IF NOT EXISTS `gift_cards` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE TABLE IF NOT EXISTS `gift_card_denominations` (
  `id` serial AUTO_INCREMENT NOT NULL,
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

CREATE INDEX `gift_cards_public_idx` ON `gift_cards` (`status`,`sort_order`);
CREATE INDEX `gift_card_denominations_card_sort_idx` ON `gift_card_denominations` (`gift_card_id`,`sort_order`);
CREATE INDEX `gift_card_denominations_available_idx` ON `gift_card_denominations` (`gift_card_id`,`is_available`);

INSERT INTO `site_settings`
  (`setting_key`, `setting_value`, `setting_type`, `setting_group`, `is_public`, `sort_order`)
VALUES
  ('gift_cards_whatsapp_number', '218935095091', 'text', 'gift_cards', true, 1),
  ('home_gift_cards_background_url', '/images/gift-cards/playstation.svg', 'image', 'gift_cards', true, 2),
  ('home_services_background_url', '/images/alwaseet-transfer-hero.jpg', 'image', 'gift_cards', true, 3),
  ('gift_card_rate_10_to_100', '10', 'text', 'gift_cards', true, 4),
  ('gift_card_rate_above_100', '9.7', 'text', 'gift_cards', true, 5)
ON DUPLICATE KEY UPDATE `setting_key` = `site_settings`.`setting_key`;

INSERT INTO `gift_cards`
  (`name`, `display_name`, `slug`, `description`, `region_code`, `region_label`, `currency`, `image_url`, `background_url`, `status`, `sort_order`)
VALUES
  ('playstation', 'PlayStation Store', 'playstation', 'بطاقات PlayStation Store ريجن أمريكي. السعر النهائي يؤكد وقت الشراء عبر واتس أب.', 'US', 'ريجن أمريكي', 'USD', '/images/gift-cards/playstation.svg', '/images/gift-cards/playstation.svg', 'AVAILABLE', 1),
  ('xbox', 'Xbox', 'xbox', 'بطاقات Xbox ريجن أمريكي. اختر الفئة ثم تواصل عبر واتس أب لتأكيد السعر النهائي.', 'US', 'ريجن أمريكي', 'USD', '/images/gift-cards/xbox.svg', '/images/gift-cards/xbox.svg', 'AVAILABLE', 2),
  ('steam', 'Steam', 'steam', 'بطاقات Steam سيتم تفعيلها قريبًا.', 'US', 'ريجن أمريكي', 'USD', '/images/gift-cards/steam.svg', '/images/gift-cards/steam.svg', 'COMING_SOON', 3),
  ('apple', 'Apple', 'apple', 'بطاقات Apple سيتم تفعيلها قريبًا.', 'US', 'ريجن أمريكي', 'USD', '/images/gift-cards/apple.svg', '/images/gift-cards/apple.svg', 'COMING_SOON', 4),
  ('google-play', 'Google Play', 'google-play', 'بطاقات Google Play سيتم تفعيلها قريبًا.', 'US', 'ريجن أمريكي', 'USD', '/images/gift-cards/google-play.svg', '/images/gift-cards/google-play.svg', 'COMING_SOON', 5),
  ('nintendo', 'Nintendo', 'nintendo', 'بطاقات Nintendo سيتم تفعيلها قريبًا.', 'US', 'ريجن أمريكي', 'USD', '/images/gift-cards/nintendo.svg', '/images/gift-cards/nintendo.svg', 'COMING_SOON', 6),
  ('roblox', 'Roblox', 'roblox', 'بطاقات Roblox سيتم تفعيلها قريبًا.', 'US', 'ريجن أمريكي', 'USD', '/images/gift-cards/roblox.svg', '/images/gift-cards/roblox.svg', 'COMING_SOON', 7),
  ('razer', 'Razer Gold', 'razer', 'بطاقات Razer Gold سيتم تفعيلها قريبًا.', 'US', 'ريجن أمريكي', 'USD', '/images/gift-cards/razer.svg', '/images/gift-cards/razer.svg', 'COMING_SOON', 8),
  ('shein', 'SHEIN Gift Card', 'shein', 'بطاقات SHEIN بعروض خاصة على بعض الفئات. اختر الفئة ثم أكمل الطلب عبر واتس أب.', 'GLOBAL', 'دولي', 'USD', '/images/gift-cards/shein.svg', '/images/gift-cards/shein.svg', 'AVAILABLE', 9)
ON DUPLICATE KEY UPDATE `slug` = `gift_cards`.`slug`;

INSERT INTO `gift_card_denominations`
  (`gift_card_id`, `face_value`, `currency`, `selling_price_lyd`, `manual_selling_price_lyd`, `special_price_usd`, `is_available`, `is_most_popular`, `highlight_effect`, `sort_order`)
SELECT gc.id, d.face_value, 'USD',
  CASE WHEN d.face_value <= 100 THEN d.face_value * 10 ELSE d.face_value * 9.7 END,
  NULL, NULL, true, d.is_most_popular, d.highlight_effect, d.sort_order
FROM `gift_cards` gc
JOIN (
  SELECT 25.00 AS face_value, false AS is_most_popular, 'NONE' AS highlight_effect, 1 AS sort_order UNION ALL
  SELECT 30.00, false, 'NONE', 2 UNION ALL
  SELECT 40.00, false, 'NONE', 3 UNION ALL
  SELECT 50.00, true, 'FLAME', 4 UNION ALL
  SELECT 60.00, false, 'NONE', 5 UNION ALL
  SELECT 70.00, false, 'NONE', 6 UNION ALL
  SELECT 75.00, false, 'NONE', 7 UNION ALL
  SELECT 80.00, false, 'NONE', 8 UNION ALL
  SELECT 90.00, false, 'NONE', 9 UNION ALL
  SELECT 100.00, false, 'NONE', 10 UNION ALL
  SELECT 125.00, false, 'NONE', 11 UNION ALL
  SELECT 150.00, false, 'NONE', 12 UNION ALL
  SELECT 175.00, false, 'NONE', 13 UNION ALL
  SELECT 200.00, false, 'NONE', 14 UNION ALL
  SELECT 225.00, false, 'NONE', 15 UNION ALL
  SELECT 250.00, false, 'NONE', 16
) d
WHERE gc.slug = 'playstation'
ON DUPLICATE KEY UPDATE `face_value` = `gift_card_denominations`.`face_value`;

INSERT INTO `gift_card_denominations`
  (`gift_card_id`, `face_value`, `currency`, `selling_price_lyd`, `manual_selling_price_lyd`, `special_price_usd`, `is_available`, `is_most_popular`, `highlight_effect`, `sort_order`)
SELECT gc.id, d.face_value, 'USD',
  CASE WHEN d.face_value <= 100 THEN d.face_value * 10 ELSE d.face_value * 9.7 END,
  NULL, NULL, true, d.is_most_popular, d.highlight_effect, d.sort_order
FROM `gift_cards` gc
JOIN (
  SELECT 5.00 AS face_value, false AS is_most_popular, 'NONE' AS highlight_effect, 1 AS sort_order UNION ALL
  SELECT 10.00, false, 'NONE', 2 UNION ALL
  SELECT 15.00, false, 'NONE', 3 UNION ALL
  SELECT 20.00, false, 'NONE', 4 UNION ALL
  SELECT 25.00, false, 'NONE', 5 UNION ALL
  SELECT 30.00, false, 'NONE', 6 UNION ALL
  SELECT 40.00, false, 'NONE', 7 UNION ALL
  SELECT 50.00, true, 'NONE', 8 UNION ALL
  SELECT 60.00, false, 'NONE', 9 UNION ALL
  SELECT 70.00, false, 'NONE', 10 UNION ALL
  SELECT 80.00, false, 'NONE', 11 UNION ALL
  SELECT 90.00, false, 'NONE', 12 UNION ALL
  SELECT 100.00, false, 'NONE', 13
) d
WHERE gc.slug = 'xbox'
ON DUPLICATE KEY UPDATE `face_value` = `gift_card_denominations`.`face_value`;

INSERT INTO `gift_card_denominations`
  (`gift_card_id`, `face_value`, `currency`, `selling_price_lyd`, `manual_selling_price_lyd`, `special_price_usd`, `is_available`, `is_most_popular`, `highlight_effect`, `sort_order`)
SELECT gc.id, d.face_value, 'USD',
  CASE
    WHEN d.special_price_usd IS NOT NULL THEN d.special_price_usd * 9.7
    WHEN d.face_value <= 100 THEN d.face_value * 10
    ELSE d.face_value * 9.7
  END,
  NULL, d.special_price_usd, true, d.is_most_popular, d.highlight_effect, d.sort_order
FROM `gift_cards` gc
JOIN (
  SELECT 100.00 AS face_value, NULL AS special_price_usd, false AS is_most_popular, 'NONE' AS highlight_effect, 1 AS sort_order UNION ALL
  SELECT 300.00, 285.00, false, 'NONE', 2 UNION ALL
  SELECT 500.00, 455.00, false, 'NONE', 3 UNION ALL
  SELECT 800.00, 750.00, false, 'NONE', 4 UNION ALL
  SELECT 1000.00, 905.00, true, 'FLAME', 5
) d
WHERE gc.slug = 'shein'
ON DUPLICATE KEY UPDATE
  `special_price_usd` = VALUES(`special_price_usd`),
  `selling_price_lyd` = VALUES(`selling_price_lyd`);
