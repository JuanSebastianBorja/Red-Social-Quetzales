// ============================================
// MESSAGE CONTROLLER - Controlador de Mensajes
// ============================================

const { validationResult, body, param } = require('express-validator');
const { Message, Conversation, User } = require('../models');
const { Op } = require('sequelize'); 

// Validadores para enviar un mensaje
exports.sendMessageValidators = [
  // Valida que el conversationId en la URL sea un UUID
  param('conversationId').isUUID(4).withMessage('ID de conversación inválido.'),
  // Valida el cuerpo del mensaje
  body('message').trim().notEmpty().withMessage('El mensaje no puede estar vacío.')
                 .isLength({ max: 1000 }).withMessage('El mensaje no debe superar los 1000 caracteres.'), // Ajusta el límite si es necesario
  // Valida opcionalmente el tipo de mensaje
  body('messageType').optional().isIn(['text', 'offer', 'file', 'system']).withMessage('Tipo de mensaje inválido.')
];

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



// Validadores para crear una conversación
exports.createConversationValidators = [
  body('recipientId')
    .isUUID(4) // Asumiendo que usas UUIDs para IDs de usuario
    .withMessage('ID de destinatario inválido.'),
  // Puedes añadir más validaciones si es necesario, por ejemplo, para un mensaje inicial
  body('initialMessage')
    .optional() // El mensaje inicial puede ser opcional
    .trim()
    .isLength({ min: 1, max: 500 }) // Longitud mínima/maxima del mensaje
    .withMessage('El mensaje inicial debe tener entre 1 y 500 caracteres.')
];

// 2. Controlador para crear conversación
exports.createConversation = async (req, res, next) => {
  try {
    const { recipientId, initialMessage } = req.body;
    const senderId = req.user.id; // Usuario autenticado

    // Validar que el destinatario exista
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Destinatario no encontrado.'
      });
    }

    // Verificar que no sea el mismo usuario
    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes iniciar una conversación contigo mismo.'
      });
    }

    // Verificar si ya existe una conversación entre estos dos usuarios
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1Id: senderId, user2Id: recipientId },
          { user1Id: recipientId, user2Id: senderId }
        ]
      }
    });

    if (conversation) {
      // Si la conversación ya existe, devolver un error o simplemente la conversación existente
      // return res.status(409).json({ success: false, message: 'Ya existe una conversación con este usuario.' });
      // O devolver la conversación existente
      return res.status(200).json({
        success: true,
         conversation
      });
    }

    // Crear la nueva conversación
    conversation = await Conversation.create({
      user1Id: senderId,
      user2Id: recipientId
    });

    // Opcional: Si se envía un mensaje inicial, créalo aquí
    if (initialMessage) {
      const message = await Message.create({
        conversationId: conversation.id,
        senderId,
        message: initialMessage,
        messageType: 'text' // o el tipo que corresponda
      });
      // Actualizar el último mensaje de la conversación
      await conversation.updateLastMessage(initialMessage);
    }

    res.status(201).json({
      success: true,
      message: 'Conversación creada exitosamente.',
       conversation
    });

  } catch (error) {
    console.error('Error creando conversación:', error);
    next(error);
  }
};

// 3. Controlador para obtener conversación específica (falta implementar si no lo tienes)
exports.getConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id; // Usuario autenticado

    // Buscar la conversación y verificar que el usuario participe
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'avatar'],
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'avatar'],
        },
        // Opcional: Incluir el último mensaje si es relevante para esta vista
        {
          model: Message,
          as: 'lastMessage',
          attributes: ['message', 'createdAt', 'isRead'],
          order: [['createdAt', 'DESC']],
          limit: 1
        }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada o no tienes permiso para verla.'
      });
    }

    res.json({
      success: true,
       conversation
    });

  } catch (error) {
    console.error('Error obteniendo conversación:', error);
    next(error);
  }
};

// 4. Controlador para marcar conversación como leída (falta implementar si no lo tienes)
exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id; // Usuario autenticado

    // Buscar la conversación y verificar que el usuario participe
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada.'
      });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para marcar esta conversación como leída.'
      });
    }

    // Actualizar mensajes no leídos para el usuario actual
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId }, // Solo mensajes del otro usuario
          isRead: false
        }
      }
    );

    // Actualizar contadores de mensajes no leídos en la conversación
    if (conversation.user1Id === userId) {
      conversation.unreadCountUser1 = 0;
    } else {
      conversation.unreadCountUser2 = 0;
    }
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversación marcada como leída.'
    });

  } catch (error) {
    console.error('Error marcando conversación como leída:', error);
    next(error);
  }
};

// @desc    Obtener mis conversaciones
// @route   GET /api/messages/conversations
// @access  Private
exports.getMyConversations = async (req, res, next) => {
  try {
    const userId = req.user.id; // El usuario autenticado

    // Buscar conversaciones donde el usuario es user1 o user2
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'avatar'], // Ajusta los campos que necesites
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'avatar'],
        },
        // Opcional: Incluir el último mensaje de cada conversación
        {
          model: Message,
          as: 'lastMessage', // Asumiendo una asociación 'lastMessage' o similar en el modelo Conversation
          attributes: ['message', 'createdAt', 'isRead'],
          order: [['createdAt', 'DESC']], // Trae el último mensaje
          limit: 1
        }
      ],
      order: [['updatedAt', 'DESC']], // O [['lastMessage', 'createdAt', 'DESC']] si incluyes el último mensaje
    });

    res.json({
      success: true,
       conversations
    });

  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    next(error); // Pasa el error al middleware de manejo de errores de Express
  }
};