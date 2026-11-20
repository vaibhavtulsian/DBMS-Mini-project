// ==============================================================================
// MongoDB 7 Seed Data: Master Catalog & Governance
// Database: wholesale_catalog
// ==============================================================================

const bcrypt = require('bcryptjs');

/**
 * Seeds MongoDB collections with Master Catalog documents
 * @param {import('mongodb').Db} db
 */
async function seedMongoData(db) {
  console.log('Seeding Master Catalog & Authentication records into MongoDB...');

  // 1. Seed Users
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const retailerPasswordHash = await bcrypt.hash('Retailer@12345', 10);

  const users = [
    { user_id: 'USR-ADMIN-01', email: 'admin@wholesale.com', password_hash: adminPasswordHash, role: 'DISTRIBUTOR', created_at: new Date(), updated_at: new Date() },
    { user_id: 'USR-RET-01', email: 'apex@retailer.com', password_hash: retailerPasswordHash, role: 'RETAILER', created_at: new Date(), updated_at: new Date() },
    { user_id: 'USR-RET-02', email: 'metro@retailer.com', password_hash: retailerPasswordHash, role: 'RETAILER', created_at: new Date(), updated_at: new Date() },
    { user_id: 'USR-RET-03', email: 'jaipur@retailer.com', password_hash: retailerPasswordHash, role: 'RETAILER', created_at: new Date(), updated_at: new Date() },
    { user_id: 'USR-RET-04', email: 'lucknow@retailer.com', password_hash: retailerPasswordHash, role: 'RETAILER', created_at: new Date(), updated_at: new Date() },
    { user_id: 'USR-RET-05', email: 'bengaluru@retailer.com', password_hash: retailerPasswordHash, role: 'RETAILER', created_at: new Date(), updated_at: new Date() },
  ];
  for (const u of users) {
    await db.collection('app_users').updateOne(
      { user_id: u.user_id },
      { $set: u },
      { upsert: true }
    );
  }

  // 2. Seed Brands
  const brands = [
    { brand_id: 'BRD-001', name: 'Apple', country_of_origin: 'United States', contact_email: 'enterprise@apple.com', is_active: true, created_at: new Date() },
    { brand_id: 'BRD-002', name: 'Samsung', country_of_origin: 'South Korea', contact_email: 'b2b@samsung.com', is_active: true, created_at: new Date() },
    { brand_id: 'BRD-003', name: 'Google', country_of_origin: 'United States', contact_email: 'hardware@google.com', is_active: true, created_at: new Date() },
    { brand_id: 'BRD-004', name: 'OnePlus', country_of_origin: 'China', contact_email: 'support@oneplus.com', is_active: true, created_at: new Date() },
    { brand_id: 'BRD-005', name: 'Xiaomi', country_of_origin: 'China', contact_email: 'wholesale@xiaomi.com', is_active: true, created_at: new Date() },
    { brand_id: 'BRD-006', name: 'Motorola', country_of_origin: 'United States', contact_email: 'b2b@motorola.com', is_active: true, created_at: new Date() },
  ];
  for (const b of brands) {
    await db.collection('brands').updateOne(
      { brand_id: b.brand_id },
      { $set: b },
      { upsert: true }
    );
  }

  // 3. Seed Master Products
  const products = [
    { product_id: 'PRD-001', brand_id: 'BRD-001', name: 'iPhone 15 Pro Max', category: 'Flagship Smartphone', description: 'Flagship Apple smartphone with Titanium frame, A17 Pro 3nm chip, and periscope 5x zoom lens.', base_mrp: 159900.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-002', brand_id: 'BRD-001', name: 'iPhone 15 Pro', category: 'Flagship Smartphone', description: 'Compact pro flagship with A17 Pro chip, customizable Action button, and 48MP main sensor.', base_mrp: 134900.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-003', brand_id: 'BRD-001', name: 'iPhone 15', category: 'Mainstream Smartphone', description: 'Mainstream iPhone featuring Dynamic Island, 48MP main camera, and USB-C port.', base_mrp: 79900.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-004', brand_id: 'BRD-001', name: 'iPhone 14', category: 'Mainstream Smartphone', description: 'High-reliability iPhone with A15 Bionic chip, durable Ceramic Shield, and all-day battery.', base_mrp: 69900.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-007', brand_id: 'BRD-002', name: 'Galaxy S24 Ultra', category: 'Flagship Smartphone', description: 'Premium AI powerhouse with Snapdragon 8 Gen 3, titanium armor, integrated S-Pen, and vapor chamber cooling.', base_mrp: 129999.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-008', brand_id: 'BRD-002', name: 'Galaxy S24 Plus', category: 'Flagship Smartphone', description: 'QHD+ Dynamic AMOLED 2X display with enhanced thermal management and 4900mAh battery.', base_mrp: 99999.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-009', brand_id: 'BRD-002', name: 'Galaxy S24', category: 'Flagship Smartphone', description: 'Compact flagship with Galaxy AI capabilities, 120Hz LTPO screen, and versatile triple camera.', base_mrp: 79999.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-011', brand_id: 'BRD-002', name: 'Galaxy Z Fold 5', category: 'Foldable Smartphone', description: 'Foldable tablet-phone hybrid with zero-gap hinge, multitasking multi-window interface, and S-Pen support.', base_mrp: 154999.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-015', brand_id: 'BRD-003', name: 'Pixel 8 Pro', category: 'Flagship Smartphone', description: 'Computational photography leader with Tensor G3 chip, temperature sensor, and telephoto optical zoom.', base_mrp: 106999.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-016', brand_id: 'BRD-003', name: 'Pixel 8', category: 'Mainstream Smartphone', description: 'Compact flagship with Google AI magic eraser, Best Take, and bright Actua display.', base_mrp: 75999.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-019', brand_id: 'BRD-004', name: 'OnePlus 12', category: 'Flagship Smartphone', description: 'Extreme performance phone with Snapdragon 8 Gen 3, dual vapor chamber cooling, and 100W SuperVOOC fast charging.', base_mrp: 64999.00, created_at: new Date(), updated_at: new Date() },
    { product_id: 'PRD-020', brand_id: 'BRD-004', name: 'OnePlus 12R', category: 'Upper Midrange', description: 'Performance flagship featuring massive 5500mAh battery, 120Hz ProXDR display, and gaming optimization.', base_mrp: 39999.00, created_at: new Date(), updated_at: new Date() },
  ];
  for (const p of products) {
    await db.collection('products').updateOne(
      { product_id: p.product_id },
      { $set: p },
      { upsert: true }
    );
  }

  // 4. Seed SKUs
  const skus = [
    { sku_id: 'SKU-001-A', product_id: 'PRD-001', sku_code: 'IPH15PM-256-NTIT', color: 'Natural Titanium', storage_capacity: '256GB', wholesale_price: 134000.00, barcode: '195949000101', is_active: true, created_at: new Date() },
    { sku_id: 'SKU-001-B', product_id: 'PRD-001', sku_code: 'IPH15PM-512-BLKT', color: 'Black Titanium', storage_capacity: '512GB', wholesale_price: 151000.00, barcode: '195949000102', is_active: true, created_at: new Date() },
    { sku_id: 'SKU-002-A', product_id: 'PRD-002', sku_code: 'IPH15P-128-WTIT', color: 'White Titanium', storage_capacity: '128GB', wholesale_price: 113000.00, barcode: '195949000201', is_active: true, created_at: new Date() },
    { sku_id: 'SKU-003-A', product_id: 'PRD-003', sku_code: 'IPH15-128-BLUE', color: 'Blue', storage_capacity: '128GB', wholesale_price: 67000.00, barcode: '195949000301', is_active: true, created_at: new Date() },
    { sku_id: 'SKU-007-A', product_id: 'PRD-007', sku_code: 'SGS24U-256-TGRY', color: 'Titanium Gray', storage_capacity: '256GB', wholesale_price: 109000.00, barcode: '880609500701', is_active: true, created_at: new Date() },
    { sku_id: 'SKU-007-B', product_id: 'PRD-007', sku_code: 'SGS24U-512-TBLU', color: 'Titanium Blue', storage_capacity: '512GB', wholesale_price: 119000.00, barcode: '880609500702', is_active: true, created_at: new Date() },
    { sku_id: 'SKU-015-A', product_id: 'PRD-015', sku_code: 'PIX8P-128-OBSD', color: 'Obsidian', storage_capacity: '128GB', wholesale_price: 89000.00, barcode: '842776101501', is_active: true, created_at: new Date() },
    { sku_id: 'SKU-019-A', product_id: 'PRD-019', sku_code: 'OP12-256-FGRN', color: 'Flowy Emerald', storage_capacity: '256GB', wholesale_price: 54000.00, barcode: '692181501901', is_active: true, created_at: new Date() },
  ];
  for (const s of skus) {
    await db.collection('skus').updateOne(
      { sku_id: s.sku_id },
      { $set: s },
      { upsert: true }
    );
  }

  // 5. Seed Spec Sheets
  const specs = [
    { spec_id: 'SPEC-001', product_id: 'PRD-001', spec_raw: 'Apple A17 Pro (3nm), 6-core GPU, 6.7 inch Super Retina XDR OLED 120Hz, 4441mAh battery, 5x Telephoto periscope, IP68 certified, Titanium frame with internal aluminum thermal substructure.', compliance_cert: 'BIS-IS13252, CE, FCC, RoHS', display_type: 'OLED 120Hz ProMotion', battery_mah: 4441, charging_watt: 27, processor: 'A17 Pro 3nm', ip_rating: 'IP68', created_at: new Date(), updated_at: new Date() },
    { spec_id: 'SPEC-007', product_id: 'PRD-007', spec_raw: 'Qualcomm Snapdragon 8 Gen 3 for Galaxy, 6.8 inch Dynamic AMOLED 2X, 1.9x larger vapor chamber liquid cooling system, 5000mAh battery, 45W wired charging, Titanium exterior, S-Pen included.', compliance_cert: 'BIS-IS13252, CE, FCC', display_type: 'Dynamic AMOLED 2X 120Hz', battery_mah: 5000, charging_watt: 45, processor: 'Snapdragon 8 Gen 3', ip_rating: 'IP68', created_at: new Date(), updated_at: new Date() },
    { spec_id: 'SPEC-019', product_id: 'PRD-019', spec_raw: 'Dual Cryo-velocity VC cooling system with 9140mm2 total dissipation area, Snapdragon 8 Gen 3, 5400mAh dual-cell battery, 100W SuperVOOC rapid charging, 6.82 inch 2K 120Hz LTPO display.', compliance_cert: 'BIS-IS13252, 3C', display_type: '2K LTPO 120Hz ProXDR', battery_mah: 5400, charging_watt: 100, processor: 'Snapdragon 8 Gen 3', ip_rating: 'IP65', created_at: new Date(), updated_at: new Date() },
  ];
  for (const sp of specs) {
    await db.collection('spec_sheets').updateOne(
      { spec_id: sp.spec_id },
      { $set: sp },
      { upsert: true }
    );
  }

  // 6. Seed Audit Logs
  const auditLogs = [
    { table_name: 'system', action_type: 'INSERT', record_id: 'INIT-001', action_by: 'DB_MIGRATOR', details: { status: 'Master catalog seeded successfully in MongoDB 7' }, timestamp: new Date() },
    { table_name: 'brand', action_type: 'INSERT', record_id: 'BRD-001', action_by: 'ADMIN', details: { name: 'Apple', status: 'ACTIVE' }, timestamp: new Date() },
    { table_name: 'product', action_type: 'INSERT', record_id: 'PRD-001', action_by: 'ADMIN', details: { name: 'iPhone 15 Pro Max', mrp: 159900.00 }, timestamp: new Date() },
  ];
  await db.collection('audit_logs').insertMany(auditLogs);

  console.log('✅ MongoDB master catalog and audit logs populated successfully.');
}

module.exports = { seedMongoData };
