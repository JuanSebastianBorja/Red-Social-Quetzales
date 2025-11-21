// ============================================
// WALLET CONTROLLER – CORREGIDO Y ACTUALIZADO
// ============================================

const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Wallet, User, Transaction, sequelize } = require("../models");
const { QZ_TO_COP } = require("../utils/currency");
const paymentService = require("../services/paymentService");
const crypto = require('crypto');
const { topupValidators, transferValidators, withdrawValidators, pseInitValidators,epaycoInitValidators } = require('../validators/walletValidator');

// ============================================================
// VALIDADORES 
// ============================================================
exports.topupValidators = topupValidators;
exports.transferValidators = transferValidators;
exports.withdrawValidators = withdrawValidators;
exports.pseInitValidators = pseInitValidators;
exports.epaycoInitValidators = epaycoInitValidators;

// ============================================================
// HELPERS
// ============================================================
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
}

// ============================================================
// GET /api/wallet
// Obtener cartera del usuario
// ============================================================
exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "avatar"],
        },
        {
          model: Transaction,
          as: "transactions",
          limit: 10,
          order: [["createdAt", "DESC"]],
          attributes: [
            "id",
            "type",
            "amount",
            "status",
            "description",
            "createdAt",
          ],
        },
      ],
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "No tienes una billetera activa.",
      });
    }

    res.json({
      success: true,
      data: {
        wallet: {
          id: wallet.id,
          balance: parseFloat(wallet.balance),
          currency: wallet.currency,
          createdAt: wallet.createdAt,
        },
        transactions: wallet.transactions,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/wallet/summary
// ============================================================
exports.summary = async (req, res, next) => {
  return exports.getWallet(req, res, next);
};

// ============================================================
// GET /api/wallet/quote
// ============================================================
exports.quote = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        fiatPerQZ: QZ_TO_COP,
        message: `1 QZ equivale a ${QZ_TO_COP} COP`
      }
    });
  } catch (err) {
    next(err);
  }
};


