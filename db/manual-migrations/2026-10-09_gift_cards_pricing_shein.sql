-- Adds pricing rules, manual overrides, SHEIN, and materialized LYD prices.
-- Run locally after a backup:
-- node tools/backup-db.mjs
-- node tools/run-sql-file.mjs db/manual-migrations/2026-10-09_gift_cards_pricing_shein.sql --skip-fks

ALTER TABLE `gift_card_denominations`
  ADD COLUMN IF NOT EXISTS `manual_selling_price_lyd` decimal(18,3) NULL AFTER `selling_price_lyd`,
  ADD COLUMN IF NOT EXISTS `special_price_usd` decimal(10,2) NULL AFTER `manual_selling_price_lyd`;

UPDATE `gift_card_denominations`
SET `manual_selling_price_lyd` = `selling_price_lyd`
WHERE `manual_selling_price_lyd` IS NULL
  AND `selling_price_lyd` IS NOT NULL;

INSERT INTO `site_settings`
  (`setting_key`, `setting_value`, `setting_type`, `setting_group`, `is_public`, `sort_order`)
VALUES
  ('gift_card_rate_10_to_100', '10', 'text', 'gift_cards', true, 4),
  ('gift_card_rate_above_100', '9.7', 'text', 'gift_cards', true, 5)
ON DUPLICATE KEY UPDATE `setting_key` = `site_settings`.`setting_key`;

INSERT INTO `gift_cards`
  (`name`, `display_name`, `slug`, `description`, `region_code`, `region_label`, `currency`, `image_url`, `background_url`, `status`, `sort_order`)
VALUES
  ('shein', 'SHEIN Gift Card', 'shein', 'بطاقات SHEIN بعروض خاصة على بعض الفئات. اختر الفئة ثم أكمل الطلب عبر واتس أب.', 'GLOBAL', 'دولي', 'USD', '/images/gift-cards/shein.svg', '/images/gift-cards/shein.svg', 'AVAILABLE', 9)
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `description` = VALUES(`description`),
  `region_code` = VALUES(`region_code`),
  `region_label` = VALUES(`region_label`),
  `status` = VALUES(`status`);

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
  `selling_price_lyd` = VALUES(`selling_price_lyd`),
  `is_available` = VALUES(`is_available`),
  `is_most_popular` = VALUES(`is_most_popular`),
  `highlight_effect` = VALUES(`highlight_effect`),
  `sort_order` = VALUES(`sort_order`);

UPDATE `gift_card_denominations` d
JOIN `gift_cards` gc ON gc.id = d.gift_card_id
SET d.`selling_price_lyd` =
  CASE
    WHEN d.`manual_selling_price_lyd` IS NOT NULL THEN d.`manual_selling_price_lyd`
    WHEN d.`special_price_usd` IS NOT NULL THEN d.`special_price_usd` * 9.7
    WHEN d.`face_value` <= 100 THEN d.`face_value` * 10
    ELSE d.`face_value` * 9.7
  END
WHERE gc.slug IN ('playstation', 'xbox', 'shein');
