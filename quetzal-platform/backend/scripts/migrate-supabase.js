// Apply migrations to Supabase remote database
// Usage: node scripts/migrate-supabase.js

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SUPABASE_URL = 'postgresql://postgres.sgttyuuvuakaybzrzwdx:gnLnouburQFx48p0@aws-1-sa-east-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ 
    connectionString: SUPABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase PostgreSQL');

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = [
      '001_base_schema.sql',
      '002_create_transactions_table.sql',
      '003_create_contracts_table.sql',
      '004_create_messaging_tables.sql'
    ];

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      console.log(`\n➡️ Aplicando migración: ${file}`);
      
      const sql = fs.readFileSync(fullPath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Migración aplicada: ${file}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⚠️ ${file} ya aplicada (tabla/función existe)`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n🎉 Todas las migraciones procesadas');

    // Verificar tablas creadas
    console.log('\n📊 Verificando tablas creadas:');
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('Transactions', 'Contracts', 'Conversations', 'Messages')
      ORDER BY table_name;
    `);
    
    if (checkTables.rows.length > 0) {
      checkTables.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    } else {
      console.log('  ⚠️ No se encontraron las tablas esperadas');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
