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
    comment: 'Número único del contrato (ej: CTR-2025-001234)'
  },
  
  // Relaciones
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id'
    },
    comment: 'Servicio contratado'
  },
  
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Cliente que contrata el servicio'
  },
  
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Proveedor del servicio'
  },
  
  escrowId: {
    type: DataTypes.UUID,
    allowNull: true,
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
    comment: 'Precio del servicio en Quetzales'
  },
  
  platformFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Comisión de la plataforma'
  },
  
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Monto total (servicio + comisión)'
  },
  
  // Tiempos
  deliveryDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Días de entrega acordados'
  },
  
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que el vendedor comenzó a trabajar'
  },
  
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que el vendedor entregó el trabajo'
  },
  
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
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
    comment: 'Máximo de revisiones permitidas'
  },
  
  // Comunicación
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Conversations',
      key: 'id'
    },
    comment: 'Conversación asociada al contrato'
  },
  
  // Calificación
  ratingId: {
    type: DataTypes.UUID,
    allowNull: true,
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
    comment: 'Notas privadas del comprador'
  },
  
  sellerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas privadas del vendedor'
  },
  
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas del administrador (en caso de disputa)'
  },
  
  // Razón de cancelación o disputa
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  disputeReason: {
    type: DataTypes.TEXT,
    allowNull: true
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
  indexes: [
    { fields: ['contractNumber'], unique: true },
    { fields: ['serviceId'] },
    { fields: ['buyerId'] },
    { fields: ['sellerId'] },
    { fields: ['status'] },
    { fields: ['escrowId'] },
    { fields: ['createdAt'] },
    { fields: ['buyerId', 'status'] },
    { fields: ['sellerId', 'status'] }
  ]
});

module.exports = Contract;
