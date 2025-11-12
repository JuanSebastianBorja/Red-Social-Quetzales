// ============================================
// NOTIFICATIONPREFERENCE.JS - Modelo de Preferencias de Notificación
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  emailTransactions: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'email_transactions'
  },
  emailMessages: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'email_messages'
  },
  emailServices: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_services'
  },
  emailMarketing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_marketing'
  },
  pushEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'push_enabled'
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
  tableName: 'notification_preferences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// MÉTODOS ESTÁTICOS 

// Obtener las preferencias de un usuario (crea por defecto si no existen)
NotificationPreference.getOrCreateForUser = async function (userId) {
  let prefs = await this.findOne({ where: { userId } });
  if (!prefs) {
    prefs = await this.create({ userId });
  }
  return prefs;
};

// Actualizar las preferencias del usuario
NotificationPreference.updatePreferences = async function (userId, updates) {
  const prefs = await this.getOrCreateForUser(userId);
  return await prefs.update(updates);
};

module.exports = NotificationPreference;