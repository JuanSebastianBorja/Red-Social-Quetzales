// ============================================
// CONVERSATION CONTROLLER - Controlador de Conversaciones
// ============================================

const { validationResult } = require('express-validator');
const { Conversation, User, Service, Message } = require('../models');

// @desc    Crear o obtener una conversación entre dos usuarios
// @route   POST /api/conversations
// @access  Private
exports.createConversation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { user2Id, serviceId } = req.body;

    // No puedes crear conversación contigo mismo
    if (req.user.id === user2Id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes crear una conversación contigo mismo.'
      });
    }

    // Verificar que el otro usuario exista
    const targetUser = await User.findByPk(user2Id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'El usuario destino no existe.'
      });
    }

    // Ordenar IDs para evitar duplicados (user1Id < user2Id)
    const [user1Id, user2IdSorted] = req.user.id < user2Id ? [req.user.id, user2Id] : [user2Id, req.user.id];

    // Buscar conversación existente
    let conversation = await Conversation.findOne({
      where: {
        user1Id,
        user2Id: user2IdSorted,
        serviceId: serviceId || null
      }
    });

    // Si no existe, crearla
    if (!conversation) {
      conversation = await Conversation.create({
        user1Id,
        user2Id: user2IdSorted,
        serviceId: serviceId || null
      });
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener conversaciones del usuario autenticado
// @route   GET /api/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = {
      [Op.or]: [
        { user1Id: req.user.id },
        { user2Id: req.user.id }
      ]
    };

    if (status) {
      whereClause.status = status;
    }

    const conversations = await Conversation.findAndCountAll({
      where: whereClause,
      order: [['lastMessageAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'avatar'],
          where: { id: { [Op.ne]: req.user.id } }, // Excluir al usuario actual
          required: false
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'avatar'],
          where: { id: { [Op.ne]: req.user.id } }, // Excluir al usuario actual
          required: false
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title']
        }
      ]
    });

    res.json({
      success: true,
      count: conversations.count,
      pages: Math.ceil(conversations.count / limit),
      data: conversations.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una conversación específica
// @route   GET /api/conversations/:id
// @access  Private
exports.getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title']
        },
        {
          model: Message,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName', 'avatar']
            }
          ],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada.'
      });
    }

    // Verificar que el usuario sea parte de la conversación
    if (conversation.user1Id !== req.user.id && conversation.user2Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta conversación.'
      });
    }

    res.json({
      success: true,
       conversation
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar estado de la conversación
// @route   PUT /api/conversations/:id
// @access  Private
exports.updateConversationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'archived', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido.'
      });
    }

    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada.'
      });
    }

    // Verificar que el usuario sea parte de la conversación
    if (conversation.user1Id !== req.user.id && conversation.user2Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta conversación.'
      });
    }

    await conversation.update({ status });

    res.json({
      success: true,
      message: 'Estado de la conversación actualizado.',
       conversation
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar conversación
// @route   DELETE /api/conversations/:id
// @access  Private
exports.deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada.'
      });
    }

    // Verificar que el usuario sea parte de la conversación
    if (conversation.user1Id !== req.user.id && conversation.user2Id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta conversación.'
      });
    }

    await conversation.destroy();

    res.json({
      success: true,
      message: 'Conversación eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};