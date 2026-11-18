-- ============================================================================
-- 00_reset.sql: Clean teardown of all tables, views, functions, triggers, types
-- PRD Section 8.1: Drops tables with CASCADE; drops views, triggers, functions
-- ============================================================================

-- Drop triggers if existing
DROP TRIGGER IF EXISTS trg_check_low_stock ON inventory CASCADE;
DROP TRIGGER IF EXISTS trg_update_timestamp_inventory ON inventory CASCADE;
DROP TRIGGER IF EXISTS trg_update_timestamp_spec ON spec_sheet CASCADE;

-- Drop functions & procedures
DROP FUNCTION IF EXISTS fn_inventory_low_stock_alert() CASCADE;
DROP FUNCTION IF EXISTS record_payment(INT, INT, NUMERIC, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS place_order_transaction(INT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS fn_update_timestamp() CASCADE;

-- Drop views
DROP VIEW IF EXISTS v_stock_summary CASCADE;
DROP VIEW IF EXISTS v_monthly_financials CASCADE;

-- Drop vector tables
DROP TABLE IF EXISTS review_embedding CASCADE;
DROP TABLE IF EXISTS spec_embedding CASCADE;

-- Drop application tables in reverse-dependency order
DROP TABLE IF EXISTS ledger_entry CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS order_item CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS low_stock_alert CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS warehouse CASCADE;
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS spec_sheet CASCADE;
DROP TABLE IF EXISTS sku CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS brand CASCADE;
DROP TABLE IF EXISTS retailer CASCADE;
DROP TABLE IF EXISTS users CASCADE;
