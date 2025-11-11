// ============================================
// VERCEL SERVERLESS HANDLER
// ============================================
// Configurar entorno de producción
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Importar modelos (esto establece las relaciones)
require('./src/models/index');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const escrowRoutes = require('./src/routes/escrowRoutes');
const ratingRoutes = require('./src/routes/ratingRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// Seguridad
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS
const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        process.env.FRONTEND_URL || 'https://red-social-quetzales.vercel.app'
    ];

app.use(cors({
    origin: corsOrigins,
    credentials: true
}));

// Compresión
app.use(compression());

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - URL: ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
});

// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 peticiones por IP
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde'
});
app.use('/', limiter);

// Rate Limiting más estricto para autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de inicio de sesión, intenta de nuevo más tarde'
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// ============================================
// RUTAS API
// ============================================

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Quetzal Platform API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/services', serviceRoutes);
app.use('/wallet', walletRoutes);
app.use('/escrow', escrowRoutes);
app.use('/ratings', ratingRoutes);
app.use('/admin', adminRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: '🦜 Bienvenido a Quetzal Platform API',
        version: '1.0.0',
        status: 'active',
        documentation: '/api-docs',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            users: '/api/users/*',
            services: '/api/services/*',
            wallet: '/api/wallet/*',
            escrow: '/api/escrow/*',
            ratings: '/api/ratings/*',
            admin: '/api/admin/*'
        }
    });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada (404)
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// VERCEL SERVERLESS EXPORT
// ============================================
// Debug completo para entender qué recibe Vercel

module.exports = (req, res) => {
    // Log everything for debugging
    console.log('=== VERCEL REQUEST DEBUG ===');
    console.log('req.url:', req.url);
    console.log('req.query:', JSON.stringify(req.query));
    console.log('req.params:', JSON.stringify(req.params));
    console.log('req.path:', req.path);
    console.log('req.originalUrl:', req.originalUrl);
    console.log('req.baseUrl:', req.baseUrl);
    console.log('========================');
    
    // Intentar reconstruir desde diferentes fuentes
    let reconstructedPath = req.url;
    
    // Opción 1: desde req.query.path (array de segmentos)
    if (req.query && req.query.path) {
        const pathArray = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
        reconstructedPath = '/' + pathArray.join('/');
        
        // Remover 'path' del query string
        const queryString = Object.keys(req.query)
            .filter(key => key !== 'path')
            .map(key => `${key}=${encodeURIComponent(req.query[key])}`)
            .join('&');
        
        if (queryString) {
            reconstructedPath += '?' + queryString;
        }
        
        req.url = reconstructedPath;
        console.log('Reconstructed from query.path:', req.url);
    }
    
    // Pasar a Express
    return app(req, res);
};
