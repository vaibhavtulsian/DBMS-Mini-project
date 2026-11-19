const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wholesale_db';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

const migrationFiles = [
  '00_reset.sql',
  '01_schema.sql',
  '02_alter_constraints.sql',
  '03_indexes.sql',
  '04_views.sql',
  '05_functions_triggers.sql',
  '06_vector.sql',
];

async function runMigrations() {
  console.log('================================================================');
  console.log('🔄 B2B Wholesale Distribution: Running Database DDL Migrations');
  console.log(`Connecting to: ${connectionString.replace(/:[^:]*@/, ':****@')}`);
  console.log('================================================================');

  const client = await pool.connect();
  try {
    for (const file of migrationFiles) {
      let filePath = path.join(__dirname, '..', 'db', 'postgresql', file);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, '..', 'db', file);
      }
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        process.exit(1);
      }

      console.log(`\n▶️ Executing [${file}]...`);
      const sql = fs.readFileSync(filePath, 'utf8');

      const start = Date.now();
      await client.query(sql);
      const duration = Date.now() - start;

      console.log(`✅ [${file}] completed successfully in ${duration}ms`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 7 DDL MIGRATION SCRIPTS COMPLETED SUCCESSFULLY!');
    console.log('All 14 tables, constraints, indexes, views, triggers & vectors ready.');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Migration failed with error:\n', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.where) console.error('Where:', err.where);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
