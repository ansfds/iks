-- Rollback for 2026-09-07_fintech_platform.sql.
-- Run only if you need to remove the fintech layer introduced by the migration.
-- This rollback leaves the existing public-site tables and users table untouched.

DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `trust_indicators`;
DROP TABLE IF EXISTS `social_links`;
DROP TABLE IF EXISTS `site_settings`;
DROP TABLE IF EXISTS `bank_accounts`;
DROP TABLE IF EXISTS `commission_rules`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `exchange_rate_history`;
DROP TABLE IF EXISTS `exchange_rates`;
DROP TABLE IF EXISTS `currencies`;
DROP TABLE IF EXISTS `countries`;
