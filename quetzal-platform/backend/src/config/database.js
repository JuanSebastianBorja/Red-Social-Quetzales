    // ============================================
    // DATABASE.JS - Configuración de Sequelize
    // ============================================

    const { Sequelize } = require('sequelize');

    // Cargar variables de entorno solo si no están cargadas
    if (!process.env.DB_NAME) {
    require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
    }

    // Configuración de Sequelize
    const sequelize = new Sequelize(
    process.env.DB_NAME || 'quetzal_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
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
        dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
        } : false
        }
    }
    );

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