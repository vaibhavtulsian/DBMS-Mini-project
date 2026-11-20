// ==============================================================================
// MongoDB 7 Schema & Indexes: Master Catalog & Identity Store
// Database: wholesale_catalog
// Compatible with mongosh and Node.js MongoDB driver
// ==============================================================================

/**
 * Creates collections with JSON Schema Validation and Indexes
 * @param {import('mongodb').Db} db
 */
async function applySchemaAndIndexes(db) {
  console.log('Applying MongoDB schema validators and indexes...');

  // 1. Drop existing collections cleanly
  const existingCollections = await db.listCollections().toArray();
  const collNames = existingCollections.map(c => c.name);
  for (const name of ['audit_logs', 'reviews', 'spec_sheets', 'skus', 'products', 'brands', 'app_users']) {
    if (collNames.includes(name)) {
      await db.dropCollection(name);
    }
  }

  // 2. Collection: app_users (with JSON Schema Validation)
  await db.createCollection('app_users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'email', 'password_hash', 'role'],
        properties: {
          user_id: { bsonType: 'string', description: 'Unique user identifier' },
          email: { bsonType: 'string', pattern: '^.+@.+$', description: 'User email' },
          password_hash: { bsonType: 'string', description: 'Bcrypt hashed password' },
          role: { enum: ['DISTRIBUTOR', 'RETAILER'], description: 'RBAC role' },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  });
  await db.collection('app_users').createIndex({ email: 1 }, { unique: true });
  await db.collection('app_users').createIndex({ user_id: 1 }, { unique: true });

  // 3. Collection: brands
  await db.createCollection('brands', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['brand_id', 'name'],
        properties: {
          brand_id: { bsonType: 'string' },
          name: { bsonType: 'string' },
          country_of_origin: { bsonType: 'string' },
          contact_email: { bsonType: 'string' },
          is_active: { bsonType: 'bool' },
          created_at: { bsonType: 'date' }
        }
      }
    }
  });
  await db.collection('brands').createIndex({ brand_id: 1 }, { unique: true });
  await db.collection('brands').createIndex({ name: 1 }, { unique: true });

  // 4. Collection: products
  await db.createCollection('products', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['product_id', 'brand_id', 'name', 'category', 'base_mrp'],
        properties: {
          product_id: { bsonType: 'string' },
          brand_id: { bsonType: 'string' },
          name: { bsonType: 'string' },
          category: { bsonType: 'string' },
          description: { bsonType: 'string' },
          base_mrp: { bsonType: ['double', 'int', 'long', 'decimal'] },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  });
  await db.collection('products').createIndex({ product_id: 1 }, { unique: true });
  await db.collection('products').createIndex({ brand_id: 1 });
  await db.collection('products').createIndex({ category: 1 });
  await db.collection('products').createIndex({ name: 'text', description: 'text', category: 'text' });

  // 5. Collection: skus
  await db.createCollection('skus', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['sku_id', 'product_id', 'sku_code', 'wholesale_price'],
        properties: {
          sku_id: { bsonType: 'string' },
          product_id: { bsonType: 'string' },
          sku_code: { bsonType: 'string' },
          color: { bsonType: 'string' },
          storage_capacity: { bsonType: 'string' },
          wholesale_price: { bsonType: ['double', 'int', 'long', 'decimal'] },
          barcode: { bsonType: 'string' },
          is_active: { bsonType: 'bool' },
          created_at: { bsonType: 'date' }
        }
      }
    }
  });
  await db.collection('skus').createIndex({ sku_id: 1 }, { unique: true });
  await db.collection('skus').createIndex({ sku_code: 1 }, { unique: true });
  await db.collection('skus').createIndex({ product_id: 1 });
  await db.collection('skus').createIndex({ wholesale_price: 1 });

  // 6. Collection: spec_sheets
  await db.createCollection('spec_sheets');
  await db.collection('spec_sheets').createIndex({ spec_id: 1 }, { unique: true });
  await db.collection('spec_sheets').createIndex({ product_id: 1 }, { unique: true });
  await db.collection('spec_sheets').createIndex({ spec_raw: 'text' });

  // 7. Collection: reviews
  await db.createCollection('reviews');
  await db.collection('reviews').createIndex({ review_id: 1 }, { unique: true });
  await db.collection('reviews').createIndex({ product_id: 1 });
  await db.collection('reviews').createIndex({ rating: 1 });
  await db.collection('reviews').createIndex({ review_text: 'text' });

  // 8. Collection: audit_logs
  await db.createCollection('audit_logs');
  await db.collection('audit_logs').createIndex({ table_name: 1 });
  await db.collection('audit_logs').createIndex({ timestamp: -1 });

  console.log('✅ Schema validation and indexes applied.');
}

module.exports = { applySchemaAndIndexes };
