    // ============================================
    // SERVER.JS - Punto de Entrada del Servidor
    // ============================================

    const app = require('./src/app');
    const { sequelize } = require('./src/config/database');

    const PORT = process.env.PORT || 3000;

    // Iniciar servidor
    async function startServer() {
    try {
        // Verificar conexión a la base de datos
        await sequelize.authenticate();
        console.log('✅ Conexión a PostgreSQL establecida correctamente');

        // Sincronizar modelos (solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados con la base de datos');
        }

        // Iniciar servidor HTTP
        app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
        console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
    }

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
    });

    process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM recibido. Cerrando servidor...');
    await sequelize.close();
    process.exit(0);
    });

    process.on('SIGINT', async () => {
    console.log('🛑 SIGINT recibido. Cerrando servidor...');
    await sequelize.close();
    process.exit(0);
    });

    // Iniciar
    startServer();