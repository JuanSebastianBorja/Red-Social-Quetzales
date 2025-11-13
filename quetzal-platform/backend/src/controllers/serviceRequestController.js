// ============================================
// SERVICEREQUEST CONTROLLER - Controlador de Solicitudes de Servicio
// ============================================

const { validationResult } = require('express-validator');
const { ServiceRequest, Service, User } = require('../models');

// @desc    Obtener todas las solicitudes de servicio
// @route   GET /api/service-requests
// @access  Private (solo admins o usuarios con permiso)
exports.getServiceRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, serviceId, buyerId, sellerId } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (serviceId) whereClause.service_id = serviceId;
    if (buyerId) whereClause.buyer_id = buyerId;
    if (sellerId) whereClause.seller_id = sellerId;

    const requests = await ServiceRequest.findAndCountAll({
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
      count: requests.count,
      pages: Math.ceil(requests.count / parseInt(limit)),
       requests: requests.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una solicitud de servicio por ID
// @route   GET /api/service-requests/:id
// @access  Private (solo admins o usuarios involucrados)
exports.getServiceRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findByPk(id, {
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

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de servicio no encontrada.'
      });
    }

    res.json({
      success: true,
       request
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear una nueva solicitud de servicio
// @route   POST /api/service-requests
// @access  Private (solo consumidores)
exports.createServiceRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { serviceId, buyerId, sellerId, message, proposedPrice } = req.body;

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

    // Verificar que el comprador no sea el mismo que el vendedor
    if (buyerId === sellerId) {
      return res.status(400).json({
        success: false,
        message: 'El comprador y el vendedor no pueden ser el mismo usuario.'
      });
    }

    const request = await ServiceRequest.create({
      serviceId,
      buyerId,
      sellerId,
      message,
      proposedPrice
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de servicio creada exitosamente.',
       request
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una solicitud de servicio
// @route   PUT /api/service-requests/:id
// @access  Private (solo admins o usuarios involucrados)
exports.updateServiceRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, rejectionReason, proposedPrice, negotiatedPrice, termsAgreed } = req.body;

    const request = await ServiceRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de servicio no encontrada.'
      });
    }

    // Verificar si el estado es válido
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'negotiating'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido.'
      });
    }

    await request.update({ status, rejectionReason, proposedPrice, negotiatedPrice, termsAgreed });

    res.json({
      success: true,
      message: 'Solicitud de servicio actualizada exitosamente.',
       request
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una solicitud de servicio
// @route   DELETE /api/service-requests/:id
// @access  Private (solo admins o usuarios involucrados)
exports.deleteServiceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de servicio no encontrada.'
      });
    }

    await request.destroy();

    res.json({
      success: true,
      message: 'Solicitud de servicio eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener solicitudes de un servicio
// @route   GET /api/services/:serviceId/requests
// @access  Private (solo proveedor del servicio o admins)
exports.getServiceRequestsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { serviceId };
    if (status) whereClause.status = status;

    const requests = await ServiceRequest.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: requests.count,
      pages: Math.ceil(requests.count / parseInt(limit)),
       requests: requests.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener solicitudes de un usuario (como comprador o vendedor)
// @route   GET /api/users/:userId/requests
// @access  Private (solo dueño del usuario o admins)
exports.getServiceRequestsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, role, status } = req.query;

    const whereClause = {};
    if (role === 'buyer') whereClause.buyer_id = userId;
    else if (role === 'seller') whereClause.seller_id = userId;
    else whereClause[require('sequelize').Op.or] = [{ buyer_id: userId }, { seller_id: userId }];

    if (status) whereClause.status = status;

    const requests = await ServiceRequest.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: requests.count,
      pages: Math.ceil(requests.count / parseInt(limit)),
       requests: requests.rows
    });

  } catch (error) {
    next(error);
  }
};

module.exports = ServiceRequest;