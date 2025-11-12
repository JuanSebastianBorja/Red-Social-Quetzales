// ============================================
// CONVERSATION.JS - Modelo de Conversaciones
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define(
  'Conversation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user1Id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user1_id',
      validate: {
        notEmpty: { msg: 'El usuario 1 es obligatorio.' },
      },
    },

    user2Id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user2_id',
      validate: {
        notEmpty: { msg: 'El usuario 2 es obligatorio.' },
      },
    },

    serviceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'service_id',
    },

    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_message_at',
    },

    lastMessagePreview: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'last_message_preview',
    },

    unreadCountUser1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'unread_count_user1',
      validate: {
        min: 0,
      },
    },

    unreadCountUser2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'unread_count_user2',
      validate: {
        min: 0,
      },
    },

    status: {
      type: DataTypes.ENUM('active', 'archived', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: {
          args: [['active', 'archived', 'blocked']],
          msg: 'El estado debe ser "active", "archived" o "blocked".',
        },
      },
    },
  },
  {
    tableName: 'Conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user1_id'] },
      { fields: ['user2_id'] },
      { fields: ['service_id'] },
      { fields: ['last_message_at'] },
    ],
  }
);

// Métodos estáticos 

// Buscar una conversación entre dos usuarios (sin importar el orden)
Conversation.findBetweenUsers = async function (userAId, userBId, serviceId = null) {
  const [minId, maxId] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  return await this.findOne({
    where: {
      user1Id: minId,
      user2Id: maxId,
      serviceId,
    },
  });
};

// Crear conversación entre usuarios si no existe
Conversation.createIfNotExists = async function (userAId, userBId, serviceId = null) {
  const existing = await this.findBetweenUsers(userAId, userBId, serviceId);
  if (existing) return existing;

  const [minId, maxId] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  return await this.create({ user1Id: minId, user2Id: maxId, serviceId });
};

// Actualizar previsualización del último mensaje
Conversation.prototype.updateLastMessage = async function (message) {
  const preview =
    message.length > 50 ? message.substring(0, 50) + '…' : message;

  this.lastMessageAt = new Date();
  this.lastMessagePreview = preview;
  await this.save();
};

// Marcar todos los mensajes como leídos para un usuario
Conversation.prototype.markAsRead = async function (userId) {
  if (userId === this.user1Id) this.unreadCountUser1 = 0;
  if (userId === this.user2Id) this.unreadCountUser2 = 0;
  await this.save();
};

module.exports = Conversation;