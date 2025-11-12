const { sequelize, User, Wallet, Transaction } = require('../models');
// Tasa fija temporal (mover a config/constants luego)
const QZ_TO_FIAT = 10000; // 1 QZ = 10,000 COP (ejemplo)
const { body, validationResult } = require('express-validator');
const paymentService = require('../services/paymentService');

const topupValidators = [ body('fiatAmount').isFloat({ gt: 0 }) ];
const transferValidators = [ body('toUserId').isUUID(), body('qzAmount').isFloat({ gt: 0 }) ];
const withdrawValidators = [ body('fiatAmount').isFloat({ gt: 0 }) ];

// Validadores PSE
const pseInitValidators = [
  body('amountCOP').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
  body('bankCode').notEmpty().withMessage('Debe seleccionar un banco'),
  body('personType').isIn(['natural', 'juridica']).withMessage('Tipo de persona inválido'),
  body('documentType').notEmpty().withMessage('Tipo de documento requerido'),
  body('documentNumber').notEmpty().withMessage('Número de documento requerido'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido')
];

async function ensureWallet(userId, transaction) {
  let wallet = await Wallet.findOne({ where: { userId }, transaction });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0 }, { transaction });
  }
  return wallet;
}

async function summary(req,res){
  const wallet = await ensureWallet(req.userId);
  const txs = await Transaction.findAll({ where: { userId: req.userId }, order:[['createdAt','DESC']], limit: 50 });
  res.json({ success:true, balanceQz: Number(wallet.balance), txs, rate: { QZ_TO_FIAT } });
}

async function topup(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { fiatAmount } = req.body;
  const qz = Number(fiatAmount) / QZ_TO_FIAT;
  await sequelize.transaction(async (t) => {
    const wallet = await ensureWallet(req.userId, t);
    const newBalance = (Number(wallet.balance) + qz).toFixed(2);
    await wallet.update({ balance: newBalance }, { transaction: t });
    await Transaction.create({ userId: req.userId, amountQZ: qz, type: 'topup', paymentMethod: 'wallet', status: 'approved', description: `Recarga $${fiatAmount} => +${qz} QZ` }, { transaction: t });
  });
  res.json({ success:true, creditedQz: qz });
}

async function transfer(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { toUserId, qzAmount } = req.body;
  if (toUserId === req.userId) return res.status(400).json({ success:false, message:'No puedes transferirte a ti mismo' });
  await sequelize.transaction(async (t) => {
    const fromWallet = await ensureWallet(req.userId, t);
    const toWallet = await ensureWallet(toUserId, t);
    const qz = Number(qzAmount);
    if (Number(fromWallet.balance) < qz) throw new Error('Fondos insuficientes');
    await fromWallet.update({ balance: (Number(fromWallet.balance) - qz).toFixed(2) }, { transaction: t });
    await toWallet.update({ balance: (Number(toWallet.balance) + qz).toFixed(2) }, { transaction: t });
    await Transaction.create({ userId: req.userId, amountQZ: qz, type: 'transfer', paymentMethod: 'wallet', status: 'approved', description: `Transferencia a usuario ${toUserId}` }, { transaction: t });
    await Transaction.create({ userId: toUserId, amountQZ: qz, type: 'transfer', paymentMethod: 'wallet', status: 'approved', description: `Transferencia recibida de usuario ${req.userId}` }, { transaction: t });
  });
  res.json({ success:true });
}

async function withdraw(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { fiatAmount } = req.body;
  const qz = Number(fiatAmount) / QZ_TO_FIAT;
  await sequelize.transaction(async (t) => {
    const wallet = await ensureWallet(req.userId, t);
    if (Number(wallet.balance) < qz) throw new Error('Fondos insuficientes');
    await wallet.update({ balance: (Number(wallet.balance) - qz).toFixed(2) }, { transaction: t });
    await Transaction.create({ userId: req.userId, amountQZ: qz, type: 'withdraw', paymentMethod: 'wallet', status: 'approved', description: `Retiro $${fiatAmount} (-${qz} QZ)` }, { transaction: t });
  });
  res.json({ success:true, debitedQz: qz });
}

function quote(req,res){
  const fiat = Number(req.query.fiat||0);
  const qz = fiat ? fiat / QZ_TO_FIAT : null;
  res.json({ success:true, rate: { QZ_TO_FIAT }, fiat, qz });
}

// ============================================
// PSE ENDPOINTS
// ============================================

// Obtener lista de bancos PSE
async function getPseBanks(req, res) {
  try {
    const banks = await paymentService.getBanks();
    res.json({
      success: true,
      banks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de bancos',
      error: error.message
    });
  }
}

// Iniciar transacción PSE
async function initPsePayment(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { amountCOP, bankCode, personType, documentType, documentNumber, email } = req.body;

    // Obtener IP y User-Agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Crear transacción PSE
    const result = await paymentService.createPseTransaction({
      userId: req.userId,
      amountCOP,
      bankCode,
      personType,
      documentType,
      documentNumber,
      email,
      ipAddress,
      userAgent
    });

    res.json(result);

  } catch (error) {
    console.error('Error iniciando pago PSE:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar el pago',
      error: error.message
    });
  }
}

// Callback de PSE (webhook)
async function pseCallback(req, res) {
  try {
    const { reference, status, authorizationCode } = req.body;

    if (!reference || !status) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const result = await paymentService.processPseCallback(
      reference,
      status,
      authorizationCode
    );

    res.json(result);

  } catch (error) {
    console.error('Error procesando callback PSE:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando callback',
      error: error.message
    });
  }
}

// Verificar estado de transacción PSE
async function getPseStatus(req, res) {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Referencia requerida'
      });
    }

    const result = await paymentService.getTransactionStatus(reference);
    res.json(result);

  } catch (error) {
    console.error('Error verificando estado PSE:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando estado',
      error: error.message
    });
  }
}

module.exports = {
  summary,
  topup,
  transfer,
  withdraw,
  quote,
  getPseBanks,
  initPsePayment,
  pseCallback,
  getPseStatus,
  topupValidators,
  transferValidators,
  withdrawValidators,
  pseInitValidators
};