// ============================================================
// POST /api/wallet/recharge
// ============================================================
exports.rechargeWallet = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { amount } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Monto inválido." });
    }

    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });

    if (!wallet)
      return res
        .status(404)
        .json({ success: false, message: "Cartera no encontrada." });

    const t = await sequelize.transaction();

    try {
      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

      await wallet.update(
        { balance: newBalance.toFixed(2) },
        { transaction: t }
      );

      const tx = await Transaction.create(
        {
          userId: req.user.id,
          walletId: wallet.id,
          type: "deposit",
          paymentMethod: "wallet",
          status: "completed",
          amount: parseFloat(amount),
          description: "Recarga manual de cartera",
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        success: true,
        message: "Cartera recargada exitosamente.",
        data: {
          wallet,
          transaction: tx,
        }
      });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/wallet/transfer
// ============================================================
exports.transferToUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { targetUserId, amount, description } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
      return res.status(400).json({
        success: false,
        message: "El monto debe ser mayor a 0.",
      });

    if (req.user.id === targetUserId)
      return res.status(400).json({
        success: false,
        message: "No puedes transferirte a ti mismo.",
      });

    const sourceWallet = await Wallet.findOne({
      where: { userId: req.user.id },
    });
    const targetWallet = await Wallet.findOne({
      where: { userId: targetUserId },
    });

    if (!sourceWallet || !targetWallet)
      return res
        .status(404)
        .json({ success: false, message: "Una de las carteras no existe." });

    if (parseFloat(sourceWallet.balance) < parseFloat(amount))
      return res.status(400).json({
        success: false,
        message: "Saldo insuficiente.",
      });

    const t = await sequelize.transaction();

    try {
      await sourceWallet.update(
        { balance: (parseFloat(sourceWallet.balance) - parseFloat(amount)).toFixed(2) },
        { transaction: t }
      );

      await targetWallet.update(
        { balance: (parseFloat(targetWallet.balance) + parseFloat(amount)).toFixed(2) },
        { transaction: t }
      );

      await Transaction.create(
        {
          userId: req.user.id,
          walletId: sourceWallet.id,
          type: "transfer",
          paymentMethod: "wallet",
          status: "completed",
          amount: parseFloat(amount),
          description:
            description || `Transferencia a usuario ${targetUserId}`,
        },
        { transaction: t }
      );

      await Transaction.create(
        {
          userId: targetUserId,
          walletId: targetWallet.id,
          type: "transfer",
          paymentMethod: "wallet",
          status: "completed",
          amount: parseFloat(amount),
          description:
            description ||
            `Transferencia recibida de usuario ${req.user.id}`,
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        success: true,
        message: "Transferencia realizada correctamente.",
      });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/wallet/transactions
// ============================================================
exports.getTransactionHistory = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({
      where: { userId: req.user.id },
    });

    if (!wallet)
      return res
        .status(404)
        .json({ success: false, message: "Cartera no encontrada." });

    const { limit = 20, offset = 0, type, status } = req.query;

    const where = { walletId: wallet.id };
    if (type) where.type = type;
    if (status) where.status = status;

    const result = await Transaction.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        count: result.count,
        transactions: result.rows,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/wallet/balance
// ============================================================
exports.getBalance = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({
      where: { userId: req.user.id },
      attributes: ["id", "balance", "currency", "createdAt", "updatedAt"],
    });

    if (!wallet)
      return res
        .status(404)
        .json({ success: false, message: "Cartera no encontrada." });

    res.json({
      success: true,
      data: {
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ========================== PSE/ePayco =======================
// ============================================================

// GET /api/wallet/pse/banks
exports.getPseBanks = async (req, res, next) => {
  try {
    const banks = await paymentService.getBanks();
    res.json({
      success: true,
      data: { banks }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/pse/init
exports.initPsePayment = async (req, res, next) => {
  try {
    const data = await paymentService.createPseTransaction({
      userId: req.user.id,
      amountCOP: req.body.amountCOP,
      bankCode: req.body.bankCode,
      personType: req.body.personType,
      documentType: req.body.documentType,
      documentNumber: req.body.documentNumber,
      email: req.body.email,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      data: { transaction: data.transaction }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/pse/callback
exports.handlePseCallback = async (req, res, next) => {
  try {
    const signatureHeader = req.get('X-PSE-Signature') || req.get('x-pse-signature');
    const secret = process.env.PSE_SECRET_KEY || 'test_secret_key_67890';

    if (signatureHeader) {
      const payload = JSON.stringify(req.body || {});
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      if (signatureHeader !== expected) {
        return res.status(401).json({ success: false, message: 'Invalid signature.' });
      }
    }

    const reference =
      req.body.reference ||
      req.body.paymentReference ||
      req.query.reference;

    const status = req.body.status || req.query.status;

    if (!reference || !status) {
      return res.status(400).json({
        success: false,
        message: "Referencia o estado faltante.",
      });
    }

    const result = await paymentService.processPseCallback(
      reference,
      status,
      req.body.authorizationCode
    );

    res.json({
      success: true,
      data: { result }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/wallet/pse/status/:reference
exports.getPseStatus = async (req, res, next) => {
  try {
    const result = await paymentService.getTransactionStatus(
      req.params.reference
    );

    if (!result.success) {
      return res
        .status(404)
        .json({ success: false, message: "Transacción no encontrada." });
    }

    res.json({
      success: true,
      data: { transaction: result.transaction }
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/wallet/epayco/confirmation 
// ============================================================
exports.handleEpaycoConfirmation = async (req, res, next) => {
  try {
    console.log("Recibida confirmación ePayco:", req.body); // Log para debugging
    // No aplicamos protect middleware ni validadores de express-validator aquí
    // La validación principal es la verificación de firma dentro del servicio

    // Opcional: Verificar firma aquí también si lo deseas antes de pasar al servicio
    // const isValid = await verifyEpaycoSignature(req.body, req.headers);
    // if (!isValid) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature.' });
    // }

    const result = await paymentService.processEpaycoConfirmation(req); // Pasa todo req

    // ePayco espera una respuesta específica en el webhook, generalmente un 200 OK
    if (result.success) {
        res.status(200).send('OK'); // o res.json({ status: 'success' }); según lo que ePayco espere
    } else {
        // Si el servicio reporta un error (aunque sea de lógica no crítica), a veces se responde 200 igual
        // para que ePayco no re-intente la notificación innecesariamente, pero loguea el error.
        console.error("Error procesando confirmación ePayco:", result.message);
        res.status(200).send('OK'); // o un mensaje específico
    }
  } catch (err) {
    console.error("Error interno manejando confirmación ePayco:", err);
    // No devuelvas el error detallado al cliente externo (ePayco)
    res.status(500).send('Error interno');
  }
};

// POST /api/wallet/pse/expire
exports.expireTransactions = async (req, res, next) => {
  try {
    const count = await paymentService.expireOldTransactions();
    res.json({
      success: true,
      data: { expired: count }
    });
  } catch (err) {
    next(err);
  }
};

//Endpoint para iniciar el pago ePayco
exports.initEpaycoPayment = async (req, res, next) => {
  try {
    // Llama a la nueva función que maneja DB y API
    const response = await paymentService.createEpaycoTransaction({
      userId: req.user.id,
      amountCOP: req.body.amountCOP,
      email: req.body.email,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Devuelve la respuesta del servicio, que ahora incluye bankUrl u otros datos
    res.json({
      success: true,
      data: response // response debe contener { success: true, reference, amountCOP, amountQZ, bankUrl? }
    });

  } catch (err) {
    next(err); // Manejar errores con el middleware de Express
  }
};

// ============================================================
// POST /api/wallet/withdraw
// Retirar Quetzales (QZ → COP)
// ============================================================
exports.withdraw = async (req, res, next) => {
  try {
    // Validaciones desde express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { amountQZ, bankName, accountType, accountNumber, accountHolder } = req.body;

    if (!amountQZ || isNaN(amountQZ) || amountQZ <= 0) {
      return res.status(400).json({
        success: false,
        message: "El monto a retirar debe ser mayor a 0.",
      });
    }

    // 1. Buscar wallet
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet)
      return res.status(404).json({
        success: false,
        message: "Cartera no encontrada.",
      });

    // 2. Validar saldo
    if (parseFloat(wallet.balance) < parseFloat(amountQZ))
      return res.status(400).json({
        success: false,
        message: "Saldo insuficiente para realizar el retiro.",
      });

    // 3. Conversion QZ → COP
    const amountCOP = amountQZ * QZ_TO_COP;

    // 4. Realizar descuento y guardar transacción
    const t = await sequelize.transaction();

    try {
      // Descontar del saldo
      const newBalance = parseFloat(wallet.balance) - parseFloat(amountQZ);

      await wallet.update(
        { balance: newBalance.toFixed(2) },
        { transaction: t }
      );

      const tx = await Transaction.create(
        {
          userId: req.user.id,
          walletId: wallet.id,
          type: "withdraw",
          paymentMethod: "bank_transfer",
          status: "pending",              // Pendiente hasta que lo proceses manualmente
          amount: parseFloat(amountQZ),   // Guardas QZ
          amountCOP: parseFloat(amountCOP.toFixed(2)), // Guardas COP si quieres
          description: `Retiro a banco ${bankName} - Cuenta ${accountNumber}`,
          metadata: {
            bankName,
            accountType,
            accountNumber,
            accountHolder,
          },
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        success: true,
        message: "Solicitud de retiro creada correctamente.",
        data: {
          transaction: tx,
          newBalance: newBalance.toFixed(2),
        }
      });

    } catch (err) {
      await t.rollback();
      throw err;
    }

  } catch (err) {
    next(err);
  }
};