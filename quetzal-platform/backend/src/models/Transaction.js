// ============================================
// TRANSACTION.JS - Modelo de Transacciones
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  walletId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'wallet_id',
    references: {
      model: 'wallets',
      key: 'id'
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    validate: {
      notEmpty: { msg: 'El ID de la wallet es obligatorio' },
      isUUID: { args: 4, msg: 'El ID de la wallet debe ser un UUID válido' }
    }
  },
  type: {
    type: DataTypes.ENUM(
      'purchase',
      'transfer_in',
      'transfer_out',
      'withdrawal',
      'payment',
      'refund',
      'deposit'
    ),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El tipo de transacción es obligatorio' }
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El monto debe ser un número decimal' },
      min: { args: [0.01], msg: 'El monto debe ser mayor que cero' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reference_id'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    allowNull: false,
    defaultValue: 'completed'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'transactions',
  timestamps: false,
  indexes: [
    { fields: ['wallet_id'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['reference_id'] }
  ]
});

// MÉTODOS PERSONALIZADOS

Transaction.createTransaction = async function (data, options = {}) {
  return await this.create(data, options);
};

Transaction.findByWallet = async function (walletId, limit = 20) {
  return await this.findAll({
    where: { walletId },
    order: [['created_at', 'DESC']],
    limit
  });
};

Transaction.findByReference = async function (referenceId) {
  return await this.findOne({ where: { referenceId } });
};

module.exports = Transaction;
