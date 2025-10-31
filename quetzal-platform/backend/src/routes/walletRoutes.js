// ============================================
// WALLET ROUTES - Rutas de billetera virtual
// ============================================

const express = require('express');
const router = express.Router();

// GET /api/wallet - Obtener mi billetera
router.get('/', (req, res) => {
    res.json({ 
        message: 'Obtener billetera del usuario',
        status: 'en desarrollo'
    });
});

// GET /api/wallet/transactions - Obtener mis transacciones
router.get('/transactions', (req, res) => {
    res.json({ 
        message: 'Obtener transacciones del usuario',
        status: 'en desarrollo'
    });
});

// POST /api/wallet/deposit - Depositar fondos
router.post('/deposit', (req, res) => {
    res.json({ 
        message: 'Depositar fondos',
        body: req.body,
        status: 'en desarrollo'
    });
});

// POST /api/wallet/withdraw - Retirar fondos
router.post('/withdraw', (req, res) => {
    res.json({ 
        message: 'Retirar fondos',
        body: req.body,
        status: 'en desarrollo'
    });
});

module.exports = router;
