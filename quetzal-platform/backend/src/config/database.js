// ============================================
// DATABASE.JS - Configuración de Sequelize
// ============================================
const { Sequelize } = require('sequelize');
// Las variables de entorno ya se cargan en server.js con dotenv
// Aquí solo usamos process.env directamente

// Configuración de Sequelize
let sequelize;

// Si la plataforma proporciona una única DATABASE_URL (por ejemplo Railway/Render), úsala.
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        },
        dialectOptions: process.env.DB_SSL === 'true' || /sslmode=require/i.test(process.env.DATABASE_URL || '') ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {}  // ✅ Corregido: Cierre de objeto
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
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            define: {
                timestamps: true,
                underscored: true,
                freezeTableName: true
            },
            dialectOptions: process.env.DB_SSL === 'true' ? {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            } : {}
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

// Función para cerrar la conexión
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