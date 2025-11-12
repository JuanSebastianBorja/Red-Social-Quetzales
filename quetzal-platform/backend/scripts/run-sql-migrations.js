// Run raw .sql migrations using pg directly when psql CLI is unavailable
// Usage: DATABASE_URL=... node scripts/run-sql-migrations.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no definido. Agrega al .env antes de ejecutar.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
  await client.connect();
  console.log('✅ Conectado a PostgreSQL');

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = [
    '002_create_transactions_table.sql',
    '003_create_contracts_table.sql',
    '004_create_messaging_tables.sql'
  ];

  try {
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      console.log(`➡️ Ejecutando migración: ${file}`);
      const sql = fs.readFileSync(fullPath, 'utf8');
      await client.query(sql);
      console.log(`✅ Migración aplicada: ${file}`);
    }
    console.log('🎉 Todas las migraciones aplicadas correctamente');
  } catch (err) {
    console.error('❌ Error aplicando migraciones:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();