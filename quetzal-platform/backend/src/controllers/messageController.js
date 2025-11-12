// ============================================
// MESSAGE CONTROLLER - Controlador de Mensajería
// ============================================

const { sequelize, Conversation, Message, User, Service } = require('../models');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ============================================
// VALIDADORES
// ============================================

const sendMessageValidators = [
  body('content').trim().notEmpty().withMessage('El mensaje no puede estar vacío')
    .isLength({ max: 5000 }).withMessage('El mensaje es demasiado largo (máx 5000 caracteres)'),
  body('messageType').optional().isIn(['text', 'image', 'file', 'system']).withMessage('Tipo de mensaje inválido')
];

const createConversationValidators = [
  body('otherUserId').isUUID().withMessage('ID de usuario inválido'),
  body('serviceId').optional().isInt().withMessage('ID de servicio inválido')
];

// ============================================
// OBTENER MIS CONVERSACIONES
// ============================================

async function getMyConversations(req, res) {
  try {
    const userId = req.userId;
    const { status = 'active', page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    // Buscar conversaciones donde el usuario participa
    const where = {
      [Op.or]: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    };

    if (status) {
      where.status = status;
    }

    const { count, rows: conversations } = await Conversation.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'email', 'avatar', 'userType']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'email', 'avatar', 'userType']
        },
        {
          model: Service,
          as: 'conversationService',
          attributes: ['id', 'title', 'category', 'imageUrl'],
          required: false
        }
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Formatear conversaciones para incluir "otherUser" según perspectiva
    const formattedConversations = conversations.map(conv => {
      const isUser1 = conv.user1Id === userId;
      const otherUser = isUser1 ? conv.user2 : conv.user1;
      const unreadCount = isUser1 ? conv.unreadCountUser1 : conv.unreadCountUser2;

      return {
        id: conv.id,
        otherUser,
        service: conv.conversationService,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        unreadCount,
        status: conv.status,
        createdAt: conv.createdAt
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversaciones',
      error: error.message
    });
  }
}

// ============================================
// OBTENER MENSAJES DE UNA CONVERSACIÓN
// ============================================

async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const { page = 1, limit = 50 } = req.query;

    // Verificar que la conversación existe y el usuario tiene acceso
    const conversation = await Conversation.findByPk(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    // Verificar que el usuario es parte de la conversación
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    const offset = (page - 1) * limit;

    // Obtener mensajes
    const { count, rows: messages } = await Message.findAndCountAll({
      where: {
        conversationId,
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'avatar']
        }
      ],
      order: [['created_at', 'DESC']], // Más recientes primero
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Invertir para mostrar cronológicamente
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes',
      error: error.message
    });
  }
}

// ============================================
// ENVIAR MENSAJE
// ============================================

async function sendMessage(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { conversationId } = req.params;
    const { content, messageType = 'text', attachments = [] } = req.body;
    const senderId = req.userId;

    // Verificar que la conversación existe
    const conversation = await Conversation.findByPk(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    // Verificar que el usuario es parte de la conversación
    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    // Crear mensaje en transacción
    const message = await sequelize.transaction(async (t) => {
      // Crear mensaje
      const newMessage = await Message.create({
        conversationId,
        senderId,
        content,
        messageType,
        attachments,
        isRead: false
      }, { transaction: t });

      // Actualizar conversación
      await conversation.updateLastMessage(content);

      // Incrementar contador de no leídos del otro usuario
      if (senderId === conversation.user1Id) {
        conversation.unreadCountUser2 += 1;
      } else {
        conversation.unreadCountUser1 += 1;
      }
      await conversation.save({ transaction: t });

      return newMessage;
    });

    // Retornar mensaje con sender
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: messageWithSender
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje',
      error: error.message
    });
  }
}

// ============================================
// MARCAR CONVERSACIÓN COMO LEÍDA
// ============================================

