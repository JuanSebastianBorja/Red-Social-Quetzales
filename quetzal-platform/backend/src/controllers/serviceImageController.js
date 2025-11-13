// ============================================
// SERVICE CONTROLLER - Controlador de Servicios
// ============================================

const { validationResult } = require('express-validator');
const { Service, User, ServiceImage, Rating } = require('../models');
const { Op } = require('sequelize');

// @desc    Crear un nuevo servicio
// @route   POST /api/services
// @access  Private (solo proveedores)
exports.createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Verificar que el usuario sea proveedor
    if (req.user.userType === 'consumer') {
      return res.status(403).json({
        success: false,
        message: 'Solo los proveedores pueden crear servicios.'
      });
    }

    const { title, description, category, price, deliveryTime, requirements } = req.body;

    const service = await Service.create({
      userId: req.user.id,
      title,
      description,
      category,
      price,
      deliveryTime,
      requirements
    });

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente.',
       service
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener todos los servicios (con filtros)
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search, sort, page = 1, limit = 10 } = req.query;

    const whereClause = { status: 'active' };

    if (category) whereClause.category = category;
    if (minPrice) whereClause.price = { [Op.gte]: minPrice };
    if (maxPrice) {
      whereClause.price = whereClause.price ? { ...whereClause.price, [Op.lte]: maxPrice } : { [Op.lte]: maxPrice };
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const order = [];
    if (sort === 'price-asc') order.push(['price', 'ASC']);
    else if (sort === 'price-desc') order.push(['price', 'DESC']);
    else if (sort === 'newest') order.push(['createdAt', 'DESC']);
    else if (sort === 'oldest') order.push(['createdAt', 'ASC']);
    else if (sort === 'popular') order.push(['viewsCount', 'DESC']);

    const services = await Service.findAndCountAll({
      where: whereClause,
      order,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'avatar', 'isVerified']
        },
        {
          model: ServiceImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'orderIndex'],
          where: { isPrimary: true },
          required: false
        },
        {
          model: Rating,
          as: 'ratings',
          attributes: ['id', 'rating', 'comment', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'avatar']
            }
          ],
          limit: 5
        }
      ]
    });

    res.json({
      success: true,
      count: services.count,
      pages: Math.ceil(services.count / parseInt(limit)),
       services: services.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un servicio por ID
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'avatar', 'isVerified', 'bio']
        },
        {
          model: ServiceImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'orderIndex'],
          order: [['orderIndex', 'ASC']]
        },
        {
          model: Rating,
          as: 'ratings',
          attributes: ['id', 'rating', 'comment', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'avatar']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    // Incrementar vistas
    await service.incrementViews();

    res.json({
      success: true,
       service
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar un servicio
// @route   PUT /api/services/:id
// @access  Private (solo el proveedor)
exports.updateService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, description, category, price, deliveryTime, requirements, status } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    // Verificar que el usuario sea el proveedor
    if (service.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar este servicio.'
      });
    }

    await service.update({
      title,
      description,
      category,
      price,
      deliveryTime,
      requirements,
      status
    });

    res.json({
      success: true,
      message: 'Servicio actualizado exitosamente.',
       service
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un servicio
// @route   DELETE /api/services/:id
// @access  Private (solo el proveedor)
exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    // Verificar que el usuario sea el proveedor
    if (service.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este servicio.'
      });
    }

    await service.destroy();

    res.json({
      success: true,
      message: 'Servicio eliminado exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener servicios de un usuario
// @route   GET /api/users/:userId/services
// @access  Public
exports.getServicesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const services = await Service.findAll({
      where: { userId, status: 'active' },
      include: [
        {
          model: ServiceImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary'],
          where: { isPrimary: true },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: services.length,
       services
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Buscar servicios por categoría
// @route   GET /api/services/category/:category
// @access  Public
exports.getServicesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const services = await Service.findAll({
      where: { category, status: 'active' },
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'avatar']
        }
      ],
      order: [['viewsCount', 'DESC']]
    });

    res.json({
      success: true,
      count: services.length,
       services
    });

  } catch (error) {
    next(error);
  }
};