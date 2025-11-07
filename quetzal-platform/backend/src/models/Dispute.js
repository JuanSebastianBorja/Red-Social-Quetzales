// ============================================
// DISPUTE.JS - Modelo de Disputas
// ============================================

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Dispute = sequelize.define('Dispute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  escrowId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'escrow_id',
    references: {
      model: 'escrow_accounts',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  complainantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'complainant_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  respondentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'respondent_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El motivo de la disputa es obligatorio.' }
    }
  },
  evidenceUrls: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    field: 'evidence_urls'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'open',
    validate: {
      isIn: [['open', 'in_review', 'resolved', 'dismissed']]
    }
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'resolved_by',
    references: {
      model: 'admin_users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at'
  }
}, {
  tableName: 'disputes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'idx_disputes_escrow_id', fields: ['escrow_id'] },
    { name: 'idx_disputes_complainant_id', fields: ['complainant_id'] },
    { name: 'idx_disputes_respondent_id', fields: ['respondent_id'] },
    { name: 'idx_disputes_status', fields: ['status'] },
    { name: 'idx_disputes_created_at', fields: ['created_at'] }
  ]
});

// MÉTODOS DE INSTANCIA / CLASE
Dispute.prototype.changeStatus = async function (newStatus, resolution = null, adminId = null) {
  const validStatuses = ['open', 'in_review', 'resolved', 'dismissed'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Estado inválido: ${newStatus}`);
  }

  this.status = newStatus;
  if (resolution) this.resolution = resolution;
  if (adminId) this.resolvedBy = adminId;
  if (['resolved', 'dismissed'].includes(newStatus)) {
    this.resolvedAt = new Date();
  }

  await this.save();
  return this;
};

// Buscar disputas por usuario
Dispute.findByUser = async function (userId) {
  return await this.findAll({
    where: {
      [Op.or]: [
        { complainantId: userId },
        { respondentId: userId }
      ]
    },
    include: [
      { model: EscrowAccount, as: 'escrow' },
      { model: User, as: 'complainant', attributes: ['id', 'full_name', 'email'] },
      { model: User, as: 'respondent', attributes: ['id', 'full_name', 'email'] }
    ],
    order: [['created_at', 'DESC']]
  });
};

// Buscar disputas abiertas o en revisión
Dispute.findActive = async function () {
  return await this.findAll({
    where: { status: ['open', 'in_review'] },
    include: [{ model: EscrowAccount, as: 'escrow' }]
  });
};

module.exports = Dispute;