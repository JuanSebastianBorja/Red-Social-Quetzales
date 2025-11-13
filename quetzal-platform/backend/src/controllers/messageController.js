// ============================================
// MESSAGE CONTROLLER - Controlador de Mensajes
// ============================================

const { validationResult } = require('express-validator');
const { Message, Conversation, User } = require('../models');
const { Op } = require('sequelize'); // 🔥 Importante: Agrega esta línea

// @desc    Enviar un mensaje en una conversación
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { conversationId, message, messageType = 'text' } = req.body;

    // Verificar que la conversación exista y que el usuario participe
    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        { model: User, as: 'user1', attributes: ['id'] },
        { model: User, as: 'user2', attributes: ['id'] }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada.'
      });
    }

    if (conversation.user1Id !== req.user.id && conversation.user2Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para enviar mensajes en esta conversación.'
      });
    }

    // Crear el mensaje
    const newMessage = await Message.create({
      conversationId, // ✅ Cambiado: conversationId
      senderId: req.user.id,
      message,
      messageType
    });

    // Actualizar la conversación con el nuevo mensaje
    await conversation.updateLastMessage(message);

    res.status(201).json({
      success: true,
       newMessage
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener mensajes de una conversación
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    // Verificar que la conversación exista y que el usuario participe
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada.'
      });
    }

    if (conversation.user1Id !== req.user.id && conversation.user2Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver los mensajes de esta conversación.'
      });
    }

    const whereClause = { conversationId };
    if (type) whereClause.messageType = type;

    const messages = await Message.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      count: messages.count,
      pages: Math.ceil(messages.count / parseInt(limit)), // ✅ Corregido: parseInt(limit)
       messages: messages.rows  // ✅ Corregido: data: messages.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Marcar mensajes como leídos
// @route   PUT /api/messages/read/:conversationId
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verificar que la conversación exista y que el usuario participe
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada.'
      });
    }

    if (conversation.user1Id !== req.user.id && conversation.user2Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para marcar mensajes como leídos en esta conversación.'
      });
    }

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId, // ✅ Corregido: conversationId
          senderId: { [Op.ne]: req.user.id }, // Solo mensajes del otro usuario
          isRead: false
        }
      }
    );

    // Actualizar contadores de mensajes no leídos
    if (conversation.user1Id === req.user.id) {
      conversation.unreadCountUser1 = 0;
    } else {
      conversation.unreadCountUser2 = 0;
    }
    await conversation.save();

    res.json({
      success: true,
      message: 'Mensajes marcados como leídos.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un mensaje
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id, {
      include: [
        {
          model: Conversation,
          as: 'conversation',
          include: [
            { model: User, as: 'user1' },
            { model: User, as: 'user2' }
          ]
        }
      ]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado.'
      });
    }

    // Verificar que el usuario sea el remitente
    if (message.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este mensaje.'
      });
    }

    // Verificar que la conversación pertenezca al usuario
    const conversation = message.conversation;
    if (conversation.user1Id !== req.user.id && conversation.user2Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este mensaje.'
      });
    }

    await message.destroy();

    res.json({
      success: true,
      message: 'Mensaje eliminado exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};