// ============================================
// HEALTH CHECK ROUTES
// ============================================
// Endpoints para monitoreo del estado del sistema

const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

/**
 * GET /health
 * Health check básico del servidor
 */
router.get('/', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Quetzal Platform API',
    version: '1.0.0'
  });
});

/**
 * GET /health/db
 * Verificar conexión a base de datos
 */
router.get('/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    // Get table count
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      tables: results[0].table_count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/stats
 * Estadísticas básicas de la plataforma
 */
router.get('/stats', async (req, res) => {
  try {
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const [services] = await sequelize.query('SELECT COUNT(*) as count FROM services WHERE status = \'active\'');
    // Intentar primero tablas PascalCase, luego snake_case si falla
    let transactionsCount = 0;
    try {
      const [txPascal] = await sequelize.query('SELECT COUNT(*) as count FROM "Transactions"');
      transactionsCount = parseInt(txPascal[0].count);
    } catch (errTx) {
      try {
        const [txSnake] = await sequelize.query('SELECT COUNT(*) as count FROM transactions');
        transactionsCount = parseInt(txSnake[0].count);
      } catch (errTx2) { /* ignore */ }
    }

    let contractsCount = 0;
    try {
      const [contractPascal] = await sequelize.query('SELECT COUNT(*) as count FROM "Contracts"');
      contractsCount = parseInt(contractPascal[0].count);
    } catch (errCt) {
      try {
        const [contractSnake] = await sequelize.query('SELECT COUNT(*) as count FROM contracts');
        contractsCount = parseInt(contractSnake[0].count);
      } catch (errCt2) { /* ignore */ }
    }
    
    // Try Conversations (PascalCase), fallback to conversations (snake_case)
    let conversationsCount = 0;
    try {
      const [convs] = await sequelize.query('SELECT COUNT(*) as count FROM "Conversations"');
      conversationsCount = parseInt(convs[0].count);
    } catch (err) {
      try {
        const [convs] = await sequelize.query('SELECT COUNT(*) as count FROM conversations');
        conversationsCount = parseInt(convs[0].count);
      } catch (err2) {
        // Table might not exist
      }
    }
    
    res.status(200).json({
      status: 'ok',
      stats: {
        activeUsers: parseInt(users[0].count),
        activeServices: parseInt(services[0].count),
  totalTransactions: transactionsCount,
  totalContracts: contractsCount,
        totalConversations: conversationsCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
