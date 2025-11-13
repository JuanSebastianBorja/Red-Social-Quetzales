
// ============================================
// ESCROW CONTROLLER - Controlador de Cuentas en Garantía (Escrow)
// ============================================

const { validationResult } = require('express-validator');
const { EscrowAccount, Service, User } = require('../models');

// @desc    Obtener todas las cuentas de garantía
// @route   GET /api/escrow
// @access  Private (solo admins o usuarios con permiso)
exports.getEscrows = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, serviceId, buyerId, sellerId } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (serviceId) whereClause.service_id = serviceId;
    if (buyerId) whereClause.buyer_id = buyerId;
    if (sellerId) whereClause.seller_id = sellerId;

    const escrows = await EscrowAccount.findAndCountAll({
      where: whereClause,
      include: [
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
          model: User,
          as: 'buyer',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: escrows.count,
      pages: Math.ceil(escrows.count / parseInt(limit)),
       escrows: escrows.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una cuenta de garantía por ID
// @route   GET /api/escrow/:id
// @access  Private (solo admins o usuarios con permiso)
exports.getEscrowById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const escrow = await EscrowAccount.findByPk(id, {
      include: [
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
    });

    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de garantía no encontrada.'
      });
    }

    res.json({
      success: true,
       escrow
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear una nueva cuenta de garantía
// @route   POST /api/escrow
// @access  Private (solo consumidores o usuarios con permiso)
exports.createEscrow = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { serviceId, buyerId, sellerId, amount } = req.body;

    // Verificar que el servicio exista
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    // Verificar que el comprador y vendedor existan
    const [buyer, seller] = await Promise.all([
      User.findByPk(buyerId),
      User.findByPk(sellerId)
    ]);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Comprador no encontrado.'
      });
    }

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Vendedor no encontrado.'
      });
    }

    // Verificar que el monto coincida con el precio del servicio
    if (parseFloat(amount) !== parseFloat(service.price)) {
      return res.status(400).json({
        success: false,
        message: 'El monto no coincide con el precio del servicio.'
      });
    }

    const escrow = await EscrowAccount.create({
      serviceId,
      buyerId,
      sellerId,
      amount
    });

    res.status(201).json({
      success: true,
      message: 'Cuenta de garantía creada exitosamente.',
       escrow
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una cuenta de garantía
// @route   PUT /api/escrow/:id
// @access  Private (solo admins o usuarios con permiso)
exports.updateEscrow = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, disputeReason } = req.body;

    const escrow = await EscrowAccount.findByPk(id);
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de garantía no encontrada.'
      });
    }

    await escrow.update({ status, disputeReason });

    res.json({
      success: true,
      message: 'Cuenta de garantía actualizada exitosamente.',
       escrow
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una cuenta de garantía
// @route   DELETE /api/escrow/:id
// @access  Private (solo admins)
exports.deleteEscrow = async (req, res, next) => {
  try {
    const { id } = req.params;

    const escrow = await EscrowAccount.findByPk(id);
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de garantía no encontrada.'
      });
    }

    await escrow.destroy();

    res.json({
      success: true,
      message: 'Cuenta de garantía eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener cuentas de garantía de un servicio
// @route   GET /api/services/:serviceId/escrows
// @access  Private (solo proveedor del servicio o admins)
exports.getEscrowsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { serviceId };
    if (status) whereClause.status = status;

    const escrows = await EscrowAccount.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: escrows.count,
      pages: Math.ceil(escrows.count / parseInt(limit)),
       escrows: escrows.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener cuentas de garantía de un usuario (como comprador o vendedor)
// @route   GET /api/users/:userId/escrows
// @access  Private (solo dueño del usuario o admins)
exports.getEscrowsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, role, status } = req.query;

    const whereClause = {};
    if (role === 'buyer') whereClause.buyer_id = userId;
    else if (role === 'seller') whereClause.seller_id = userId;
    else whereClause[require('sequelize').Op.or] = [{ buyer_id: userId }, { seller_id: userId }];

    if (status) whereClause.status = status;

    const escrows = await EscrowAccount.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: escrows.count,
      pages: Math.ceil(escrows.count / parseInt(limit)),
       escrows: escrows.rows
    });

  } catch (error) {
    next(error);
  }
};

module.exports = EscrowAccount;