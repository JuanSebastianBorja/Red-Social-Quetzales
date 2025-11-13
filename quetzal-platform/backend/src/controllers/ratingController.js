<<<<<<< HEAD
// ============================================
// RATING CONTROLLER - Controlador de Calificaciones
// ============================================

const { validationResult } = require('express-validator');
const { Rating, Service, User } = require('../models');

// @desc    Obtener todas las calificaciones
// @route   GET /api/ratings
// @access  Private (solo admins o usuarios con permiso)
exports.getRatings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, rating, serviceId, userId } = req.query;

    const whereClause = {};
    if (rating) whereClause.rating = rating;
    if (serviceId) whereClause.service_id = serviceId;
    if (userId) whereClause.user_id = userId;

    const ratings = await Rating.findAndCountAll({
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
      count: ratings.count,
      pages: Math.ceil(ratings.count / parseInt(limit)),
       ratings: ratings.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una calificación por ID
// @route   GET /api/ratings/:id
// @access  Private (solo admins o usuarios con permiso)
exports.getRatingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rating = await Rating.findByPk(id, {
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
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada.'
      });
    }

    res.json({
      success: true,
       rating
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear una nueva calificación
// @route   POST /api/ratings
// @access  Private (solo usuarios que hayan contratado el servicio)
exports.createRating = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { serviceId, userId, rating, comment } = req.body;

    // Verificar que el servicio exista
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado.'
      });
    }

    // Verificar que el usuario exista
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Verificar que el rating esté entre 1 y 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5.'
      });
    }

    // Verificar que el usuario no haya calificado este servicio antes
    const existingRating = await Rating.findOne({ where: { serviceId, userId } });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Ya has calificado este servicio.'
      });
    }

    const newRating = await Rating.create({
      serviceId,
      userId,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Calificación creada exitosamente.',
       rating: newRating
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una calificación
// @route   PUT /api/ratings/:id
// @access  Private (solo el usuario que creó la calificación)
exports.updateRating = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    const ratingRecord = await Rating.findByPk(id);
    if (!ratingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada.'
      });
    }

    // Verificar que el usuario sea el propietario de la calificación
    if (ratingRecord.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta calificación.'
      });
    }

    // Verificar que el rating esté entre 1 y 5
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5.'
      });
    }

    await ratingRecord.update({ rating, comment });

    res.json({
      success: true,
      message: 'Calificación actualizada exitosamente.',
       rating: ratingRecord
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una calificación
// @route   DELETE /api/ratings/:id
// @access  Private (solo admins o el usuario que creó la calificación)
exports.deleteRating = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rating = await Rating.findByPk(id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada.'
      });
    }

    // Verificar que el usuario sea el propietario o admin
    if (rating.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta calificación.'
      });
    }

    await rating.destroy();

    res.json({
      success: true,
      message: 'Calificación eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener calificaciones de un servicio
// @route   GET /api/services/:serviceId/ratings
// @access  Public
exports.getRatingsByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.findAndCountAll({
      where: { serviceId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: ratings.count,
      pages: Math.ceil(ratings.count / parseInt(limit)),
       ratings: ratings.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener calificaciones de un usuario
// @route   GET /api/users/:userId/ratings
// @access  Public
exports.getRatingsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'price'],
          include: [
            {
              model: User,
              as: 'provider',
              attributes: ['id', 'fullName', 'avatar']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: ratings.count,
      pages: Math.ceil(ratings.count / parseInt(limit)),
       ratings: ratings.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener promedio de calificaciones de un servicio
// @route   GET /api/services/:serviceId/rating-average
// @access  Public
exports.getRatingAverageByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const avgRating = await Rating.findOne({
      where: { serviceId },
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'average']
      ],
      raw: true
    });

    res.json({
      success: true,
       average: avgRating.average ? parseFloat(avgRating.average).toFixed(2) : 0
    });

  } catch (error) {
    next(error);
  }
};

module.exports = Rating;
=======

const { Rating } = require('../models');
const { body, param, validationResult } = require('express-validator');

const createValidators = [
  body('serviceId').isInt().toInt(),
  body('rateeId').isInt().toInt(),
  body('score').isInt({ min:1, max:5 }),
  body('comment').optional().isString().isLength({ max: 500 })
];
const serviceParam = [ param('serviceId').isInt().toInt() ];

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { serviceId, rateeId, score, comment } = req.body;
  const rating = await Rating.create({ serviceId, rateeId, raterId: req.userId, score, comment });
  res.status(201).json({ success:true, data: rating });
}
async function listByService(req, res) {
  const ratings = await Rating.findAll({ where: { serviceId: req.params.serviceId }, order: [['createdAt','DESC']] });
  res.json({ success:true, data: ratings });
}
module.exports = { create, listByService, createValidators, serviceParam };
>>>>>>> cc4c4af3e771aba7082da02ff554d4eb7b32c798
