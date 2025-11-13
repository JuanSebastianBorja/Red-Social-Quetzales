// ============================================
// USERREPORT CONTROLLER - Controlador de Reportes de Usuario
// ============================================

const { validationResult } = require('express-validator');
const { UserReport, User } = require('../models');

// @desc    Obtener todos los reportes de usuario
// @route   GET /api/user-reports
// @access  Private (solo admins)
exports.getUserReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, reportType, userId, dateFrom, dateTo } = req.query;

    const whereClause = {};
    if (reportType) whereClause.report_type = reportType;
    if (userId) whereClause.user_id = userId;
    if (dateFrom) whereClause.generated_at = { [require('sequelize').Op.gte]: new Date(dateFrom) };
    if (dateTo) {
      whereClause.generated_at = whereClause.generated_at || {};
      whereClause.generated_at[require('sequelize').Op.lte] = new Date(dateTo);
    }

    const reports = await UserReport.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['generated_at', 'DESC']],
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

// @desc    Crear un nuevo reporte de usuario
// @route   POST /api/user-reports
// @access  Private (solo usuarios autenticados)
exports.createUserReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { reportType, dateRangeStart, dateRangeEnd, reportData } = req.body;

    // Verificar que el rango de fechas sea válido
    if (new Date(dateRangeStart) > new Date(dateRangeEnd)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio no puede ser mayor que la fecha de fin.'
      });
    }

    const userReport = await UserReport.create({
      userId: req.user.id,
      reportType,
      dateRangeStart,
      dateRangeEnd,
      reportData
    });

    res.status(201).json({
      success: true,
      message: 'Reporte de usuario creado exitosamente.',
       userReport
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un reporte de usuario por ID
// @route   GET /api/user-reports/:id
// @access  Private (solo admins o usuarios involucrados)
exports.getUserReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await UserReport.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte de usuario no encontrado.'
      });
    }

    // Verificar permisos (admin o usuario dueño del reporte)
    if (req.user.role !== 'admin' && req.user.id !== report.userId) {
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

// @desc    Actualizar un reporte de usuario
// @route   PUT /api/user-reports/:id
// @access  Private (solo admins)
exports.updateUserReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reportType, dateRangeStart, dateRangeEnd, reportData } = req.body;

    const report = await UserReport.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte de usuario no encontrado.'
      });
    }

    await report.update({ reportType, dateRangeStart, dateRangeEnd, reportData });

    res.json({
      success: true,
      message: 'Reporte de usuario actualizado exitosamente.',
       report
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un reporte de usuario
// @route   DELETE /api/user-reports/:id
// @access  Private (solo admins)
exports.deleteUserReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await UserReport.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte de usuario no encontrado.'
      });
    }

    await report.destroy();

    res.json({
      success: true,
      message: 'Reporte de usuario eliminado exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener reportes de un usuario
// @route   GET /api/users/:userId/reports
// @access  Private (solo admins o el propio usuario)
exports.getUserReportsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, reportType, dateFrom, dateTo } = req.query;

    // Verificar permisos
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver los reportes de este usuario.'
      });
    }

    const whereClause = { user_id: userId };
    if (reportType) whereClause.report_type = reportType;
    if (dateFrom) whereClause.generated_at = { [require('sequelize').Op.gte]: new Date(dateFrom) };
    if (dateTo) {
      whereClause.generated_at = whereClause.generated_at || {};
      whereClause.generated_at[require('sequelize').Op.lte] = new Date(dateTo);
    }

    const reports = await UserReport.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['generated_at', 'DESC']],
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

// @desc    Generar un reporte de transacciones
// @route   POST /api/user-reports/transactions
// @access  Private (solo usuarios autenticados)
exports.generateTransactionReport = async (req, res, next) => {
  try {
    const { dateRangeStart, dateRangeEnd } = req.body;

    // Verificar que el rango de fechas sea válido
    if (new Date(dateRangeStart) > new Date(dateRangeEnd)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio no puede ser mayor que la fecha de fin.'
      });
    }

    // Consultar transacciones del usuario
    const { Wallet, Transaction } = require('../models');
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una wallet activa.'
      });
    }

    const transactions = await Transaction.findAll({
      where: {
        walletId: wallet.id,
        createdAt: {
          [require('sequelize').Op.between]: [new Date(dateRangeStart), new Date(dateRangeEnd)]
        }
      },
      order: [['createdAt', 'DESC']]
    });

    const reportData = {
      summary: {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
        averageAmount: transactions.length > 0 ? (transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / transactions.length).toFixed(2) : 0
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt
      }))
    };

    const report = await UserReport.create({
      userId: req.user.id,
      reportType: 'transactions',
      dateRangeStart,
      dateRangeEnd,
      reportData
    });

    res.status(201).json({
      success: true,
      message: 'Reporte de transacciones generado exitosamente.',
       report
    });

  } catch (error) {
    next(error);
  }
};

module.exports = UserReport;