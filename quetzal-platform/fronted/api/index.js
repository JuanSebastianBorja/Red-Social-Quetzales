// ============================================
// VERCEL SERVERLESS HANDLER
// ============================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// RUTAS BÁSICAS PARA TESTING
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Quetzal Platform API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// Ruta raíz del API
app.get('/api', (req, res) => {
    res.json({
        message: '🦜 Bienvenido a Quetzal Platform API',
        version: '1.0.0',
        status: 'active',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            users: '/api/users/*',
            services: '/api/services/*'
        }
    });
});

// Ruta 404 para API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.path
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Exportar para Vercel
module.exports = app;
