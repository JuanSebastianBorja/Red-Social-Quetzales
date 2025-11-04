// ============================================
// CONFIG.JS - Configuración del Frontend
// ============================================

const config = {
    // API Configuration
    api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
        rateLimit: parseInt(process.env.API_RATE_LIMIT || '100'),
        rateWindow: parseInt(process.env.API_RATE_WINDOW || '900000'),
    },

    // Environment
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // Features
    features: {
        notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
        chat: process.env.ENABLE_CHAT === 'true',
    },

    // Cache
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '3600'),
    },

    // Endpoints
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
    console.error('API_BASE_URL no está configurada');
}

// Exportar la configuración
export default config;