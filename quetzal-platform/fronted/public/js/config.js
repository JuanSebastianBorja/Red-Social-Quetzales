// ============================================
// CONFIG.JS - Configuración del Frontend
// ============================================

// Detectar si estamos en producción o desarrollo
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1' &&
                     !window.location.hostname.includes('192.168');

// API Base URL - En producción usa el mismo dominio (Vercel Serverless)
const API_BASE_URL = isProduction 
    ? `${window.location.origin}/api`  // Mismo dominio en producción
    : 'http://localhost:3000/api';      // Localhost en desarrollo

const config = {
    // API Configuration
    api: {
        baseUrl: API_BASE_URL,
        rateLimit: 100,
        rateWindow: 900000, // 15 minutos
    },

    // Environment
    isDevelopment: !isProduction,
    isProduction: isProduction,

    // Features
    features: {
        notifications: true,
        chat: true,
    },

    // Cache
    cache: {
        ttl: 3600, // 1 hora
    },

    // Endpoints (rutas relativas - se concatenan con baseUrl)
    endpoints: {
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            logout: '/auth/logout',
            verify: '/auth/verify',
        },
        users: {
            profile: '/users/profile',
            avatar: '/users/avatar',
        },
        services: {
            list: '/services',
            create: '/services',
            myServices: '/services/my-services',
        },
        wallet: {
            balance: '/wallet/balance',
            transactions: '/wallet/transactions',
        },
    },
};

// Validaciones básicas
if (!config.api.baseUrl) {
    console.error('⚠️ API_BASE_URL no está configurada');
}

// Log de configuración (solo en desarrollo)
if (config.isDevelopment) {
    console.log('🔧 Configuración cargada:', {
        environment: config.isProduction ? 'production' : 'development',
        apiUrl: config.api.baseUrl,
        features: config.features
    });
}

// Exportar la configuración
export default config;
