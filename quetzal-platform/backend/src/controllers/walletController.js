const { sequelize, QZ_TO_FIAT, User, WalletTx } = require('../models');
const { body, validationResult } = require('express-validator');
const paymentService = require('../services/paymentService');

const topupValidators = [ body('fiatAmount').isFloat({ gt: 0 }) ];
const transferValidators = [ body('toUserId').isInt().toInt(), body('qzAmount').isFloat({ gt: 0 }) ];
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

async function summary(req,res){
  const user = await User.findByPk(req.userId);
  const txs = await WalletTx.findAll({ where: { userId: req.userId }, order:[['createdAt','DESC']], limit: 50 });
  res.json({ success:true, balanceQz: Number(user.qzBalance), txs, rate: { QZ_TO_FIAT } });
}

async function topup(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { fiatAmount } = req.body;
  const qz = Number(fiatAmount) / QZ_TO_FIAT;
  await sequelize.transaction(async (t) => {
    const user = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
    const balance = Number(user.qzBalance);
    await user.update({ qzBalance: (balance + qz).toFixed(2) }, { transaction: t });
    await WalletTx.create({ userId: user.id, amountQz: qz, kind: 'credit', category: 'topup', description: `Recarga $${fiatAmount} => +${qz} Qz` }, { transaction: t });
  });
  res.json({ success:true, creditedQz: qz });
}

async function transfer(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { toUserId, qzAmount } = req.body;
  if (toUserId === req.userId) return res.status(400).json({ success:false, message:'No puedes transferirte a ti mismo' });
  await sequelize.transaction(async (t) => {
    const from = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
    const to = await User.findByPk(toUserId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!to) throw new Error('Destino no encontrado');
    const qz = Number(qzAmount);
    if (Number(from.qzBalance) < qz) throw new Error('Fondos insuficientes');
    await from.update({ qzBalance: (Number(from.qzBalance) - qz).toFixed(2) }, { transaction: t });
    await to.update({ qzBalance: (Number(to.qzBalance) + qz).toFixed(2) }, { transaction: t });
    await WalletTx.create({ userId: from.id, amountQz: qz, kind: 'debit', category: 'transfer', description: `Transferencia a ${to.fullName}` }, { transaction: t });
    await WalletTx.create({ userId: to.id, amountQz: qz, kind: 'credit', category: 'transfer', description: `Transferencia de ${from.fullName}` }, { transaction: t });
  });
  res.json({ success:true });
}

async function withdraw(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { fiatAmount } = req.body;
  const qz = Number(fiatAmount) / QZ_TO_FIAT;
  await sequelize.transaction(async (t) => {
    const user = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (Number(user.qzBalance) < qz) throw new Error('Fondos insuficientes');
    await user.update({ qzBalance: (Number(user.qzBalance) - qz).toFixed(2) }, { transaction: t });
    await WalletTx.create({ userId: user.id, amountQz: qz, kind: 'debit', category: 'withdraw', description: `Retiro $${fiatAmount} (-${qz} Qz)` }, { transaction: t });
  });
  res.json({ success:true, debitedQz: Number(fiatAmount) / QZ_TO_FIAT });
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
