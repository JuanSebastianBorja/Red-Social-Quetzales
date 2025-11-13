<<<<<<< HEAD
// ============================================
// WALLET CONTROLLER - Controlador de Carteras
// ============================================

const { validationResult } = require('express-validator');
const { Wallet, User, Transaction } = require('../models');

// @desc    Obtener la cartera del usuario autenticado
// @route   GET /api/wallet
// @access  Private
exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'avatar']
        },
        {
          model: Transaction,
          as: 'transactions',
          attributes: ['id', 'type', 'amount', 'description', 'status', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una cartera activa. Contacta al soporte.'
      });
    }

    res.json({
      success: true,
      data: wallet
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Recargar la cartera con Quetzales
// @route   POST /api/wallet/recharge
// @access  Private
exports.rechargeWallet = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { amount, referenceId } = req.body;

    // Validar que el monto sea positivo
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0.'
      });
    }

    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Cartera no encontrada.'
      });
    }

    // Actualizar balance
    wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
    await wallet.save();

    // Crear transacción de recarga
    await Transaction.create({
      walletId: wallet.id,
      type: 'deposit',
      amount,
      description: 'Recarga de cartera',
      referenceId,
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Cartera recargada exitosamente',
      data: wallet
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Transferir Quetzales a otro usuario
// @route   POST /api/wallet/transfer
// @access  Private
exports.transferToUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { targetUserId, amount, description } = req.body;

    // Validar que el monto sea positivo
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0.'
      });
    }

    // Verificar que no transfieras a ti mismo
    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes transferirte a ti mismo.'
      });
    }

    // Obtener las wallets de origen y destino
    const sourceWallet = await Wallet.findOne({ where: { userId: req.user.id } });
    const targetWallet = await Wallet.findOne({ where: { userId: targetUserId } });

    if (!sourceWallet || !targetWallet) {
      return res.status(404).json({
        success: false,
        message: 'Una de las carteras no existe.'
      });
    }

    // Verificar saldo suficiente
    if (parseFloat(sourceWallet.balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para realizar la transferencia.'
      });
    }

    // Realizar la transferencia en una transacción
    const transaction = await Wallet.sequelize.transaction();

    try {
      // Restar saldo de la wallet origen
      sourceWallet.balance = parseFloat(sourceWallet.balance) - parseFloat(amount);
      await sourceWallet.save({ transaction });

      // Sumar saldo a la wallet destino
      targetWallet.balance = parseFloat(targetWallet.balance) + parseFloat(amount);
      await targetWallet.save({ transaction });

      // Crear transacciones
      await Transaction.create({
        walletId: sourceWallet.id,
        type: 'transfer_out',
        amount,
        description: description || `Transferencia a ${targetWallet.user.fullName}`,
        status: 'completed'
      }, { transaction });

      await Transaction.create({
        walletId: targetWallet.id,
        type: 'transfer_in',
        amount,
        description: description || `Transferencia recibida de ${sourceWallet.user.fullName}`,
        status: 'completed'
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Transferencia realizada exitosamente',
        data: {
          sourceWallet,
          targetWallet
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener historial de transacciones
// @route   GET /api/wallet/transactions
// @access  Private
exports.getTransactionHistory = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, type, status } = req.query;

    const whereClause = { walletId: req.user.walletId }; // Asumiendo que req.user.walletId está disponible
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Wallet,
          as: 'wallet',
          include: [
            { model: User, as: 'user', attributes: ['fullName'] }
          ]
        }
      ]
    });

    res.json({
      success: true,
      count: transactions.count,
      data: transactions.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener balance actual
// @route   GET /api/wallet/balance
// @access  Private
exports.getBalance = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({
      where: { userId: req.user.id },
      attributes: ['id', 'balance', 'currency', 'createdAt', 'updatedAt']
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Cartera no encontrada.'
      });
    }

    res.json({
      success: true,
      data: {
        balance: parseFloat(wallet.balance),
        currency: wallet.currency
      }
    });

  } catch (error) {
    next(error);
  }
};
=======
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
>>>>>>> cc4c4af3e771aba7082da02ff554d4eb7b32c798
