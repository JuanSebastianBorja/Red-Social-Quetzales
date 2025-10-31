const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Conectamos primero a la DB por defecto
});

async function setupDatabase() {
    try {
        console.log('Conectando a PostgreSQL...');
        await client.connect();

        // Verificar si la base de datos existe
        const dbExists = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'quetzal_db'"
        );

        if (dbExists.rows.length === 0) {
            console.log('Creando base de datos quetzal_db...');
            await client.query('CREATE DATABASE quetzal_db WITH ENCODING = \'UTF8\' TEMPLATE template0;');
            console.log('✅ Base de datos creada');
        } else {
            console.log('✅ La base de datos ya existe');
        }

        // Desconectamos para reconectar a la nueva base de datos
        await client.end();

        // Conectar a quetzal_db
        const dbClient = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'quetzal_db'
        });

        await dbClient.connect();

        // Crear extensiones
        console.log('Creando extensiones...');
        await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        await dbClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
        console.log('✅ Extensiones creadas');

        // Verificar tablas existentes
        const tables = await dbClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);

        console.log('\nTablas existentes:');
        tables.rows.forEach(row => console.log(`- ${row.table_name}`));

        if (tables.rows.length === 0) {
            console.log('\n⚠️ No hay tablas en la base de datos.');
            console.log('Necesitas ejecutar el script SQL completo para crear las tablas.');
            console.log('Puedes usar psql o pgAdmin para ejecutar el script SQL.');
        }

        await dbClient.end();
        console.log('\n✅ Verificación completada');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('password authentication failed')) {
            console.log('\nSolución:');
            console.log('1. Verifica que la contraseña en .env sea correcta');
            console.log(`2. La contraseña actual configurada es: ${process.env.DB_PASSWORD}`);
        }
        process.exit(1);
    }
}

setupDatabase();