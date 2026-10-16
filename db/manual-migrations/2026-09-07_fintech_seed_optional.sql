-- Optional starter content. This file intentionally does not insert prices,
-- commissions, bank account numbers, contact numbers, or financial claims.

INSERT IGNORE INTO `countries` (`name_ar`, `name_en`, `slug`, `iso_code`, `sort_order`)
VALUES
  ('ليبيا', 'Libya', 'libya', 'LY', 10),
  ('مصر', 'Egypt', 'egypt', 'EG', 20),
  ('الصين', 'China', 'china', 'CN', 30);

INSERT IGNORE INTO `currencies` (`symbol`, `name_ar`, `name_en`, `sort_order`)
VALUES
  ('USD', 'الدولار الأمريكي', 'US Dollar', 10),
  ('EUR', 'اليورو', 'Euro', 20),
  ('USDT', 'تيثر', 'Tether', 30),
  ('CNY', 'اليوان الصيني', 'Chinese Yuan', 40);

INSERT IGNORE INTO `exchange_rates` (`currency_id`, `buy_price`, `sell_price`, `calculator_rate`, `is_active`)
SELECT `id`, NULL, NULL, NULL, true FROM `currencies`;

INSERT INTO `services` (`name_ar`, `description_ar`, `icon`, `href`, `is_active`, `sort_order`, `is_calculator_enabled`, `calculator_currency_id`, `calculator_rate_type`)
SELECT 'شراء USDT', 'خدمة شراء USDT حسب الأسعار المعتمدة من لوحة الإدارة.', 'usdt', '/#calculator', true, 10, true, `id`, 'sell'
FROM `currencies`
WHERE `symbol` = 'USDT'
  AND NOT EXISTS (SELECT 1 FROM `services` WHERE `name_ar` = 'شراء USDT');

INSERT INTO `services` (`name_ar`, `description_ar`, `icon`, `href`, `is_active`, `sort_order`, `is_calculator_enabled`, `calculator_currency_id`, `calculator_rate_type`)
SELECT 'بيع USDT', 'خدمة بيع USDT حسب الأسعار المعتمدة من لوحة الإدارة.', 'usdt', '/#calculator', true, 20, true, `id`, 'buy'
FROM `currencies`
WHERE `symbol` = 'USDT'
  AND NOT EXISTS (SELECT 1 FROM `services` WHERE `name_ar` = 'بيع USDT');

INSERT INTO `services` (`name_ar`, `description_ar`, `icon`, `href`, `is_active`, `sort_order`, `is_calculator_enabled`, `calculator_currency_id`, `calculator_rate_type`)
SELECT 'الدولار الأمريكي', 'حساب تحويل الدولار وفق سعر الحاسبة المدخل من الإدارة.', 'money', '/#calculator', true, 30, true, `id`, 'calculator'
FROM `currencies`
WHERE `symbol` = 'USD'
  AND NOT EXISTS (SELECT 1 FROM `services` WHERE `name_ar` = 'الدولار الأمريكي');

INSERT INTO `services` (`name_ar`, `description_ar`, `icon`, `href`, `is_active`, `sort_order`, `is_calculator_enabled`, `calculator_currency_id`, `calculator_rate_type`)
SELECT 'اليورو', 'حساب تحويل اليورو وفق سعر الحاسبة المدخل من الإدارة.', 'money', '/#calculator', true, 40, true, `id`, 'calculator'
FROM `currencies`
WHERE `symbol` = 'EUR'
  AND NOT EXISTS (SELECT 1 FROM `services` WHERE `name_ar` = 'اليورو');

INSERT INTO `services` (`name_ar`, `description_ar`, `icon`, `href`, `is_active`, `sort_order`, `is_calculator_enabled`, `calculator_currency_id`, `calculator_rate_type`)
SELECT 'اليوان الصيني', 'مدفوعات وتحويلات الصين وفق سعر الحاسبة المدخل من الإدارة.', 'china', '/#calculator', true, 50, true, `id`, 'calculator'
FROM `currencies`
WHERE `symbol` = 'CNY'
  AND NOT EXISTS (SELECT 1 FROM `services` WHERE `name_ar` = 'اليوان الصيني');

INSERT INTO `services` (`name_ar`, `description_ar`, `icon`, `href`, `is_active`, `sort_order`, `is_calculator_enabled`)
SELECT 'دفع الفواتير الدولية', 'خدمات دفع فواتير ومدفوعات دولية يتم تفصيلها عبر التواصل الرسمي.', 'bills', '/contact', true, 60, false
WHERE NOT EXISTS (SELECT 1 FROM `services` WHERE `name_ar` = 'دفع الفواتير الدولية');

INSERT INTO `services` (`name_ar`, `description_ar`, `icon`, `href`, `is_active`, `sort_order`, `is_calculator_enabled`)
SELECT 'خدمات التجارة الإلكترونية', 'حلول مدفوعات للتجارة الإلكترونية والمنصات الرقمية.', 'ecommerce', '/contact', true, 70, false
WHERE NOT EXISTS (SELECT 1 FROM `services` WHERE `name_ar` = 'خدمات التجارة الإلكترونية');

INSERT INTO `services` (`name_ar`, `description_ar`, `icon`, `href`, `is_active`, `sort_order`, `is_calculator_enabled`)
SELECT 'خدمات السفر والحجوزات', 'مدفوعات السفر والحجوزات عبر القنوات الرسمية للشركة.', 'travel', '/contact', true, 80, false
WHERE NOT EXISTS (SELECT 1 FROM `services` WHERE `name_ar` = 'خدمات السفر والحجوزات');

INSERT INTO `site_settings` (`setting_key`, `setting_value`, `setting_type`, `setting_group`, `is_public`, `sort_order`)
VALUES
  ('company_name', 'الوسيط المعتمد', 'text', 'general', true, 10),
  ('hero_title', 'تحويلات مالية ومدفوعات محلية ودولية بثقة وسرعة', 'text', 'hero', true, 20),
  ('hero_description', 'احسب حوالتك، راجع أسعار اليوم، وانسخ حساب التحويل المناسب خلال ثوانٍ.', 'text', 'hero', true, 30)
ON DUPLICATE KEY UPDATE
  `setting_value` = VALUES(`setting_value`),
  `setting_type` = VALUES(`setting_type`),
  `setting_group` = VALUES(`setting_group`),
  `is_public` = VALUES(`is_public`),
  `sort_order` = VALUES(`sort_order`);
