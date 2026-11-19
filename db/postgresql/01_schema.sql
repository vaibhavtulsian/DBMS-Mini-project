-- ============================================================================
-- 01_schema.sql: Core Relational Table Definitions (14 Tables)
-- PRD Section 7.1 & 8.1: Tables created with Primary Keys & Base Attributes
-- ============================================================================

-- Table 1: users (Authentication and System Accounts)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: retailer (Retailer Business Profile)
CREATE TABLE retailer (
    retailer_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    gstin VARCHAR(15) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: brand (Manufacturer / Brands)
CREATE TABLE brand (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    country_of_origin VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: product (Phone Models)
CREATE TABLE product (
    product_id SERIAL PRIMARY KEY,
    brand_id INT NOT NULL,
    model_name VARCHAR(150) NOT NULL,
    release_year INT NOT NULL,
    base_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: sku (Stock Keeping Units - Variants & Pricing)
CREATE TABLE sku (
    sku_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    sku_code VARCHAR(100) NOT NULL,
    ram_gb INT NOT NULL,
    storage_gb INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    wholesale_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- Note: is_active added in 02_alter_constraints.sql as per PRD Section 8.1
);

-- Table 6: spec_sheet (Structured & Free-Text Hardware Specifications)
CREATE TABLE spec_sheet (
    spec_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    spec_text TEXT NOT NULL,
    display_specs TEXT,
    camera_specs TEXT,
    chipset_specs TEXT,
    battery_specs TEXT,
    thermal_specs TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 7: review (Retailer Feedback & Experience)
CREATE TABLE review (
    review_id SERIAL PRIMARY KEY,
    retailer_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL,
    review_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: warehouse (Distribution Centers)
CREATE TABLE warehouse (
    warehouse_id SERIAL PRIMARY KEY,
    warehouse_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table 9: inventory (Stock Levels per Warehouse and SKU)
CREATE TABLE inventory (
    warehouse_id INT NOT NULL,
    sku_id INT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_threshold INT NOT NULL DEFAULT 15,
    last_restocked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (warehouse_id, sku_id)
);

-- Table 10: low_stock_alert (Trigger-Generated Operational Alerts)
CREATE TABLE low_stock_alert (
    alert_id SERIAL PRIMARY KEY,
    warehouse_id INT NOT NULL,
    sku_id INT NOT NULL,
    threshold_value INT NOT NULL,
    current_quantity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

-- Table 11: orders (Order Header)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    retailer_id INT NOT NULL,
    order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PLACED',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    shipping_warehouse_id INT,
    notes TEXT
);

-- Table 12: order_item (Order Line Items - Weak Entity)
CREATE TABLE order_item (
    order_id INT NOT NULL,
    line_no INT NOT NULL,
    sku_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    PRIMARY KEY (order_id, line_no)
);

-- Table 13: payment (Payments Received against Orders)
CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    retailer_id INT NOT NULL,
    order_id INT,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Table 14: ledger_entry (Append-Only Financial Journal)
CREATE TABLE ledger_entry (
    ledger_id SERIAL PRIMARY KEY,
    retailer_id INT NOT NULL,
    entry_type VARCHAR(10) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id INT,
    notes TEXT,
    entry_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
