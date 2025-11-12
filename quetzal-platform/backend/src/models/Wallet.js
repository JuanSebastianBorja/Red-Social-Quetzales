// ============================================
// WALLET.JS - Modelo de Wallets
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    unique: true,
    validate: {
      notEmpty: { msg: 'El ID de usuario es obligatorio' },
      isUUID: { args: 4, msg: 'El ID de usuario debe ser un UUID válido' }
    }
  },

  balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      isDecimal: { msg: 'El saldo debe ser un número decimal' },
      min: { args: [0], msg: 'El saldo no puede ser negativo' }
    }
  },

  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'QUETZALES',
    validate: {
      notEmpty: { msg: 'La moneda es obligatoria' }
    }
  },

  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },

  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'wallets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['currency'] }
  ]
});

// MÉTODOS PERSONALIZADOS

// Obtener balance actual
Wallet.prototype.getBalance = function () {
  return parseFloat(this.balance);
};

// Actualizar balance de forma segura
Wallet.prototype.updateBalance = async function (amount, transaction = null) {
  const newBalance = parseFloat(this.balance) + parseFloat(amount);

  if (newBalance < 0) {
    throw new Error('El saldo no puede ser negativo.');
  }

  this.balance = newBalance;
  await this.save({ transaction });
  return this;
};

// Reiniciar wallet (uso administrativo o pruebas)
Wallet.prototype.resetWallet = async function (transaction = null) {
  this.balance = 0.0;
  await this.save({ transaction });
  return this;
};

// Buscar wallet por usuario
Wallet.findByUser = async function (userId) {
  return await this.findOne({
    where: { userId },
    include: [{ model: Transaction, as: 'transactions' }]
  });
};

module.exports = Wallet;
