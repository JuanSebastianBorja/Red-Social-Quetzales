// ============================================
// TRANSACTION CONTROLLER - Actualizado PSE + DB real
// ============================================

const { Op } = require("sequelize");
const { validationResult } = require("express-validator");
const { Transaction, Wallet, User } = require("../models");

// ======================================================
// GET /api/transactions
// Filtros de administrador
// ======================================================
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      paymentMethod,
      userId,
      walletId,
      startDate,
      endDate,
      reference,
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (walletId) where.walletId = walletId;
    if (userId) where.userId = userId;
    if (reference) where.paymentReference = reference;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const tx = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email"],
        },
        {
          model: Wallet,
          as: "wallet",
          attributes: ["id", "balance", "currency"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    res.json({
      success: true,
      count: tx.count,
      pages: Math.ceil(tx.count / limit),
      transactions: tx.rows,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET /api/transactions/:id
// ======================================================
exports.getTransactionById = async (req, res, next) => {
  try {
    const tx = await Transaction.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "fullName", "email"] },
        { model: Wallet, as: "wallet", attributes: ["id", "balance"] },
      ],
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: "Transacción no encontrada" });
    }

    res.json({ success: true, transaction: tx });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// POST /api/transactions
// Creación manual (solo admins)
// ======================================================
exports.createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const {
      userId,
      walletId,
      type,
      amount,
      description,
      paymentMethod,
      status,
      referenceId,
    } = req.body;

    const wallet = await Wallet.findByPk(walletId);
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet no encontrada" });
    }

    const tx = await Transaction.create({
      userId,
      walletId,
      type,
      amount,
      description,
      paymentMethod: paymentMethod || "wallet",
      referenceId,
      status: status || "completed",
    });

    // Ajustar balance si completed
    if (tx.status === "completed") {
      let balance = parseFloat(wallet.balance);

      if (["deposit", "topup", "transfer_in"].includes(type)) {
        balance += parseFloat(amount);
      }

      if (["withdraw", "transfer", "payment", "purchase"].includes(type)) {
        if (balance < amount) {
          return res.status(400).json({ success: false, message: "Saldo insuficiente" });
        }
        balance -= amount;
      }

      await wallet.update({ balance });
    }

    res.status(201).json({ success: true, transaction: tx });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// PUT /api/transactions/:id
// Actualización manual (admins)
// ======================================================
exports.updateTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findByPk(req.params.id);
    if (!tx)
      return res.status(404).json({ success: false, message: "Transacción no encontrada" });

    await tx.update(req.body);

    res.json({ success: true, transaction: tx });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// DELETE /api/transactions/:id
// ======================================================
exports.deleteTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findByPk(req.params.id);
    if (!tx)
      return res.status(404).json({ success: false, message: "Transacción no encontrada" });

    await tx.destroy();

    res.json({ success: true, message: "Transacción eliminada" });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET /api/wallets/:walletId/transactions
// ======================================================
exports.getTransactionsByWallet = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const where = { walletId: req.params.walletId };

    if (type) where.type = type;
    if (status) where.status = status;

    const tx = await Transaction.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    res.json({
      success: true,
      count: tx.count,
      pages: Math.ceil(tx.count / limit),
      transactions: tx.rows,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET /api/wallets/:walletId/balance
// ======================================================
exports.getWalletBalance = async (req, res, next) => {
  try {
    const wallet = await Wallet.findByPk(req.params.walletId);

    if (!wallet)
      return res.status(404).json({ success: false, message: "Wallet no encontrada" });

    res.json({ success: true, wallet });
  } catch (error) {
    next(error);
  }
};
