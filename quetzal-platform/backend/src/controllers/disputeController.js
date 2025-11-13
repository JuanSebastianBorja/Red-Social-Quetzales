// ============================================
// DISPUTE CONTROLLER - Controlador de Disputas
// ============================================

const { validationResult } = require('express-validator');
const { Dispute, EscrowAccount, User, AdminUser } = require('../models');

// @desc    Obtener todas las disputas
// @route   GET /api/disputes
// @access  Private (solo admins)
exports.getDisputes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt' } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;

    const disputes = await Dispute.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: EscrowAccount,
          as: 'escrow',
          attributes: ['id', 'amount', 'status'],
          include: [
            {
              model: User,
              as: 'buyer',
              attributes: ['id', 'fullName', 'email']
            },
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'complainant',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'respondent',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: AdminUser,
          as: 'resolver',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [[sortBy, 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: disputes.count,
      pages: Math.ceil(disputes.count / parseInt(limit)),
       disputes: disputes.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear una nueva disputa
// @route   POST /api/disputes
// @access  Private (solo usuarios autenticados)
exports.createDispute = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { escrowId, reason, evidenceUrls } = req.body;

    // Verificar que la cuenta escrow exista
    const escrow = await EscrowAccount.findByPk(escrowId);
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de garantía no encontrada.'
      });
    }

    // Verificar que el usuario sea el comprador o vendedor del escrow
    if (req.user.id !== escrow.buyerId && req.user.id !== escrow.sellerId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para crear una disputa para esta cuenta de garantía.'
      });
    }

    // Verificar que no exista ya una disputa para esta cuenta
    const existingDispute = await Dispute.findOne({ where: { escrowId } });
    if (existingDispute) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una disputa para esta cuenta de garantía.'
      });
    }

    const dispute = await Dispute.create({
      escrowId,
      complainantId: req.user.id,
      respondentId: req.user.id === escrow.buyerId ? escrow.sellerId : escrow.buyerId,
      reason,
      evidenceUrls: evidenceUrls || []
    });

    // Cambiar estado del escrow a 'disputed'
    await escrow.update({ status: 'disputed' });

    res.status(201).json({
      success: true,
      message: 'Disputa creada exitosamente.',
       dispute
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una disputa por ID
// @route   GET /api/disputes/:id
// @access  Private (solo admins o usuarios involucrados)
exports.getDisputeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dispute = await Dispute.findByPk(id, {
      include: [
        {
          model: EscrowAccount,
          as: 'escrow',
          attributes: ['id', 'amount', 'status'],
          include: [
            {
              model: User,
              as: 'buyer',
              attributes: ['id', 'fullName', 'email']
            },
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'complainant',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'respondent',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: AdminUser,
          as: 'resolver',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Disputa no encontrada.'
      });
    }

    // Verificar permisos (admin o usuario involucrado)
    if (req.user.role !== 'admin' && req.user.id !== dispute.complainantId && req.user.id !== dispute.respondentId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta disputa.'
      });
    }

    res.json({
      success: true,
       dispute
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una disputa (resolverla)
// @route   PUT /api/disputes/:id
// @access  Private (solo admins)
exports.updateDispute = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, resolution } = req.body;

    const dispute = await Dispute.findByPk(id);
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Disputa no encontrada.'
      });
    }

    // Verificar que el estado sea válido
    const validStatuses = ['open', 'in_review', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido.'
      });
    }

    await dispute.update({ status, resolution, resolvedBy: req.user.id, resolvedAt: new Date() });

    // Si se resuelve, liberar fondos del escrow si corresponde
    if (status === 'resolved' && resolution) {
      const escrow = await EscrowAccount.findByPk(dispute.escrowId);
      if (escrow) {
        await escrow.update({ status: 'released', releasedAt: new Date() });
      }
    }

    res.json({
      success: true,
      message: 'Disputa actualizada exitosamente.',
       dispute
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una disputa
// @route   DELETE /api/disputes/:id
// @access  Private (solo admins)
exports.deleteDispute = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dispute = await Dispute.findByPk(id);
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Disputa no encontrada.'
      });
    }

    await dispute.destroy();

    res.json({
      success: true,
      message: 'Disputa eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener disputas por usuario (como denunciante o demandado)
// @route   GET /api/users/:userId/disputes
// @access  Private (solo admins o el propio usuario)
exports.getDisputesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, role, status } = req.query;

    // Verificar permisos
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver las disputas de este usuario.'
      });
    }

    const whereClause = {};
    if (status) whereClause.status = status;

    if (role === 'complainant') {
      whereClause.complainant_id = userId;
    } else if (role === 'respondent') {
      whereClause.respondent_id = userId;
    } else {
      whereClause[require('sequelize').Op.or] = [
        { complainant_id: userId },
        { respondent_id: userId }
      ];
    }

    const disputes = await Dispute.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: EscrowAccount,
          as: 'escrow',
          attributes: ['id', 'amount', 'status'],
          include: [
            {
              model: User,
              as: 'buyer',
              attributes: ['id', 'fullName', 'email']
            },
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'complainant',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'respondent',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: AdminUser,
          as: 'resolver',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: disputes.count,
      pages: Math.ceil(disputes.count / parseInt(limit)),
       disputes: disputes.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener disputas por cuenta de garantía
// @route   GET /api/escrows/:escrowId/disputes
// @access  Private (solo admins o usuarios involucrados en el escrow)
exports.getDisputesByEscrow = async (req, res, next) => {
  try {
    const { escrowId } = req.params;

    const escrow = await EscrowAccount.findByPk(escrowId);
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de garantía no encontrada.'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.id !== escrow.buyerId && req.user.id !== escrow.sellerId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver las disputas de esta cuenta de garantía.'
      });
    }

    const disputes = await Dispute.findAll({
      where: { escrowId },
      include: [
        {
          model: User,
          as: 'complainant',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'respondent',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: AdminUser,
          as: 'resolver',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
       disputes
    });

  } catch (error) {
    next(error);
  }
};

module.exports = Dispute;