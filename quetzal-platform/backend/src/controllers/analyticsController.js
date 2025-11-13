// ============================================
// ANALYTICS CONTROLLER - Controlador de Analytics
// ============================================

const { validationResult } = require('express-validator');
const { Analytics, User } = require('../models');

// @desc    Obtener todas las métricas de analytics
// @route   GET /api/analytics
// @access  Private (solo admins)
exports.getAnalytics = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, action, entityType, userId, dateFrom, dateTo } = req.query;

    const whereClause = {};
    if (action) whereClause.action = action;
    if (entityType) whereClause.entity_type = entityType;
    if (userId) whereClause.user_id = userId;
    if (dateFrom) whereClause.created_at = { [require('sequelize').Op.gte]: new Date(dateFrom) };
    if (dateTo) {
      whereClause.created_at = whereClause.created_at || {};
      whereClause.created_at[require('sequelize').Op.lte] = new Date(dateTo);
    }

    const analytics = await Analytics.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: analytics.count,
      pages: Math.ceil(analytics.count / parseInt(limit)),
       analytics: analytics.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear una nueva métrica de analytics
// @route   POST /api/analytics
// @access  Private (usuarios autenticados o admins)
exports.createAnalytics = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { action, entityType, entityId, metadata, ipAddress, userAgent } = req.body;

    const analytics = await Analytics.create({
      userId: req.user.id, // O null si es una acción anónima
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Métrica de analytics creada exitosamente.',
       analytics
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una métrica de analytics por ID
// @route   GET /api/analytics/:id
// @access  Private (solo admins)
exports.getAnalyticsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const analytics = await Analytics.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Métrica de analytics no encontrada.'
      });
    }

    res.json({
      success: true,
       analytics
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una métrica de analytics
// @route   PUT /api/analytics/:id
// @access  Private (solo admins)
exports.updateAnalytics = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { action, entityType, entityId, metadata } = req.body;

    const analytics = await Analytics.findByPk(id);
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Métrica de analytics no encontrada.'
      });
    }

    await analytics.update({ action, entityType, entityId, metadata });

    res.json({
      success: true,
      message: 'Métrica de analytics actualizada exitosamente.',
       analytics
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una métrica de analytics
// @route   DELETE /api/analytics/:id
// @access  Private (solo admins)
exports.deleteAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const analytics = await Analytics.findByPk(id);
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Métrica de analytics no encontrada.'
      });
    }

    await analytics.destroy();

    res.json({
      success: true,
      message: 'Métrica de analytics eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener métricas de analytics por usuario
// @route   GET /api/users/:userId/analytics
// @access  Private (solo admins o el propio usuario)
exports.getAnalyticsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, action, entityType, dateFrom, dateTo } = req.query;

    // Verificar permisos
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver las métricas de este usuario.'
      });
    }

    const whereClause = { user_id: userId };
    if (action) whereClause.action = action;
    if (entityType) whereClause.entity_type = entityType;
    if (dateFrom) whereClause.created_at = { [require('sequelize').Op.gte]: new Date(dateFrom) };
    if (dateTo) {
      whereClause.created_at = whereClause.created_at || {};
      whereClause.created_at[require('sequelize').Op.lte] = new Date(dateTo);
    }

    const analytics = await Analytics.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: analytics.count,
      pages: Math.ceil(analytics.count / parseInt(limit)),
       analytics: analytics.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener métricas de analytics por acción
// @route   GET /api/analytics/action/:actionName
// @access  Private (solo admins)
exports.getAnalyticsByAction = async (req, res, next) => {
  try {
    const { actionName } = req.params;
    const { page = 1, limit = 10, userId, dateFrom, dateTo } = req.query;

    const whereClause = { action: actionName };
    if (userId) whereClause.user_id = userId;
    if (dateFrom) whereClause.created_at = { [require('sequelize').Op.gte]: new Date(dateFrom) };
    if (dateTo) {
      whereClause.created_at = whereClause.created_at || {};
      whereClause.created_at[require('sequelize').Op.lte] = new Date(dateTo);
    }

    const analytics = await Analytics.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: analytics.count,
      pages: Math.ceil(analytics.count / parseInt(limit)),
       analytics: analytics.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener métricas de analytics por entidad
// @route   GET /api/analytics/entity/:entityType/:entityId
// @access  Private (solo admins)
exports.getAnalyticsByEntity = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 10, userId, dateFrom, dateTo } = req.query;

    const whereClause = { entity_type: entityType, entity_id: entityId };
    if (userId) whereClause.user_id = userId;
    if (dateFrom) whereClause.created_at = { [require('sequelize').Op.gte]: new Date(dateFrom) };
    if (dateTo) {
      whereClause.created_at = whereClause.created_at || {};
      whereClause.created_at[require('sequelize').Op.lte] = new Date(dateTo);
    }

    const analytics = await Analytics.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: analytics.count,
      pages: Math.ceil(analytics.count / parseInt(limit)),
       analytics: analytics.rows
    });

  } catch (error) {
    next(error);
  }
};

module.exports = Analytics;