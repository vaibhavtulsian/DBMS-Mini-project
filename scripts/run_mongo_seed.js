const { MongoClient } = require('mongodb');
const { applySchemaAndIndexes } = require('../db/mongodb/01_schema_indexes');
const { seedMongoData } = require('../db/mongodb/02_seed');

async function runMongoSetup() {
  console.log('================================================================');
  console.log('🍃 Running MongoDB 7 Setup (Schema, Indexes & Master Catalog Seed)');
  console.log('================================================================');

  const uri = process.env.MONGO_URI || 'mongodb://mongo:mongo@localhost:27017';
  const dbName = process.env.MONGO_DATABASE || 'wholesale_catalog';

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB server.');

    const db = client.db(dbName);

    // 1. Apply Schema Validation & Indexes (from db/mongodb/01_schema_indexes.js)
    await applySchemaAndIndexes(db);

    // 2. Seed Master Catalog Data (from db/mongodb/02_seed.js)
    await seedMongoData(db);

    console.log('🎉 MongoDB 7 setup completed successfully.');
  } catch (err) {
    console.error('❌ MongoDB setup failed:', err.message);
    throw err;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  runMongoSetup().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runMongoSetup };
