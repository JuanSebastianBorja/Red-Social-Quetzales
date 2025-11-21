// ============================================
// WALLET ROUTES - Rutas de billetera virtual
// ============================================

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/auth');
const { param } = require("express-validator");

// ============================================
// 1️⃣ WEBHOOKS (DEBEN SER PUBLICOS, SIN AUTH)
// ============================================
router.post('/epayco/confirmation', walletController.handleEpaycoConfirmation);
router.post('/pse/callback', walletController.handlePseCallback);

// ============================================
// 2️⃣ TODAS LAS DEMÁS RUTAS VAN PROTEGIDAS
// ============================================
router.use(protect);

// ============================================
// RUTAS DE WALLET
// ============================================
router.get('/summary', walletController.summary);
router.get('/quote', walletController.quote);

router.post('/recharge', walletController.topupValidators, walletController.rechargeWallet);
router.post('/transfer', walletController.transferValidators, walletController.transferToUser);
router.post('/withdraw', walletController.withdrawValidators, walletController.withdraw);

// ============================================
// RUTAS PSE (Pagos Seguros en Línea)
// ============================================
router.get('/pse/banks', walletController.getPseBanks);

router.post('/pse/init',
  walletController.pseInitValidators,
  walletController.initPsePayment
);

const pseStatusValidators = [
  param('reference').notEmpty().withMessage('La referencia es requerida.')
];

router.get('/pse/status/:reference',
  pseStatusValidators,
  walletController.getPseStatus
);

router.post('/pse/expire', walletController.expireTransactions);

// ============================================
// RUTAS EPAYCO
// ============================================
router.post('/epayco/init',
  walletController.epaycoInitValidators,
  walletController.initEpaycoPayment
);

module.exports = router;