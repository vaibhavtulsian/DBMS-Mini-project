-- ============================================================================
-- 03_indexes.sql: B-Tree, Partial, and Full-Text GIN Indexes
-- PRD Section 7.2 & 8.1
-- ============================================================================

-- 1. B-Tree Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_sku_id 
    ON inventory(sku_id);

CREATE INDEX IF NOT EXISTS idx_orders_retailer_date 
    ON orders(retailer_id, order_date DESC);

CREATE INDEX IF NOT EXISTS idx_order_item_sku_id 
    ON order_item(sku_id);

CREATE INDEX IF NOT EXISTS idx_order_item_order_id 
    ON order_item(order_id);

CREATE INDEX IF NOT EXISTS idx_ledger_retailer_date 
    ON ledger_entry(retailer_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_sku_product_id 
    ON sku(product_id);

CREATE INDEX IF NOT EXISTS idx_product_brand_id 
    ON product(brand_id);

CREATE INDEX IF NOT EXISTS idx_payment_retailer_order 
    ON payment(retailer_id, order_id);

-- 2. Partial Index for Operational Performance
-- Accelerates querying for unresolved inventory triggers
CREATE INDEX IF NOT EXISTS idx_low_stock_alert_open 
    ON low_stock_alert(status) 
    WHERE status = 'OPEN';

-- 3. Full-Text Search GIN Indexes (Used for keyword search & baseline comparison with vector search)
CREATE INDEX IF NOT EXISTS idx_spec_sheet_fts 
    ON spec_sheet USING gin(to_tsvector('english', spec_text));

CREATE INDEX IF NOT EXISTS idx_review_fts 
    ON review USING gin(to_tsvector('english', review_text));

-- 4. Demonstration of index lifecycle: create a temporary index and drop it (PRD Section 8.1)
CREATE INDEX IF NOT EXISTS idx_temp_demo_cleanup ON orders(notes);
DROP INDEX IF EXISTS idx_temp_demo_cleanup;
