-- ==============================================================================
-- MySQL 8.0 Schema: Master Catalog & Identity Store
-- Database: wholesale_catalog
-- Engine: InnoDB with utf8mb4 encoding
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS wholesale_catalog
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE wholesale_catalog;

-- 1. Drop existing tables cleanly
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS review;
DROP TABLE IF EXISTS spec_sheet;
DROP TABLE IF EXISTS sku;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS brand;
DROP TABLE IF EXISTS app_user;

-- 2. User Authentication & Roles Table
CREATE TABLE app_user (
    user_id VARCHAR(30) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('DISTRIBUTOR', 'RETAILER') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Brand Entity Table
CREATE TABLE brand (
    brand_id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    country_of_origin VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_brand_name (name)
) ENGINE=InnoDB;

-- 4. Product Catalog Table
CREATE TABLE product (
    product_id VARCHAR(30) PRIMARY KEY,
    brand_id VARCHAR(30) NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    base_mrp DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mysql_product_brand FOREIGN KEY (brand_id) REFERENCES brand(brand_id) ON DELETE RESTRICT,
    INDEX idx_product_category (category),
    FULLTEXT INDEX idx_product_fulltext (name, description, category)
) ENGINE=InnoDB;

-- 5. SKU Variants Table
CREATE TABLE sku (
    sku_id VARCHAR(30) PRIMARY KEY,
    product_id VARCHAR(30) NOT NULL,
    sku_code VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(30),
    storage_capacity VARCHAR(20),
    wholesale_price DECIMAL(12, 2) NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mysql_sku_product FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    INDEX idx_sku_product (product_id),
    INDEX idx_sku_price (wholesale_price)
) ENGINE=InnoDB;

-- 6. Technical Spec Sheets Table
CREATE TABLE spec_sheet (
    spec_id VARCHAR(30) PRIMARY KEY,
    product_id VARCHAR(30) NOT NULL UNIQUE,
    spec_raw LONGTEXT NOT NULL,
    compliance_cert VARCHAR(100),
    display_type VARCHAR(50),
    battery_mah INT,
    charging_watt INT,
    processor VARCHAR(100),
    ip_rating VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mysql_spec_product FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    FULLTEXT INDEX idx_spec_fulltext (spec_raw)
) ENGINE=InnoDB;

-- 7. Product Customer Reviews Table
CREATE TABLE review (
    review_id VARCHAR(30) PRIMARY KEY,
    product_id VARCHAR(30) NOT NULL,
    retailer_id VARCHAR(30) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE') NOT NULL DEFAULT 'POSITIVE',
    region VARCHAR(50) DEFAULT 'National',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mysql_review_product FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    INDEX idx_review_product (product_id),
    INDEX idx_review_rating (rating),
    FULLTEXT INDEX idx_review_fulltext (review_text)
) ENGINE=InnoDB;

-- 8. Enterprise Audit Log Table (Tracking Catalog Operations)
CREATE TABLE audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    action_by VARCHAR(50) DEFAULT 'SYSTEM',
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB;

-- 9. MySQL Trigger: Auto-audit catalog updates on product changes
DELIMITER $$
CREATE TRIGGER trg_product_audit_update
AFTER UPDATE ON product
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action_type, record_id, action_by, details)
    VALUES (
        'product',
        'UPDATE',
        NEW.product_id,
        'SYSTEM',
        JSON_OBJECT('name', NEW.name, 'old_price', OLD.base_mrp, 'new_price', NEW.base_mrp)
    );
END$$
DELIMITER ;
