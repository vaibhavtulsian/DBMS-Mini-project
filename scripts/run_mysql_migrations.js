const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function runMysqlMigrations() {
  console.log('================================================================');
  console.log('🐬 Running MySQL 8.0 Migrations & Master Catalog Seeding');
  console.log('================================================================');

  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    multipleStatements: true,
  };

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL server.');

    // 1. Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS wholesale_catalog DEFAULT CHARACTER SET utf8mb4;');
    await connection.query('USE wholesale_catalog;');

    // 2. Read and execute 01_schema.sql
    const schemaPath = path.join(__dirname, '../db/mysql/01_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split statements by semicolon where appropriate or execute blocks
    // In mysql2, multipleStatements: true allows running the entire script!
    console.log('Executing MySQL DDL schema and trigger...');
    // Strip delimiter commands for mysql2 driver compatibility
    const cleanedSql = schemaSql
      .replace(/DELIMITER \$\$/g, '')
      .replace(/DELIMITER ;/g, '')
      .replace(/\$\$/g, ';');

    await connection.query(cleanedSql);
    console.log('✅ MySQL schema & audit triggers created successfully.');

    // 3. Seed data into MySQL (Brands, Products, SKUs, Specs, Reviews, Users)
    console.log('Seeding Master Catalog & Authentication records into MySQL...');
    
    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
    const retailerPasswordHash = await bcrypt.hash('Retailer@12345', 10);

    // Users
    await connection.query(
      `INSERT INTO app_user (user_id, email, password_hash, role) VALUES 
       ('USR-ADMIN-01', 'admin@wholesale.com', ?, 'DISTRIBUTOR'),
       ('USR-RET-01', 'apex@retailer.com', ?, 'RETAILER'),
       ('USR-RET-02', 'metro@retailer.com', ?, 'RETAILER'),
       ('USR-RET-03', 'jaipur@retailer.com', ?, 'RETAILER'),
       ('USR-RET-04', 'lucknow@retailer.com', ?, 'RETAILER'),
       ('USR-RET-05', 'bengaluru@retailer.com', ?, 'RETAILER')
       ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);`,
      [adminPasswordHash, retailerPasswordHash, retailerPasswordHash, retailerPasswordHash, retailerPasswordHash, retailerPasswordHash]
    );

    // Brands
    const brands = [
      ['BRD-001', 'Apple', 'United States', 'enterprise@apple.com', true],
      ['BRD-002', 'Samsung', 'South Korea', 'b2b@samsung.com', true],
      ['BRD-003', 'Google', 'United States', 'hardware@google.com', true],
      ['BRD-004', 'OnePlus', 'China', 'support@oneplus.com', true],
      ['BRD-005', 'Xiaomi', 'China', 'wholesale@xiaomi.com', true],
      ['BRD-006', 'Motorola', 'United States', 'b2b@motorola.com', true]
    ];
    for (const b of brands) {
      await connection.query(
        `INSERT INTO brand (brand_id, name, country_of_origin, contact_email, is_active) 
         VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name);`,
        b
      );
    }

    // Products
    const products = [
      ['PRD-001', 'BRD-001', 'iPhone 15 Pro Max', 'Flagship Smartphone', 'Flagship Apple smartphone with Titanium frame, A17 Pro 3nm chip, and periscope 5x zoom lens.', 159900.00],
      ['PRD-002', 'BRD-001', 'iPhone 15 Pro', 'Flagship Smartphone', 'Compact pro flagship with A17 Pro chip, customizable Action button, and 48MP main sensor.', 134900.00],
      ['PRD-003', 'BRD-001', 'iPhone 15', 'Mainstream Smartphone', 'Mainstream iPhone featuring Dynamic Island, 48MP main camera, and USB-C port.', 79900.00],
      ['PRD-004', 'BRD-001', 'iPhone 14', 'Mainstream Smartphone', 'High-reliability iPhone with A15 Bionic chip, durable Ceramic Shield, and all-day battery.', 69900.00],
      ['PRD-007', 'BRD-002', 'Galaxy S24 Ultra', 'Flagship Smartphone', 'Premium AI powerhouse with Snapdragon 8 Gen 3, titanium armor, integrated S-Pen, and vapor chamber cooling.', 129999.00],
      ['PRD-008', 'BRD-002', 'Galaxy S24 Plus', 'Flagship Smartphone', 'QHD+ Dynamic AMOLED 2X display with enhanced thermal management and 4900mAh battery.', 99999.00],
      ['PRD-009', 'BRD-002', 'Galaxy S24', 'Flagship Smartphone', 'Compact flagship with Galaxy AI capabilities, 120Hz LTPO screen, and versatile triple camera.', 79999.00],
      ['PRD-011', 'BRD-002', 'Galaxy Z Fold 5', 'Foldable Smartphone', 'Foldable tablet-phone hybrid with zero-gap hinge, multitasking multi-window interface, and S-Pen support.', 154999.00],
      ['PRD-015', 'BRD-003', 'Pixel 8 Pro', 'Flagship Smartphone', 'Computational photography leader with Tensor G3 chip, temperature sensor, and telephoto optical zoom.', 106999.00],
      ['PRD-016', 'BRD-003', 'Pixel 8', 'Mainstream Smartphone', 'Compact flagship with Google AI magic eraser, Best Take, and bright Actua display.', 75999.00],
      ['PRD-019', 'BRD-004', 'OnePlus 12', 'Flagship Smartphone', 'Extreme performance phone with Snapdragon 8 Gen 3, dual vapor chamber cooling, and 100W SuperVOOC fast charging.', 64999.00],
      ['PRD-020', 'BRD-004', 'OnePlus 12R', 'Upper Midrange', 'Performance flagship featuring massive 5500mAh battery, 120Hz ProXDR display, and gaming optimization.', 39999.00]
    ];
    for (const p of products) {
      await connection.query(
        `INSERT INTO product (product_id, brand_id, name, category, description, base_mrp)
         VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), base_mrp=VALUES(base_mrp);`,
        p
      );
    }

    // SKUs
    const skus = [
      ['SKU-001-A', 'PRD-001', 'IPH15PM-256-NTIT', 'Natural Titanium', '256GB', 134000.00, '195949000101', true],
      ['SKU-001-B', 'PRD-001', 'IPH15PM-512-BLKT', 'Black Titanium', '512GB', 151000.00, '195949000102', true],
      ['SKU-002-A', 'PRD-002', 'IPH15P-128-WTIT', 'White Titanium', '128GB', 113000.00, '195949000201', true],
      ['SKU-003-A', 'PRD-003', 'IPH15-128-BLUE', 'Blue', '128GB', 67000.00, '195949000301', true],
      ['SKU-007-A', 'PRD-007', 'SGS24U-256-TGRY', 'Titanium Gray', '256GB', 109000.00, '880609500701', true],
      ['SKU-007-B', 'PRD-007', 'SGS24U-512-TBLU', 'Titanium Blue', '512GB', 119000.00, '880609500702', true],
      ['SKU-015-A', 'PRD-015', 'PIX8P-128-OBSD', 'Obsidian', '128GB', 89000.00, '842776101501', true],
      ['SKU-019-A', 'PRD-019', 'OP12-256-FGRN', 'Flowy Emerald', '256GB', 54000.00, '692181501901', true]
    ];
    for (const s of skus) {
      await connection.query(
        `INSERT INTO sku (sku_id, product_id, sku_code, color, storage_capacity, wholesale_price, barcode, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE wholesale_price=VALUES(wholesale_price);`,
        s
      );
    }

    // Spec sheets
    const specs = [
      ['SPEC-001', 'PRD-001', 'Apple A17 Pro (3nm), 6-core GPU, 6.7 inch Super Retina XDR OLED 120Hz, 4441mAh battery, 5x Telephoto periscope, IP68 certified, Titanium frame with internal aluminum thermal substructure.', 'BIS-IS13252, CE, FCC, RoHS', 'OLED 120Hz ProMotion', 4441, 27, 'A17 Pro 3nm', 'IP68'],
      ['SPEC-007', 'PRD-007', 'Qualcomm Snapdragon 8 Gen 3 for Galaxy, 6.8 inch Dynamic AMOLED 2X, 1.9x larger vapor chamber liquid cooling system, 5000mAh battery, 45W wired charging, Titanium exterior, S-Pen included.', 'BIS-IS13252, CE, FCC', 'Dynamic AMOLED 2X 120Hz', 5000, 45, 'Snapdragon 8 Gen 3', 'IP68'],
      ['SPEC-019', 'PRD-019', 'Dual Cryo-velocity VC cooling system with 9140mm2 total dissipation area, Snapdragon 8 Gen 3, 5400mAh dual-cell battery, 100W SuperVOOC rapid charging, 6.82 inch 2K 120Hz LTPO display.', 'BIS-IS13252, 3C', '2K LTPO 120Hz ProXDR', 5400, 100, 'Snapdragon 8 Gen 3', 'IP65']
    ];
    for (const sp of specs) {
      await connection.query(
        `INSERT INTO spec_sheet (spec_id, product_id, spec_raw, compliance_cert, display_type, battery_mah, charging_watt, processor, ip_rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE spec_raw=VALUES(spec_raw);`,
        sp
      );
    }

    // Audit Log seed
    await connection.query(`
      INSERT INTO audit_log (table_name, action_type, record_id, action_by, details) VALUES
      ('system', 'INSERT', 'INIT-001', 'DB_MIGRATOR', JSON_OBJECT('status', 'Master catalog seeded successfully in MySQL 8.0')),
      ('brand', 'INSERT', 'BRD-001', 'ADMIN', JSON_OBJECT('name', 'Apple', 'status', 'ACTIVE')),
      ('product', 'INSERT', 'PRD-001', 'ADMIN', JSON_OBJECT('name', 'iPhone 15 Pro Max', 'mrp', 159900.00));
    `);

    console.log('✅ MySQL master catalog and audit logs populated successfully.');
  } catch (err) {
    console.error('❌ MySQL migration failed:', err.message);
    throw err;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  runMysqlMigrations().then(() => {
    console.log('🎉 Done.');
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runMysqlMigrations };
