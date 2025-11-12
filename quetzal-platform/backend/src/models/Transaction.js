// ============================================
// TRANSACTION MODEL - Transacciones PSE
// ============================================
// Modelo para manejar transacciones de recarga PSE
// Estados: pending, processing, approved, rejected, failed, expired

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    // Tipo de transacción: topup, withdraw, transfer, etc.
    type: {
      type: DataTypes.ENUM('topup', 'withdraw', 'transfer', 'escrow_fund', 'escrow_release', 'escrow_refund'),
      allowNull: false,
      defaultValue: 'topup'
    },
    // Método de pago: PSE, credit_card, bank_transfer, etc.
    paymentMethod: {
      type: DataTypes.ENUM('pse', 'credit_card', 'bank_transfer', 'wallet'),
      allowNull: false,
      defaultValue: 'pse'
    },
    // Estado de la transacción
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'approved', 'rejected', 'failed', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    // Monto en pesos colombianos (COP)
    amountCOP: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Monto en Quetzales
    amountQZ: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Tasa de conversión al momento de la transacción
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'COP por cada 1 QZ (ej: 10000)'
    },
    // === Datos específicos de PSE ===
    // ID de transacción en PSE
    pseTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    // Banco seleccionado
    bankCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Tipo de persona: natural o juridica
    personType: {
      type: DataTypes.ENUM('natural', 'juridica'),
      allowNull: true
    },
    // Documento del usuario
    documentType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    documentNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // URL de redirección del banco
    bankUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Código de autorización del banco
    authorizationCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Referencia de pago
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Descripción de la transacción
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Mensaje de error si falla
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // IP del usuario
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // User agent
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Fecha de expiración
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Fecha de aprobación
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Metadata adicional (JSON)
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'Transactions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['pseTransactionId'] },
      { fields: ['createdAt'] },
      { fields: ['type', 'status'] }
    ]
  });

module.exports = Transaction;

