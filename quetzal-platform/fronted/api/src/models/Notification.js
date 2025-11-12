// ============================================
// NOTIFICATION.JS - Modelo de Notificaciones
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: {
        args: [1, 50],
        msg: 'El tipo de notificación no puede estar vacío ni superar los 50 caracteres.',
      },
    },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El título de la notificación no puede estar vacío.',
      },
      len: {
        args: [1, 255],
        msg: 'El título debe tener entre 1 y 255 caracteres.',
      },
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El mensaje de la notificación no puede estar vacío.',
      },
    },
  },
  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reference_id',
    comment: 'Referencia opcional a otra entidad (mensaje, servicio, transacción, etc.)',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  actionUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'action_url',
    validate: {
      isUrl: {
        msg: 'El campo action_url debe ser una URL válida.',
      },
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
}, {
  tableName: 'notifications',
  timestamps: false, 
  underscored: true, 
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['created_at'] },
  ],
});

// MÉTODOS PERSONALIZADOS

// Marcar una notificación como leída
Notification.prototype.markAsRead = async function () {
  this.isRead = true;
  await this.save();
};

// Crear una notificación rápida
Notification.createForUser = async (userId, type, title, message, referenceId = null, actionUrl = null) => {
  return await Notification.create({
    userId,
    type,
    title,
    message,
    referenceId,
    actionUrl,
  });
};

module.exports = Notification;