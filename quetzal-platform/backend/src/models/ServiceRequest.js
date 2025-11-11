// ============================================
// SERVICEREQUEST.JS - Modelo de Solicitudes de Servicio
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServiceRequest = sequelize.define('ServiceRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_id',
    references: { model: 'services', key: 'id' },
    onDelete: 'CASCADE',
  },
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'buyer_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'seller_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  proposedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'proposed_price',
    validate: {
      isDecimal: { msg: 'El precio propuesto debe ser un número válido.' },
      min: { args: [0.01], msg: 'El precio propuesto debe ser mayor a 0.' },
    },
  },
  negotiatedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'negotiated_price',
    validate: {
      isDecimal: { msg: 'El precio negociado debe ser un número válido.' },
      min: { args: [0.01], msg: 'El precio negociado debe ser mayor a 0.' },
    },
  },
  counterOfferDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'counter_offer_details',
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  termsAgreed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'terms_agreed',
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'accepted',
      'rejected',
      'completed',
      'cancelled',
      'negotiating'
    ),
    defaultValue: 'pending',
    allowNull: false,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason',
  },
  negotiatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'negotiated_at',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'service_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'idx_service_requests_service_id', fields: ['service_id'] },
    { name: 'idx_service_requests_buyer_id', fields: ['buyer_id'] },
    { name: 'idx_service_requests_seller_id', fields: ['seller_id'] },
    { name: 'idx_service_requests_status', fields: ['status'] },
  ],
});

// MÉTODOS PERSONALIZADOS

// Crear nueva solicitud
ServiceRequest.createRequest = async function ({ serviceId, buyerId, sellerId, message, proposedPrice }) {
  return await this.create({
    serviceId,
    buyerId,
    sellerId,
    message: message?.trim() || null,
    proposedPrice,
    status: 'pending',
  });
};

// Cambiar estado de la solicitud
ServiceRequest.updateStatus = async function (id, status, reason = null) {
  const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'negotiating'];
  if (!validStatuses.includes(status)) {
    throw new Error('Estado no válido.');
  }

  const updateData = { status };
  if (status === 'rejected' && reason) updateData.rejectionReason = reason;

  return await this.update(updateData, { where: { id } });
};

// Obtener solicitudes por comprador o vendedor
ServiceRequest.getByUser = async function (userId, role = 'buyer') {
  const whereClause = role === 'seller' ? { sellerId: userId } : { buyerId: userId };
  return await this.findAll({
    where: whereClause,
    include: [{ model: Service, as: 'service', attributes: ['title', 'price', 'status'] }],
    order: [['createdAt', 'DESC']],
  });
};

module.exports = ServiceRequest;