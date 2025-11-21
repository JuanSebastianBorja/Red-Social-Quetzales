// ============================================
// WALLET.JS - Modelo de Wallets (CORREGIDO)
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Transaction = require('./Transaction'); // <-- Agregado

const Wallet = sequelize.define(
  'Wallet',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      unique: true,
    },

    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'QUETZALES',
    },

    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'wallets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['currency'] },
    ],
  }
);

// ============================================
// MÉTODOS PERSONALIZADOS
// ============================================

Wallet.prototype.getBalance = function () {
  return parseFloat(this.balance);
};

Wallet.prototype.updateBalance = async function (amount, transaction = null) {
  const newBalance = parseFloat(this.balance) + parseFloat(amount);

  if (newBalance < 0) {
    throw new Error('El saldo no puede ser negativo.');
  }

  this.balance = newBalance.toFixed(2);
  await this.save({ transaction });
  return this;
};

Wallet.prototype.resetWallet = async function (transaction = null) {
  this.balance = 0.0;
  await this.save({ transaction });
  return this;
};

Wallet.findByUser = function (userId) {
  return this.findOne({
    where: { userId },
    include: [{ model: Transaction, as: 'transactions' }],
  });
};

module.exports = Wallet;
