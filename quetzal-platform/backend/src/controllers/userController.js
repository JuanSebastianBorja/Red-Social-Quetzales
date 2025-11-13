// ============================================
// USER CONTROLLER - Controlador de Usuarios
// ============================================

const { validationResult } = require('express-validator');
const { User, Service, Wallet, Rating, UserSkill, Notification, Analytics, UserReport } = require('../models');
const { Op, sequelize } = require('sequelize'); 

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Wallet,
          as: 'wallet',
          attributes: ['id', 'balance', 'currency', 'createdAt']
        },
        {
          model: UserSkill,
          as: 'skills',
          attributes: ['id', 'skillName', 'createdAt'],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    res.json({
      success: true,
       user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar perfil del usuario
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const allowedFields = ['fullName', 'phone', 'city', 'bio', 'website', 'avatar'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente.',
       user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Service,
          as: 'services',
          attributes: ['id', 'title', 'price', 'status', 'viewsCount'],
          where: { status: 'active' },
          required: false
        },
        {
          model: UserSkill,
          as: 'skills',
          attributes: ['id', 'skillName'],
          order: [['skillName', 'ASC']]
        },
        {
          model: Rating,
          as: 'receivedRatings',
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    res.json({
      success: true,
       user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Buscar usuarios por filtros
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, city, skill, limit = 10, page = 1 } = req.query;

    const whereClause = { isActive: true };

    if (q) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${q}%` } },
        { bio: { [Op.iLike]: `%${q}%` } }
      ];
    }

    if (city) {
      whereClause.city = { [Op.iLike]: city };
    }

    let includeClause = [];

    if (skill) {
      includeClause.push({
        model: UserSkill,
        as: 'skills',
        where: { skillName: { [Op.iLike]: skill } },
        required: false
      });
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      count: users.count,
      pages: Math.ceil(users.count / parseInt(limit)),
       users: users.rows 
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener servicios de un usuario
// @route   GET /api/users/:id/services
// @access  Public
exports.getUserServices = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'active', category } = req.query;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const whereClause = { userId: id };
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;

    const services = await Service.findAll({
      where: whereClause,
      include: [
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
          ]
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

// @desc    Obtener habilidades de un usuario
// @route   GET /api/users/:id/skills
// @access  Public
exports.getUserSkills = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const skills = await UserSkill.findAll({  
      where: { userId: id },
      attributes: ['id', 'skillName', 'createdAt'],
      order: [['skillName', 'ASC']]
    });

    res.json({
      success: true,
      count: skills.length,
       skills
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar cuenta de usuario
// @route   DELETE /api/users/profile
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Opcional: Verificar contraseña antes de eliminar
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña incorrecta.'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas del usuario
// @route   GET /api/users/:id/stats
// @access  Public
exports.getUserStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const [services, ratings, skills] = await Promise.all([
      Service.count({ where: { userId: id, status: 'active' } }),
      Rating.count({ where: { userId: id } }),
      UserSkill.count({ where: { userId: id } })
    ]);

    const avgRating = await Rating.findOne({
      where: { userId: id },
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average']],
      raw: true
    });

    res.json({
      success: true,
       stats: {  
        totalServices: services,
        totalRatings: ratings,
        totalSkills: skills,
        averageRating: avgRating.average ? parseFloat(avgRating.average).toFixed(2) : 0
      }
    });

  } catch (error) {
    next(error);
  }
};