// ============================================
// MESSAGE.JS - Modelo de Mensajes de Conversación
// ============================================

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id',
    references: { model: 'conversations', key: 'id' },
    onDelete: 'CASCADE'
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: { msg: 'El mensaje no puede estar vacío.' } }
  },
  messageType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'text',
    field: 'message_type',
    validate: {
      isIn: { args: [['text', 'offer', 'file', 'system']], msg: 'Tipo de mensaje inválido.' }
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    { fields: ['conversation_id'] },
    { fields: ['sender_id'] },
    { fields: ['created_at'] }
  ]
});

// Métodos estáticos
Message.getMessagesByConversation = async function (conversationId, limit = 50, offset = 0) {
  return this.findAll({
    where: { conversationId },
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

Message.markAsReadByUser = async function (conversationId, userId) {
  return this.update(
    { isRead: true, readAt: new Date() },
    { where: { conversationId, senderId: { [Op.ne]: userId }, isRead: false } }
  );
};

Message.createMessage = async function (data) {
  return this.create(data);
};

// Método de instancia
Message.prototype.isOwnedBy = function (userId) {
  return this.senderId === userId;
};

module.exports = Message;