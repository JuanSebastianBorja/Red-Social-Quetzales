// ============================================
// VERCEL SERVERLESS HANDLER
// ============================================
// Este archivo permite que tu backend Express
// funcione como función serverless en Vercel

// Configurar entorno de producción
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Importar la app Express existente
const app = require('../../backend/src/app');

// Exportar para Vercel
// Vercel convierte esto automáticamente en una función serverless
module.exports = app;
