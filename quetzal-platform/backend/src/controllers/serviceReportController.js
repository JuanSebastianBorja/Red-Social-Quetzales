// ============================================
// SERVICEREPORT CONTROLLER - Controlador de Reportes de Servicios
// ============================================

const { validationResult } = require('express-validator');
const { ServiceReport, User, Service, AdminUser } = require('../models');

// @desc    Obtener todos los reportes de servicios
// @route   GET /api/service-reports
// @access  Private (solo admins)
exports.getServiceReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt' } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;

    const reports = await ServiceReport.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'price'],
          include: [
            {
              model: User,
              as: 'provider',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        },
        {
          model: AdminUser,
          as: 'reviewer',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [[sortBy, 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: reports.count,
      pages: Math.ceil(reports.count / parseInt(limit)),
       reports: reports.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear un nuevo reporte de servicio
// @route   POST /api/service-reports
// @access  Private (solo usuarios autenticados)
exports.createServiceReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { serviceId, reason } = req.body;

    // Verificar que el servicio exista
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    // Verificar que el usuario no sea el proveedor del servicio
    if (service.userId === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No puedes reportar tu propio servicio.'
      });
    }

    // Verificar que no exista ya un reporte para este servicio por este usuario
    const existingReport = await ServiceReport.findOne({
      where: { serviceId, reporterId: req.user.id }
    });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'Ya has reportado este servicio.'
      });
    }

    const report = await ServiceReport.create({
      reporterId: req.user.id,
      serviceId,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Reporte de servicio creado exitosamente.',
       report
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un reporte de servicio por ID
// @route   GET /api/service-reports/:id
// @access  Private (solo admins o usuarios involucrados)
exports.getServiceReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await ServiceReport.findByPk(id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'price'],
          include: [
            {
              model: User,
              as: 'provider',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        },
        {
          model: AdminUser,
          as: 'reviewer',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte de servicio no encontrado.'
      });
    }

    // Verificar permisos (admin o usuario que creó el reporte)
    if (req.user.role !== 'admin' && req.user.id !== report.reporterId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este reporte.'
      });
    }

    res.json({
      success: true,
       report
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar un reporte de servicio (por admin)
// @route   PUT /api/service-reports/:id
// @access  Private (solo admins)
exports.updateServiceReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, reviewedBy, reviewedAt, adminNotes } = req.body;

    const report = await ServiceReport.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte de servicio no encontrado.'
      });
    }

    // Verificar que el estado sea válido
    const validStatuses = ['pending', 'reviewed', 'dismissed', 'action_taken'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido.'
      });
    }

    await report.update({
      status,
      reviewedBy: reviewedBy || report.reviewedBy,
      reviewedAt: reviewedAt || new Date(),
      adminNotes: adminNotes || report.adminNotes
    });

    res.json({
      success: true,
      message: 'Reporte de servicio actualizado exitosamente.',
       report
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un reporte de servicio
// @route   DELETE /api/service-reports/:id
// @access  Private (solo admins)
exports.deleteServiceReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await ServiceReport.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte de servicio no encontrado.'
      });
    }

    await report.destroy();

    res.json({
      success: true,
      message: 'Reporte de servicio eliminado exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener reportes de servicios por usuario
// @route   GET /api/users/:userId/reports
// @access  Private (solo admins o el propio usuario)
exports.getServiceReportsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Verificar permisos
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver los reportes de este usuario.'
      });
    }

    const whereClause = { reporterId: userId };
    if (status) whereClause.status = status;

    const reports = await ServiceReport.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'price']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: reports.count,
      pages: Math.ceil(reports.count / parseInt(limit)),
       reports: reports.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener reportes de servicios por servicio
// @route   GET /api/services/:serviceId/reports
// @access  Private (solo admins o proveedor del servicio)
exports.getServiceReportsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.id !== service.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver los reportes de este servicio.'
      });
    }

    const reports = await ServiceReport.findAll({
      where: { serviceId },
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
       reports
    });

  } catch (error) {
    next(error);
  }
};

module.exports = ServiceReport;