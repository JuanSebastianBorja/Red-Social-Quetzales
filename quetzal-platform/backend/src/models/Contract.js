// ============================================
// CONTRACT MODEL - Contratación de Servicios
// ============================================
// Modelo para manejar la contratación y seguimiento de servicios
// Estados: pending, paid, in_progress, delivered, completed, disputed, cancelled

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Identificador único del contrato
  contractNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'contract_number',
    comment: 'Número único del contrato (ej: CTR-2025-001234)'
  },
  
  // Relaciones
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_id',
    references: {
      model: 'services',
      key: 'id'
    },
    comment: 'Servicio contratado'
  },
  
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'buyer_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Cliente que contrata el servicio'
  },
  
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'seller_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Proveedor del servicio'
  },
  
  escrowId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'escrow_id',
    references: {
      model: 'escrow_accounts',
      key: 'id'
    },
    comment: 'Cuenta escrow asociada al contrato'
  },
  
  // Estado del contrato
  status: {
    type: DataTypes.ENUM(
      'pending',      // Creado, esperando pago
      'paid',         // Pagado, escrow activo
      'in_progress',  // Vendedor trabajando
      'delivered',    // Vendedor entregó trabajo
      'completed',    // Comprador confirmó y liberó fondos
      'disputed',     // En disputa
      'cancelled'     // Cancelado antes de pago
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  
  // Detalles del contrato
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Título del servicio contratado (copia del servicio)'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del trabajo solicitado'
  },
  
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Requisitos específicos del cliente'
  },
  
  // Precios y comisiones
  servicePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'service_price',
    comment: 'Precio del servicio en Quetzales'
  },
  
  platformFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'platform_fee',
    comment: 'Comisión de la plataforma'
  },
  
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount',
    comment: 'Monto total (servicio + comisión)'
  },
  
  // Tiempos
  deliveryDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'delivery_days',
    comment: 'Días de entrega acordados'
  },
  
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'started_at',
    comment: 'Fecha en que el vendedor comenzó a trabajar'
  },
  
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at',
    comment: 'Fecha en que el vendedor entregó el trabajo'
  },
  
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at',
    comment: 'Fecha en que el comprador confirmó y aceptó'
  },
  
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha límite de entrega'
  },
  
  // Archivos y entregables
  deliveryFiles: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'delivery_files',
    comment: 'URLs de archivos entregados por el vendedor'
  },
  
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Archivos adjuntos del comprador (briefing, referencias)'
  },
  
  // Revisiones y modificaciones
  revisions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de revisiones solicitadas'
  },
  
  maxRevisions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    field: 'max_revisions',
    comment: 'Máximo de revisiones permitidas'
  },
  
  // Comunicación
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'conversation_id',
    references: {
      model: 'conversations',
      key: 'id'
    },
    comment: 'Conversación asociada al contrato'
  },
  
  // Calificación
  ratingId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'rating_id',
    references: {
      model: 'ratings',
      key: 'id'
    },
    comment: 'Calificación del servicio'
  },
  
  // Notas y observaciones
  buyerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'buyer_notes',
    comment: 'Notas privadas del comprador'
  },
  
  sellerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'seller_notes',
    comment: 'Notas privadas del vendedor'
  },
  
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'admin_notes',
    comment: 'Notas del administrador (en caso de disputa)'
  },
  
  // Razón de cancelación o disputa
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancellation_reason'
  },
  
  disputeReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'dispute_reason'
  },
  
  // Metadata adicional
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Datos adicionales flexibles'
  }
}, {
  tableName: 'contracts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['contract_number'], unique: true },
    { fields: ['service_id'] },
    { fields: ['buyer_id'] },
    { fields: ['seller_id'] },
    { fields: ['status'] },
    { fields: ['escrow_id'] },
    { fields: ['created_at'] },
    { fields: ['buyer_id', 'status'] },
    { fields: ['seller_id', 'status'] }
  ]
});

module.exports = Contract;
