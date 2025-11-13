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