// ============================================
// SERVICE CONTROLLER
// ============================================

const Service = require('../models/Service');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const ServiceImage = require('../models/ServiceImage');


// ============================================
// GET /api/services
// Filtros: category, minPrice, maxPrice, search, sort
// ============================================
exports.getServices = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search, sort } = req.query;

    let filters = { status: 'active' };
    let order = [['created_at', 'DESC']];

    if (category) filters.category = category;

    if (search) {
      filters[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price[Op.gte] = minPrice;
      if (maxPrice) filters.price[Op.lte] = maxPrice;
    }

    if (sort === 'price-asc') order = [['price', 'ASC']];
    if (sort === 'price-desc') order = [['price', 'DESC']];
    if (sort === 'popular') order = [['views_count', 'DESC']];  

    const services = await Service.findAll({
      where: filters,
      order,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: ServiceImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary']
        }
      ]
    });

    res.json({ success: true, count: services.length, data: services });

  } catch (err) {
    next(err);
  }
};


// ============================================
// GET /api/services/:id
// ============================================
exports.getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'fullName', 'avatar', 'email', 'bio']
        },
        {
          model: ServiceImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'orderIndex']
        }
      ]
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    await service.incrementViews();

    res.json({ success: true, data: service });

  } catch (err) {
    next(err);
  }
};

// ============================================
// POST /api/services
// ============================================
exports.createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (req.user.userType === 'consumer') {
      return res.status(403).json({
        success: false,
        message: 'Solo los proveedores pueden crear servicios'
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
      requirements,
      status: 'active'
    });

    const serviceWithUser = await Service.findByPk(service.id, {
      include: { model: User, as: 'provider', attributes: ['id', 'fullName', 'avatar'] }
    });

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: serviceWithUser
    });

  } catch (err) {
    next(err);
  }
};

// ============================================
// PUT /api/services/:id
// ============================================
exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    if (service.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para editar este servicio' });
    }

    await service.update({
      title: req.body.title ?? service.title,
      description: req.body.description ?? service.description,
      category: req.body.category ?? service.category,
      price: req.body.price ?? service.price,
      deliveryTime: req.body.deliveryTime ?? service.deliveryTime,
      requirements: req.body.requirements ?? service.requirements,
      status: req.body.status ?? service.status
    });

    res.json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: service
    });

  } catch (err) {
    next(err);
  }
};

// ============================================
// DELETE /api/services/:id
// ============================================
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    if (service.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este servicio' });
    }

    await service.destroy();

    res.json({ success: true, message: 'Servicio eliminado exitosamente' });

  } catch (err) {
    next(err);
  }
};

// ============================================
// GET /api/services/my-services
// ============================================
exports.getMyServices = async (req, res, next) => {
  try {
    const services = await Service.findByUser(req.user.id);

    res.json({ success: true, count: services.length, data: services });

  } catch (err) {
    next(err);
  }
};

// ============================================
// GET /api/services/category/:category
// ============================================
exports.getServicesByCategory = async (req, res, next) => {
  try {
    const services = await Service.findByCategory(req.params.category);

    res.json({ success: true, count: services.length, data: services });

  } catch (err) {
    next(err);
  }
};
