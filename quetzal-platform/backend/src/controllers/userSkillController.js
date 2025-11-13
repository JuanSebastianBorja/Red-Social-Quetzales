// ============================================
// USERSKILL CONTROLLER - Controlador de Habilidades de Usuario
// ============================================

const { validationResult } = require('express-validator');
const { UserSkill, User } = require('../models');

// @desc    Obtener todas las habilidades de un usuario
// @route   GET /api/users/:userId/skills
// @access  Public
exports.getUserSkills = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skills = await UserSkill.findAndCountAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'avatar']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: skills.count,
      pages: Math.ceil(skills.count / parseInt(limit)),
       skills: skills.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear una nueva habilidad para el usuario autenticado
// @route   POST /api/user-skills
// @access  Private (solo usuarios autenticados)
exports.createUserSkill = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { skillName } = req.body;

    // Verificar si la habilidad ya existe para este usuario
    const existingSkill = await UserSkill.findOne({
      where: { userId: req.user.id, skillName: skillName.trim() }
    });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes registrada esta habilidad.'
      });
    }

    const userSkill = await UserSkill.create({
      userId: req.user.id,
      skillName
    });

    res.status(201).json({
      success: true,
      message: 'Habilidad creada exitosamente.',
       userSkill
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una habilidad de usuario
// @route   PUT /api/user-skills/:id
// @access  Private (solo el usuario dueño de la habilidad)
exports.updateUserSkill = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { skillName } = req.body;

    const userSkill = await UserSkill.findByPk(id);
    if (!userSkill) {
      return res.status(404).json({
        success: false,
        message: 'Habilidad no encontrada.'
      });
    }

    // Verificar que el usuario sea el dueño de la habilidad
    if (userSkill.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta habilidad.'
      });
    }

    await userSkill.update({ skillName });

    res.json({
      success: true,
      message: 'Habilidad actualizada exitosamente.',
       userSkill
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una habilidad de usuario
// @route   DELETE /api/user-skills/:id
// @access  Private (solo el usuario dueño de la habilidad)
exports.deleteUserSkill = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userSkill = await UserSkill.findByPk(id);
    if (!userSkill) {
      return res.status(404).json({
        success: false,
        message: 'Habilidad no encontrada.'
      });
    }

    // Verificar que el usuario sea el dueño de la habilidad
    if (userSkill.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta habilidad.'
      });
    }

    await userSkill.destroy();

    res.json({
      success: true,
      message: 'Habilidad eliminada exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar todas las habilidades de un usuario
// @route   DELETE /api/users/:userId/skills
// @access  Private (solo admins o el propio usuario)
exports.deleteUserSkills = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario sea admin o el propietario
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar estas habilidades.'
      });
    }

    const deleted = await UserSkill.destroy({ where: { userId } });

    res.json({
      success: true,
      message: `Se eliminaron ${deleted} habilidades.`,
      deletedCount: deleted
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Buscar habilidades por nombre (global)
// @route   GET /api/user-skills/search?query=:query
// @access  Public
exports.searchSkills = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'La consulta de búsqueda es obligatoria.'
      });
    }

    const skills = await UserSkill.findAndCountAll({
      where: {
        skillName: {
          [require('sequelize').Op.iLike]: `%${query}%`
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'avatar']
        }
      ],
      order: [['skillName', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: skills.count,
      pages: Math.ceil(skills.count / parseInt(limit)),
       skills: skills.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener habilidad por ID
// @route   GET /api/user-skills/:id
// @access  Public
exports.getUserSkillById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userSkill = await UserSkill.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'avatar']
        }
      ]
    });

    if (!userSkill) {
      return res.status(404).json({
        success: false,
        message: 'Habilidad no encontrada.'
      });
    }

    res.json({
      success: true,
       userSkill
    });

  } catch (error) {
    next(error);
  }
};

module.exports = UserSkill;