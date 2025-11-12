// ============================================
// MESSAGE MODEL - Mensajes de Chat
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id',
    references: {
      model: 'Conversations',
      key: 'id'
    }
  },

  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El mensaje no puede estar vacío' },
      len: {
        args: [1, 5000],
        msg: 'El mensaje debe tener entre 1 y 5000 caracteres'
      }
    }
  },

  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system'),
    allowNull: false,
    defaultValue: 'text',
    field: 'message_type'
  },

  attachments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },

  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  },

  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },

  isEdited: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_edited'
  },

  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at'
  },

  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_deleted'
  },

  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'Messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['conversation_id'] },
    { fields: ['sender_id'] },
    { fields: ['created_at'] },
    { fields: ['is_read'] }
  ]
});

// Método para marcar como leído
Message.prototype.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

module.exports = Message;
