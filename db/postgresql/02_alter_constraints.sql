-- ============================================================================
-- 02_alter_constraints.sql: Foreign Keys, Unique & Check Constraints, Column Migration
-- PRD Section 7.1, 7.2 & 8.1
-- ============================================================================

-- 1. Migration demo: Add column sku.is_active and enforce NOT NULL (PRD Section 8.1)
ALTER TABLE sku ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
UPDATE sku SET is_active = TRUE WHERE is_active IS NULL;
ALTER TABLE sku ALTER COLUMN is_active SET NOT NULL;

-- 2. Unique Constraints
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);
ALTER TABLE retailer ADD CONSTRAINT uk_retailer_user UNIQUE (user_id);
ALTER TABLE retailer ADD CONSTRAINT uk_retailer_gstin UNIQUE (gstin);
ALTER TABLE brand ADD CONSTRAINT uk_brand_name UNIQUE (brand_name);
ALTER TABLE sku ADD CONSTRAINT uk_sku_code UNIQUE (sku_code);
ALTER TABLE spec_sheet ADD CONSTRAINT uk_spec_product UNIQUE (product_id);
ALTER TABLE review ADD CONSTRAINT uk_review_retailer_product UNIQUE (retailer_id, product_id);

-- 3. Check Constraints
ALTER TABLE users ADD CONSTRAINT chk_users_role 
    CHECK (role IN ('DISTRIBUTOR', 'RETAILER'));

ALTER TABLE retailer ADD CONSTRAINT chk_retailer_gstin_len 
    CHECK (LENGTH(TRIM(gstin)) = 15);

ALTER TABLE retailer ADD CONSTRAINT chk_retailer_credit_limit 
    CHECK (credit_limit >= 0);

ALTER TABLE retailer ADD CONSTRAINT chk_retailer_balance 
    CHECK (outstanding_balance >= 0);

ALTER TABLE sku ADD CONSTRAINT chk_sku_price 
    CHECK (wholesale_price > 0);

ALTER TABLE sku ADD CONSTRAINT chk_sku_ram 
    CHECK (ram_gb > 0);

ALTER TABLE sku ADD CONSTRAINT chk_sku_storage 
    CHECK (storage_gb > 0);

ALTER TABLE review ADD CONSTRAINT chk_review_rating 
    CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE warehouse ADD CONSTRAINT chk_warehouse_capacity 
    CHECK (capacity > 0);

ALTER TABLE inventory ADD CONSTRAINT chk_inventory_qty 
    CHECK (quantity_on_hand >= 0);

ALTER TABLE inventory ADD CONSTRAINT chk_inventory_threshold 
    CHECK (reorder_threshold >= 0);

ALTER TABLE low_stock_alert ADD CONSTRAINT chk_alert_status 
    CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED'));

ALTER TABLE orders ADD CONSTRAINT chk_order_status 
    CHECK (status IN ('PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'));

ALTER TABLE orders ADD CONSTRAINT chk_order_payment_status 
    CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID'));

ALTER TABLE orders ADD CONSTRAINT chk_order_total 
    CHECK (total_amount >= 0);

ALTER TABLE order_item ADD CONSTRAINT chk_order_item_qty 
    CHECK (quantity > 0);

ALTER TABLE order_item ADD CONSTRAINT chk_order_item_price 
    CHECK (unit_price > 0);

ALTER TABLE payment ADD CONSTRAINT chk_payment_amount 
    CHECK (amount > 0);

ALTER TABLE payment ADD CONSTRAINT chk_payment_method 
    CHECK (payment_method IN ('BANK_TRANSFER', 'CHEQUE', 'NEFT_RTGS', 'UPI', 'CASH'));

ALTER TABLE ledger_entry ADD CONSTRAINT chk_ledger_entry_type 
    CHECK (entry_type IN ('DEBIT', 'CREDIT'));

ALTER TABLE ledger_entry ADD CONSTRAINT chk_ledger_amount 
    CHECK (amount > 0);

-- 4. Foreign Key Constraints with strict cascading / restriction policies
ALTER TABLE retailer ADD CONSTRAINT fk_retailer_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT;

ALTER TABLE product ADD CONSTRAINT fk_product_brand 
    FOREIGN KEY (brand_id) REFERENCES brand(brand_id) ON DELETE RESTRICT;

ALTER TABLE sku ADD CONSTRAINT fk_sku_product 
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE RESTRICT;

ALTER TABLE spec_sheet ADD CONSTRAINT fk_spec_product 
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE;

ALTER TABLE review ADD CONSTRAINT fk_review_retailer 
    FOREIGN KEY (retailer_id) REFERENCES retailer(retailer_id) ON DELETE RESTRICT;

ALTER TABLE review ADD CONSTRAINT fk_review_product 
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE RESTRICT;

ALTER TABLE inventory ADD CONSTRAINT fk_inventory_warehouse 
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT;

ALTER TABLE inventory ADD CONSTRAINT fk_inventory_sku 
    FOREIGN KEY (sku_id) REFERENCES sku(sku_id) ON DELETE RESTRICT;

ALTER TABLE low_stock_alert ADD CONSTRAINT fk_alert_inventory 
    FOREIGN KEY (warehouse_id, sku_id) REFERENCES inventory(warehouse_id, sku_id) ON DELETE CASCADE;

ALTER TABLE orders ADD CONSTRAINT fk_orders_retailer 
    FOREIGN KEY (retailer_id) REFERENCES retailer(retailer_id) ON DELETE RESTRICT;

ALTER TABLE orders ADD CONSTRAINT fk_orders_warehouse 
    FOREIGN KEY (shipping_warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE SET NULL;

ALTER TABLE order_item ADD CONSTRAINT fk_order_item_order 
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

ALTER TABLE order_item ADD CONSTRAINT fk_order_item_sku 
    FOREIGN KEY (sku_id) REFERENCES sku(sku_id) ON DELETE RESTRICT;

ALTER TABLE order_item ADD CONSTRAINT fk_order_item_warehouse 
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT;

ALTER TABLE payment ADD CONSTRAINT fk_payment_retailer 
    FOREIGN KEY (retailer_id) REFERENCES retailer(retailer_id) ON DELETE RESTRICT;

ALTER TABLE payment ADD CONSTRAINT fk_payment_order 
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL;

ALTER TABLE ledger_entry ADD CONSTRAINT fk_ledger_retailer 
    FOREIGN KEY (retailer_id) REFERENCES retailer(retailer_id) ON DELETE RESTRICT;