async function markConversationAsRead(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findByPk(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    // Verificar acceso
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    await sequelize.transaction(async (t) => {
      // Marcar conversación como leída
      await conversation.markAsRead(userId);

      // Marcar todos los mensajes no leídos como leídos
      await Message.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            conversationId,
            senderId: { [Op.ne]: userId }, // No del usuario actual
            isRead: false
          },
          transaction: t
        }
      );
    });

    res.json({
      success: true,
      message: 'Conversación marcada como leída'
    });

  } catch (error) {
    console.error('Error marcando como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar como leída',
      error: error.message
    });
  }
}

// ============================================
// CREAR CONVERSACIÓN
// ============================================

async function createConversation(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { otherUserId, serviceId = null, initialMessage = null } = req.body;
    const userId = req.userId;

    // Verificar que no se intente crear conversación consigo mismo
    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes crear una conversación contigo mismo'
      });
    }

    // Verificar que el otro usuario existe
    const otherUser = await User.findByPk(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si ya existe una conversación
    let conversation = await Conversation.findBetweenUsers(userId, otherUserId, serviceId);

    if (conversation) {
      // Ya existe, retornarla
      const conversationWithUsers = await Conversation.findByPk(conversation.id, {
        include: [
          { model: User, as: 'user1', attributes: ['id', 'fullName', 'avatar'] },
          { model: User, as: 'user2', attributes: ['id', 'fullName', 'avatar'] },
          { model: Service, as: 'conversationService', attributes: ['id', 'title', 'imageUrl'], required: false }
        ]
      });

      return res.json({
        success: true,
        conversation: conversationWithUsers,
        isNew: false
      });
    }

    // Crear nueva conversación
    conversation = await Conversation.createIfNotExists(userId, otherUserId, serviceId);

    // Si hay mensaje inicial, enviarlo
    if (initialMessage) {
      await Message.create({
        conversationId: conversation.id,
        senderId: userId,
        content: initialMessage,
        messageType: 'text'
      });

      await conversation.updateLastMessage(initialMessage);
      
      // Incrementar contador de no leídos del otro usuario
      if (userId === conversation.user1Id) {
        conversation.unreadCountUser2 = 1;
      } else {
        conversation.unreadCountUser1 = 1;
      }
      await conversation.save();
    }

    // Retornar conversación con usuarios
    const conversationWithUsers = await Conversation.findByPk(conversation.id, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'fullName', 'avatar'] },
        { model: User, as: 'user2', attributes: ['id', 'fullName', 'avatar'] },
        { model: Service, as: 'conversationService', attributes: ['id', 'title', 'imageUrl'], required: false }
      ]
    });

    res.status(201).json({
      success: true,
      conversation: conversationWithUsers,
      isNew: true
    });

  } catch (error) {
    console.error('Error creando conversación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear conversación',
      error: error.message
    });
  }
}

// ============================================
// OBTENER CONVERSACIÓN POR ID
// ============================================

async function getConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'fullName', 'avatar', 'userType'] },
        { model: User, as: 'user2', attributes: ['id', 'fullName', 'avatar', 'userType'] },
        { model: Service, as: 'conversationService', required: false }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    // Verificar acceso
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    // Determinar el otro usuario
    const isUser1 = conversation.user1Id === userId;
    const otherUser = isUser1 ? conversation.user2 : conversation.user1;
    const unreadCount = isUser1 ? conversation.unreadCountUser1 : conversation.unreadCountUser2;

    res.json({
      success: true,
      conversation: {
        id: conversation.id,
        otherUser,
        service: conversation.conversationService,
        lastMessageAt: conversation.lastMessageAt,
        lastMessagePreview: conversation.lastMessagePreview,
        unreadCount,
        status: conversation.status,
        createdAt: conversation.createdAt
      }
    });

  } catch (error) {
    console.error('Error obteniendo conversación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversación',
      error: error.message
    });
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  getMyConversations,
  getConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
  createConversation,
  sendMessageValidators,
  createConversationValidators
};
