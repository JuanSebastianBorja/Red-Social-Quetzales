// ============================================
// DATABASE.JS - Configuración de Sequelize para Netlify Serverless
// ============================================
const { Sequelize } = require('sequelize');

// En Netlify, las variables de entorno se cargan automáticamente
// No necesitamos dotenv aquí

// Configuración de Sequelize optimizada para serverless
let sequelize;

// Si la plataforma proporciona una única DATABASE_URL (Netlify, Railway, Render)
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false, // Desactivar logging en producción para mejor performance
        pool: {
            max: 2,        // Reducido para serverless (límite de conexiones)
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    // Configuración tradicional por variables separadas
    sequelize = new Sequelize(
        process.env.DB_NAME || 'quetzal_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'root', 
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: false,
            pool: {
                max: 2,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            define: {
                timestamps: true,
                underscored: true,
                freezeTableName: true
            },
            dialectOptions: {
                ssl: process.env.DB_SSL === 'true' ? {
                    require: true,
                    rejectUnauthorized: false
                } : false
            }
        }
    );
}

// Función para probar la conexión
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a PostgreSQL establecida');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a PostgreSQL:', error.message);
        return false;
    }
}

// Función para cerrar la conexión (importante en serverless)
async function closeConnection() {
    try {
        await sequelize.close();
        console.log('✅ Conexión a PostgreSQL cerrada');
    } catch (error) {
        console.error('❌ Error al cerrar conexión:', error);
    }
}

module.exports = {
    sequelize,
    testConnection,
    closeConnection,
    Sequelize
};