-- ==============================================================================
-- MySQL 8.0 Seed Data: Master Catalog & Governance
-- Database: wholesale_catalog
-- ==============================================================================

USE wholesale_catalog;

-- 1. Seed Users
INSERT INTO app_user (user_id, email, password_hash, role) VALUES 
('USR-ADMIN-01', 'admin@wholesale.com', '$2a$10$wT8B1J85m/z2fR2Pz2y5e.Kx9mYv5d.8c6e3d2a1b0c9f8e7d6c5b', 'DISTRIBUTOR'),
('USR-RET-01', 'apex@retailer.com', '$2a$10$wT8B1J85m/z2fR2Pz2y5e.Kx9mYv5d.8c6e3d2a1b0c9f8e7d6c5b', 'RETAILER'),
('USR-RET-02', 'metro@retailer.com', '$2a$10$wT8B1J85m/z2fR2Pz2y5e.Kx9mYv5d.8c6e3d2a1b0c9f8e7d6c5b', 'RETAILER'),
('USR-RET-03', 'jaipur@retailer.com', '$2a$10$wT8B1J85m/z2fR2Pz2y5e.Kx9mYv5d.8c6e3d2a1b0c9f8e7d6c5b', 'RETAILER'),
('USR-RET-04', 'lucknow@retailer.com', '$2a$10$wT8B1J85m/z2fR2Pz2y5e.Kx9mYv5d.8c6e3d2a1b0c9f8e7d6c5b', 'RETAILER'),
('USR-RET-05', 'bengaluru@retailer.com', '$2a$10$wT8B1J85m/z2fR2Pz2y5e.Kx9mYv5d.8c6e3d2a1b0c9f8e7d6c5b', 'RETAILER')
ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);

-- 2. Seed Brands
INSERT INTO brand (brand_id, name, country_of_origin, contact_email, is_active) VALUES
('BRD-001', 'Apple', 'United States', 'enterprise@apple.com', true),
('BRD-002', 'Samsung', 'South Korea', 'b2b@samsung.com', true),
('BRD-003', 'Google', 'United States', 'hardware@google.com', true),
('BRD-004', 'OnePlus', 'China', 'support@oneplus.com', true),
('BRD-005', 'Xiaomi', 'China', 'wholesale@xiaomi.com', true),
('BRD-006', 'Motorola', 'United States', 'b2b@motorola.com', true)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Seed Master Products
INSERT INTO product (product_id, brand_id, name, category, description, base_mrp) VALUES
('PRD-001', 'BRD-001', 'iPhone 15 Pro Max', 'Flagship Smartphone', 'Flagship Apple smartphone with Titanium frame, A17 Pro 3nm chip, and periscope 5x zoom lens.', 159900.00),
('PRD-002', 'BRD-001', 'iPhone 15 Pro', 'Flagship Smartphone', 'Compact pro flagship with A17 Pro chip, customizable Action button, and 48MP main sensor.', 134900.00),
('PRD-003', 'BRD-001', 'iPhone 15', 'Mainstream Smartphone', 'Mainstream iPhone featuring Dynamic Island, 48MP main camera, and USB-C port.', 79900.00),
('PRD-004', 'BRD-001', 'iPhone 14', 'Mainstream Smartphone', 'High-reliability iPhone with A15 Bionic chip, durable Ceramic Shield, and all-day battery.', 69900.00),
('PRD-007', 'BRD-002', 'Galaxy S24 Ultra', 'Flagship Smartphone', 'Premium AI powerhouse with Snapdragon 8 Gen 3, titanium armor, integrated S-Pen, and vapor chamber cooling.', 129999.00),
('PRD-008', 'BRD-002', 'Galaxy S24 Plus', 'Flagship Smartphone', 'QHD+ Dynamic AMOLED 2X display with enhanced thermal management and 4900mAh battery.', 99999.00),
('PRD-009', 'BRD-002', 'Galaxy S24', 'Flagship Smartphone', 'Compact flagship with Galaxy AI capabilities, 120Hz LTPO screen, and versatile triple camera.', 79999.00),
('PRD-011', 'BRD-002', 'Galaxy Z Fold 5', 'Foldable Smartphone', 'Foldable tablet-phone hybrid with zero-gap hinge, multitasking multi-window interface, and S-Pen support.', 154999.00),
('PRD-015', 'BRD-003', 'Pixel 8 Pro', 'Flagship Smartphone', 'Computational photography leader with Tensor G3 chip, temperature sensor, and telephoto optical zoom.', 106999.00),
('PRD-016', 'BRD-003', 'Pixel 8', 'Mainstream Smartphone', 'Compact flagship with Google AI magic eraser, Best Take, and bright Actua display.', 75999.00),
('PRD-019', 'BRD-004', 'OnePlus 12', 'Flagship Smartphone', 'Extreme performance phone with Snapdragon 8 Gen 3, dual vapor chamber cooling, and 100W SuperVOOC fast charging.', 64999.00),
('PRD-020', 'BRD-004', 'OnePlus 12R', 'Upper Midrange', 'Performance flagship featuring massive 5500mAh battery, 120Hz ProXDR display, and gaming optimization.', 39999.00)
ON DUPLICATE KEY UPDATE name=VALUES(name), base_mrp=VALUES(base_mrp);

