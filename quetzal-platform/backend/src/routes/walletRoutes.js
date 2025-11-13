// ============================================
// WALLET ROUTES - Rutas de billetera virtual
// ============================================

const express = require('express');
const router = express.Router();
<<<<<<< HEAD
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
=======
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas
router.use(protect);

// ============================================
// RUTAS DE WALLET
// ============================================

// GET /api/wallet/summary - Resumen de billetera
router.get('/summary', walletController.summary);

// GET /api/wallet/quote - Cotización Quetzales <-> COP
router.get('/quote', walletController.quote);

// POST /api/wallet/topup - Recargar Quetzales (método directo - DEPRECADO)
// Esta ruta se mantiene para compatibilidad pero se recomienda usar PSE
router.post('/topup', walletController.topupValidators, walletController.topup);

// POST /api/wallet/transfer - Transferir Quetzales a otro usuario
router.post('/transfer', walletController.transferValidators, walletController.transfer);

// POST /api/wallet/withdraw - Retirar fondos
router.post('/withdraw', walletController.withdrawValidators, walletController.withdraw);

// ============================================
// RUTAS PSE (Pagos Seguros en Línea)
// ============================================

// GET /api/wallet/pse/banks - Obtener lista de bancos disponibles
router.get('/pse/banks', walletController.getPseBanks);

// POST /api/wallet/pse/init - Iniciar pago con PSE
router.post('/pse/init', walletController.pseInitValidators, walletController.initPsePayment);

// POST /api/wallet/pse/callback - Callback/webhook de PSE (también puede ser GET)
router.post('/pse/callback', walletController.pseCallback);
router.get('/pse/callback', walletController.pseCallback); // Algunos proveedores usan GET

// GET /api/wallet/pse/status/:reference - Verificar estado de transacción
router.get('/pse/status/:reference', walletController.getPseStatus);
>>>>>>> cc4c4af3e771aba7082da02ff554d4eb7b32c798

module.exports = router;