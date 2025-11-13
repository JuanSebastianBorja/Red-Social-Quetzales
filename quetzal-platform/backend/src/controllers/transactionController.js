// ============================================
// TRANSACTION CONTROLLER - Controlador de Transacciones
// ============================================

const { validationResult } = require('express-validator');
const { Transaction, Wallet, User } = require('../models');

// @desc    Obtener todas las transacciones
// @route   GET /api/transactions
// @access  Private (solo admins o usuarios con permiso)
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, status, startDate, endDate, walletId } = req.query;

    const whereClause = {};
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (startDate) whereClause.created_at = { [require('sequelize').Op.gte]: startDate };
    if (endDate) whereClause.created_at = { ...whereClause.created_at, [require('sequelize').Op.lte]: endDate };
    if (walletId) whereClause.wallet_id = walletId;

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Wallet,
          as: 'wallet',
          attributes: ['id', 'balance', 'currency'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: transactions.count,
      pages: Math.ceil(transactions.count / parseInt(limit)),
       transactions: transactions.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una transacción por ID
// @route   GET /api/transactions/:id
// @access  Private (solo admins o usuarios con permiso)
exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: Wallet,
          as: 'wallet',
          attributes: ['id', 'balance', 'currency'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada.'
      });
    }

    res.json({
      success: true,
       transaction
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear una nueva transacción
// @route   POST /api/transactions
// @access  Private (solo admins o usuarios con permiso)
exports.createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { walletId, type, amount, description, referenceId, status } = req.body;

    // Verificar que la wallet exista
    const wallet = await Wallet.findByPk(walletId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet no encontrada.'
      });
    }

    const transaction = await Transaction.create({
      walletId,
      type,
      amount,
      description,
      referenceId,
      status
    });

    // Actualizar balance de la wallet si la transacción es exitosa
    if (status === 'completed') {
      let newBalance = wallet.balance;
      if (type === 'deposit' || type === 'transfer_in') {
        newBalance = parseFloat(newBalance) + parseFloat(amount);
      } else if (type === 'withdrawal' || type === 'transfer_out' || type === 'payment' || type === 'refund') {
        newBalance = parseFloat(newBalance) - parseFloat(amount);
      }

      if (newBalance < 0) {
        return res.status(400).json({
          success: false,
          message: 'Saldo insuficiente para completar la transacción.'
        });
      }

      await wallet.update({ balance: newBalance });
    }

    res.status(201).json({
      success: true,
      message: 'Transacción creada exitosamente.',
       transaction
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una transacción
// @route   PUT /api/transactions/:id
// @access  Private (solo admins)
exports.updateTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { type, amount, description, referenceId, status } = req.body;

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada.'
      });
    }

    await transaction.update({ type, amount, description, referenceId, status });

    res.json({
      success: true,
      message: 'Transacción actualizada exitosamente.',
       transaction
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una transacción
// @route   DELETE /api/transactions/:id
// @access  Private (solo admins)
exports.deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada.'
      });
    }

    await transaction.destroy();

    res.json({
      success: true,
      message: 'Transacción eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener transacciones de una wallet específica
// @route   GET /api/wallets/:walletId/transactions
// @access  Private (solo dueño de la wallet o admins)
exports.getTransactionsByWallet = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const { page = 1, limit = 20, type, status } = req.query;

    const whereClause = { walletId };
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: transactions.count,
      pages: Math.ceil(transactions.count / parseInt(limit)),
       transactions: transactions.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener balance actual de una wallet
// @route   GET /api/wallets/:walletId/balance
// @access  Private (solo dueño de la wallet o admins)
exports.getWalletBalance = async (req, res, next) => {
  try {
    const { walletId } = req.params;

    const wallet = await Wallet.findByPk(walletId, {
      attributes: ['id', 'balance', 'currency', 'createdAt', 'updatedAt']
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet no encontrada.'
      });
    }

    res.json({
      success: true,
       wallet
    });

  } catch (error) {
    next(error);
  }
};

module.exports = Transaction;