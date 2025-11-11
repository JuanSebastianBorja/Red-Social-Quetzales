// ============================================
// ESCROW.JS - Modelo de Cuentas en Garantía (Escrow)
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EscrowAccount = sequelize.define('EscrowAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_id',
    references: {
      model: 'services',
      key: 'id'
    },
    onDelete: 'RESTRICT'
  },
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'buyer_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'RESTRICT'
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'seller_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'RESTRICT'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El monto debe ser un número decimal válido' },
      min: { args: [0.01], msg: 'El monto debe ser mayor que cero' }
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'funded', 'released', 'refunded', 'disputed']],
        msg: 'El estado no es válido'
      }
    }
  },
  fundedAt: {
    type: DataTypes.DATE,
    field: 'funded_at'
  },
  releaseDate: {
    type: DataTypes.DATE,
    field: 'release_date'
  },
  releasedAt: {
    type: DataTypes.DATE,
    field: 'released_at'
  },
  disputeReason: {
    type: DataTypes.TEXT,
    field: 'dispute_reason'
  }
}, {
  tableName: 'escrow_accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'idx_escrow_service_id', fields: ['service_id'] },
    { name: 'idx_escrow_buyer_id', fields: ['buyer_id'] },
    { name: 'idx_escrow_seller_id', fields: ['seller_id'] },
    { name: 'idx_escrow_status', fields: ['status'] }
  ]
});

// MÉTODOS DE INSTANCIA / CLASE

/**
 * Actualiza el estado del escrow de forma controlada
 * @param {string} newStatus - Nuevo estado ('funded', 'released', etc.)
 * @param {object|null} transaction - Transacción de Sequelize opcional
 */
EscrowAccount.prototype.updateStatus = async function (newStatus, transaction = null) {
  const validStatuses = ['pending', 'funded', 'released', 'refunded', 'disputed'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Estado no válido: ${newStatus}`);
  }

  this.status = newStatus;

  // Si se cambia a "funded" o "released", actualizamos las fechas
  if (newStatus === 'funded') {
    this.fundedAt = new Date();
  } else if (newStatus === 'released') {
    this.releasedAt = new Date();
  }

  await this.save({ transaction });
  return this;
};

// Busca una cuenta escrow por servicio y usuarios
EscrowAccount.findByParticipants = async function (serviceId, buyerId, sellerId) {
  return await this.findOne({
    where: { serviceId, buyerId, sellerId }
  });
};

module.exports = EscrowAccount;