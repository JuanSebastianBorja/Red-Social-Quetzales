// Apply COMPLETE base schema to Supabase from script base de datos.md
// This creates all tables and then applies the additional migrations
// Usage: node scripts/setup-supabase-full.js

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
    console.log('✅ Conectado a Supabase PostgreSQL\n');

    // 1. Apply base schema from markdown
    console.log('📦 Aplicando schema base completo...');
    const baseSchemaPath = path.join(__dirname, '..', '..', '..', 'script base de datos.md');
    let baseSchema = fs.readFileSync(baseSchemaPath, 'utf8');
    
    // Remove markdown code fences
    baseSchema = baseSchema.replace(/```markdown/g, '').replace(/```/g, '').trim();
    
    // Skip database-specific commands that won't work in Supabase
    baseSchema = baseSchema.replace(/\\c quetzal_db;/g, '');
    baseSchema = baseSchema.replace(/COMMENT ON DATABASE.*?;/g, '');
    
    try {
      await client.query(baseSchema);
      console.log('✅ Schema base aplicado correctamente\n');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⚠️ Schema base ya existe (tablas creadas previamente)\n');
      } else {
        throw err;
      }
    }

    // 2. Apply additional migrations
    console.log('📦 Aplicando migraciones adicionales...\n');
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = [
      '002_create_transactions_table.sql',
      '003_create_contracts_table.sql',
      '004_create_messaging_tables.sql'
    ];

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️ Archivo no encontrado: ${file}, saltando...`);
        continue;
      }
      
      console.log(`➡️ Aplicando: ${file}`);
      const sql = fs.readFileSync(fullPath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ ${file} aplicada\n`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⚠️ ${file} ya aplicada (objetos existen)\n`);
        } else {
          console.error(`❌ Error en ${file}:`, err.message);
          throw err;
        }
      }
    }

    // 3. Verify tables
    console.log('📊 Verificando tablas creadas:\n');
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`Total de tablas: ${checkTables.rows.length}\n`);
    checkTables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // 4. Check critical tables
    console.log('\n🔍 Verificando tablas críticas:');
    const criticalTables = ['users', 'services', 'wallets', 'Transactions', 'Contracts', 'Conversations', 'Messages'];
    for (const table of criticalTables) {
      const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${result.rows[0].count} registros`);
    }

    console.log('\n🎉 Setup de Supabase completado exitosamente!');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
