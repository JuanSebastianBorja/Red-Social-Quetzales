// ============================================
// WALLET ROUTES - Rutas de billetera virtual
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { getWallet, rechargeWallet, transferToUser, getTransactionHistory, getBalance } = require('../controllers/walletController');

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// GET /api/wallet - Obtener mi billetera
router.get('/', auth, getWallet);

// GET /api/wallet/balance - Obtener mi balance
router.get('/balance', auth, getBalance);

// GET /api/wallet/transactions - Obtener mis transacciones
router.get('/transactions', auth, getTransactionHistory);

// POST /api/wallet/deposit - Depositar fondos
router.post('/deposit', auth, rechargeWallet);

// POST /api/wallet/transfer - Transferir fondos a otro usuario
router.post('/transfer', auth, transferToUser);

// POST /api/wallet/withdraw - Retirar fondos
router.post('/withdraw', auth, (req, res) => {
    res.json({ 
        message: 'Retirar fondos',
        body: req.body,
        status: 'en desarrollo'
    });
});

module.exports = router;