-- 4. Seed SKUs
INSERT INTO sku (sku_id, product_id, sku_code, color, storage_capacity, wholesale_price, barcode, is_active) VALUES
('SKU-001-A', 'PRD-001', 'IPH15PM-256-NTIT', 'Natural Titanium', '256GB', 134000.00, '195949000101', true),
('SKU-001-B', 'PRD-001', 'IPH15PM-512-BLKT', 'Black Titanium', '512GB', 151000.00, '195949000102', true),
('SKU-002-A', 'PRD-002', 'IPH15P-128-WTIT', 'White Titanium', '128GB', 113000.00, '195949000201', true),
('SKU-003-A', 'PRD-003', 'IPH15-128-BLUE', 'Blue', '128GB', 67000.00, '195949000301', true),
('SKU-007-A', 'PRD-007', 'SGS24U-256-TGRY', 'Titanium Gray', '256GB', 109000.00, '880609500701', true),
('SKU-007-B', 'PRD-007', 'SGS24U-512-TBLU', 'Titanium Blue', '512GB', 119000.00, '880609500702', true),
('SKU-015-A', 'PRD-015', 'PIX8P-128-OBSD', 'Obsidian', '128GB', 89000.00, '842776101501', true),
('SKU-019-A', 'PRD-019', 'OP12-256-FGRN', 'Flowy Emerald', '256GB', 54000.00, '692181501901', true)
ON DUPLICATE KEY UPDATE wholesale_price=VALUES(wholesale_price);

-- 5. Seed Spec Sheets
INSERT INTO spec_sheet (spec_id, product_id, spec_raw, compliance_cert, display_type, battery_mah, charging_watt, processor, ip_rating) VALUES
('SPEC-001', 'PRD-001', 'Apple A17 Pro (3nm), 6-core GPU, 6.7 inch Super Retina XDR OLED 120Hz, 4441mAh battery, 5x Telephoto periscope, IP68 certified, Titanium frame with internal aluminum thermal substructure.', 'BIS-IS13252, CE, FCC, RoHS', 'OLED 120Hz ProMotion', 4441, 27, 'A17 Pro 3nm', 'IP68'),
('SPEC-007', 'PRD-007', 'Qualcomm Snapdragon 8 Gen 3 for Galaxy, 6.8 inch Dynamic AMOLED 2X, 1.9x larger vapor chamber liquid cooling system, 5000mAh battery, 45W wired charging, Titanium exterior, S-Pen included.', 'BIS-IS13252, CE, FCC', 'Dynamic AMOLED 2X 120Hz', 5000, 45, 'Snapdragon 8 Gen 3', 'IP68'),
('SPEC-019', 'PRD-019', 'Dual Cryo-velocity VC cooling system with 9140mm2 total dissipation area, Snapdragon 8 Gen 3, 5400mAh dual-cell battery, 100W SuperVOOC rapid charging, 6.82 inch 2K 120Hz LTPO display.', 'BIS-IS13252, 3C', '2K LTPO 120Hz ProXDR', 5400, 100, 'Snapdragon 8 Gen 3', 'IP65')
ON DUPLICATE KEY UPDATE spec_raw=VALUES(spec_raw);

-- 6. Seed Audit Logs
INSERT INTO audit_log (table_name, action_type, record_id, action_by, details) VALUES
('system', 'INSERT', 'INIT-001', 'DB_MIGRATOR', JSON_OBJECT('status', 'Master catalog seeded successfully in MySQL 8.0')),
('brand', 'INSERT', 'BRD-001', 'ADMIN', JSON_OBJECT('name', 'Apple', 'status', 'ACTIVE')),
('product', 'INSERT', 'PRD-001', 'ADMIN', JSON_OBJECT('name', 'iPhone 15 Pro Max', 'mrp', 159900.00));
