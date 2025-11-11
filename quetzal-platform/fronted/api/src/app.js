// ============================================
// APP.JS - Configuración de Express
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Importar modelos (esto establece las relaciones)
require('./models/index');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const walletRoutes = require('./routes/walletRoutes');
const escrowRoutes = require('./routes/escrowRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const adminRoutes = require('./routes/adminRoutes');

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
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        process.env.FRONTEND_URL || 'https://quetzal-platform.netlify.app'
    ],
    credentials: true
}));

// Compresión
app.use(compression());

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/', limiter);

// Rate Limiting más estricto para autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de inicio de sesión, intenta de nuevo más tarde'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// RUTAS API
// ============================================

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: '🦜 Bienvenido a Quetzal Platform API',
        version: '1.0.0',
        documentation: '/api-docs'
    });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada (404)
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
});

module.exports = app;