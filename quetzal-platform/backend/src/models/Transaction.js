// ============================================
// TRANSACTION.JS -
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Usuario dueño de la transacción
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },

    // Wallet asociada
    walletId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "wallet_id",
      references: { model: "wallets", key: "id" },
      onDelete: "SET NULL",
    },

    // ENUM EXACTO según PostgreSQL
    type: {
      type: DataTypes.ENUM(
        "purchase",
        "transfer_in",
        "transfer_out",
        "withdrawal",
        "payment",
        "refund",
        "deposit",
        "topup",
        "transfer"
      ),
      allowNull: false,
    },

    paymentMethod: {
      type: DataTypes.ENUM(
        "wallet",
        "epayco",
        "pse",
        "credit_card",
        "bank_transfer"
      ),
      allowNull: false,
      defaultValue: "wallet",
      field: "payment_method",
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "approved",
        "completed",
        "failed",
        "rejected",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    // Montos
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    amountCOP: {
      type: DataTypes.DECIMAL(12, 2),
      field: "amount_cop",
    },

    amountQZ: {
      type: DataTypes.DECIMAL(12, 2),
      field: "amount_qz",
    },

    exchangeRate: {
      type: DataTypes.DECIMAL(10, 2),
      field: "exchange_rate",
    },

    description: DataTypes.TEXT,

    referenceId: {
      type: DataTypes.UUID,
      field: "reference_id",
    },

    // Campos PSE / ePayco existentes en la tabla
    authorizationCode: {
      type: DataTypes.STRING,
      field: "authorization_code",
    },

    paymentReference: {
      type: DataTypes.STRING,
      field: "payment_reference",
      unique: true,
    },

    errorMessage: {
      type: DataTypes.TEXT,
      field: "error_message",
    },

    ipAddress: {
      type: DataTypes.STRING,
      field: "ip_address",
    },

    userAgent: {
      type: DataTypes.TEXT,
      field: "user_agent",
    },

    expiresAt: {
      type: DataTypes.DATE,
      field: "expires_at",
    },

    approvedAt: {
      type: DataTypes.DATE,
      field: "approved_at",
    },

    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },

    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    tableName: "transactions",
    timestamps: false,
    indexes: [
      { fields: ["wallet_id"] },
      { fields: ["user_id"] },
      { fields: ["type"] },
      { fields: ["status"] },
      { fields: ["created_at"] },
      { fields: ["reference_id"] },
      { fields: ["payment_reference"] },
      { fields: ["payment_method"] },
      { fields: ["expires_at"] },
      { fields: ["approved_at"] },
    ],
  }
);

// ======================
// Métodos Utilitarios
// ======================

Transaction.findByReference = function (reference) {
  return this.findOne({ where: { paymentReference: reference } });
};

Transaction.findPendingByUser = function (userId) {
  return this.findAll({
    where: { userId, status: "pending" },
    order: [["created_at", "DESC"]],
  });
};

module.exports = Transaction;
