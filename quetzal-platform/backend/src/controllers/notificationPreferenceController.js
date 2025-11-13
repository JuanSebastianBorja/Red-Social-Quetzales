// ============================================
// NOTIFICATIONPREFERENCE CONTROLLER - Controlador de Preferencias de Notificación
// ============================================

const { validationResult } = require('express-validator');
const { NotificationPreference, User } = require('../models');

// @desc    Obtener las preferencias de notificación del usuario autenticado
// @route   GET /api/notification-preferences
// @access  Private (solo usuarios autenticados)
exports.getNotificationPreferences = async (req, res, next) => {
  try {
    const preferences = await NotificationPreference.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferencias de notificación no encontradas.'
      });
    }

    res.json({
      success: true,
       preferences
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar las preferencias de notificación del usuario autenticado
// @route   PUT /api/notification-preferences
// @access  Private (solo usuarios autenticados)
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      emailTransactions,
      emailMessages,
      emailServices,
      emailMarketing,
      pushEnabled
    } = req.body;

    // Buscar o crear preferencias
    let preferences = await NotificationPreference.findOne({ where: { userId: req.user.id } });
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId: req.user.id });
    }

    await preferences.update({
      emailTransactions,
      emailMessages,
      emailServices,
      emailMarketing,
      pushEnabled
    });

    res.json({
      success: true,
      message: 'Preferencias de notificación actualizadas exitosamente.',
       preferences
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear preferencias de notificación para un usuario (uso administrativo)
// @route   POST /api/notification-preferences
// @access  Private (solo admins)
exports.createNotificationPreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId, emailTransactions, emailMessages, emailServices, emailMarketing, pushEnabled } = req.body;

    // Verificar que el usuario exista
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Verificar que no existan preferencias para este usuario
    const existingPrefs = await NotificationPreference.findOne({ where: { userId } });
    if (existingPrefs) {
      return res.status(400).json({
        success: false,
        message: 'Este usuario ya tiene preferencias de notificación.'
      });
    }

    const preferences = await NotificationPreference.create({
      userId,
      emailTransactions,
      emailMessages,
      emailServices,
      emailMarketing,
      pushEnabled
    });

    res.status(201).json({
      success: true,
      message: 'Preferencias de notificación creadas exitosamente.',
       preferences
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener preferencias de notificación por ID de usuario
// @route   GET /api/notification-preferences/:userId
// @access  Private (solo admins o el propio usuario)
exports.getNotificationPreferencesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario sea admin o el propietario
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver estas preferencias.'
      });
    }

    const preferences = await NotificationPreference.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferencias de notificación no encontradas.'
      });
    }

    res.json({
      success: true,
       preferences
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar preferencias de notificación de un usuario
// @route   DELETE /api/notification-preferences/:userId
// @access  Private (solo admins)
exports.deleteNotificationPreferences = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const preferences = await NotificationPreference.findOne({ where: { userId } });
    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferencias de notificación no encontradas.'
      });
    }

    await preferences.destroy();

    res.json({
      success: true,
      message: 'Preferencias de notificación eliminadas exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener si un usuario quiere recibir notificaciones por email
// @route   GET /api/notification-preferences/:userId/email-enabled
// @access  Private (solo admins o el propio usuario)
exports.getEmailNotificationsEnabled = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario sea admin o el propietario
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver estas preferencias.'
      });
    }

    const preferences = await NotificationPreference.findOne({
      where: { userId },
      attributes: ['id', 'emailTransactions', 'emailMessages', 'emailServices', 'emailMarketing']
    });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferencias de notificación no encontradas.'
      });
    }

    res.json({
      success: true,
       preferences
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener si un usuario quiere recibir notificaciones push
// @route   GET /api/notification-preferences/:userId/push-enabled
// @access  Private (solo admins o el propio usuario)
exports.getPushNotificationsEnabled = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario sea admin o el propietario
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver estas preferencias.'
      });
    }

    const preferences = await NotificationPreference.findOne({
      where: { userId },
      attributes: ['id', 'pushEnabled']
    });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferencias de notificación no encontradas.'
      });
    }

    res.json({
      success: true,
       pushEnabled: preferences.pushEnabled
    });

  } catch (error) {
    next(error);
  }
};

module.exports = NotificationPreference;