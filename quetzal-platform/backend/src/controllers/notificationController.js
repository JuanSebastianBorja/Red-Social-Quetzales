// ============================================
// NOTIFICATION CONTROLLER - Controlador de Notificaciones
// ============================================

const { validationResult } = require('express-validator');
const { Notification, User } = require('../models');

// @desc    Obtener todas las notificaciones de un usuario
// @route   GET /api/notifications
// @access  Private (solo usuarios autenticados)
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, isRead, sortBy = 'createdAt' } = req.query;

    const whereClause = { userId: req.user.id };
    if (type) whereClause.type = type;
    if (isRead !== undefined) whereClause.is_read = isRead === 'true';

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'avatar']
        }
      ],
      order: [[sortBy, 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: notifications.count,
      pages: Math.ceil(notifications.count / parseInt(limit)),
       notifications: notifications.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una notificación específica por ID
// @route   GET /api/notifications/:id
// @access  Private (solo el usuario dueño de la notificación)
exports.getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'avatar']
        }
      ]
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada.'
      });
    }

    // Verificar que el usuario sea el propietario
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta notificación.'
      });
    }

    res.json({
      success: true,
       notification
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear una nueva notificación
// @route   POST /api/notifications
// @access  Private (solo admins o usuarios con permiso)
exports.createNotification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId, type, title, message, referenceId, actionUrl } = req.body;

    // Verificar que el usuario exista
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      referenceId,
      actionUrl
    });

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente.',
       notification
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una notificación (marcar como leída, cambiar tipo, etc.)
// @route   PUT /api/notifications/:id
// @access  Private (solo el usuario dueño de la notificación)
exports.updateNotification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { type, title, message, isRead, actionUrl } = req.body;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada.'
      });
    }

    // Verificar que el usuario sea el propietario
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta notificación.'
      });
    }

    await notification.update({ type, title, message, isRead, actionUrl });

    res.json({
      success: true,
      message: 'Notificación actualizada exitosamente.',
       notification
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una notificación
// @route   DELETE /api/notifications/:id
// @access  Private (solo el usuario dueño de la notificación)
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada.'
      });
    }

    // Verificar que el usuario sea el propietario
    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta notificación.'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Marcar una notificación como leída
// @route   PUT /api/notifications/:id/read
// @access  Private (solo el usuario dueño de la notificación)
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada.'
      });
    }

    // Verificar que el usuario sea el propietario
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para marcar esta notificación como leída.'
      });
    }

    await notification.update({ isRead: true });

    res.json({
      success: true,
      message: 'Notificación marcada como leída.',
       notification
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Marcar todas las notificaciones como leídas
// @route   PUT /api/notifications/mark-all-read
// @access  Private (solo usuarios autenticados)
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones han sido marcadas como leídas.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener cantidad de notificaciones no leídas
// @route   GET /api/notifications/unread-count
// @access  Private (solo usuarios autenticados)
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({
      success: true,
       count
    });

  } catch (error) {
    next(error);
  }
};

module.exports = Notification;