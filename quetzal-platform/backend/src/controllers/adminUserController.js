// ============================================
// ADMINUSER CONTROLLER - Controlador de Usuarios Administradores
// ============================================

const { validationResult } = require('express-validator');
const { AdminUser, AdminRole } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Obtener todos los usuarios administradores
// @route   GET /api/admin/users
// @access  Private (solo admins)
exports.getAdminUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isActive, roleId } = req.query;

    const whereClause = {};
    if (isActive !== undefined) whereClause.is_active = isActive === 'true';
    if (roleId) whereClause.role_id = roleId;

    const admins = await AdminUser.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: AdminRole,
          as: 'role',
          attributes: ['id', 'roleName', 'description']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: admins.count,
      pages: Math.ceil(admins.count / parseInt(limit)),
       admins: admins.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear un nuevo usuario administrador
// @route   POST /api/admin/users
// @access  Private (solo superadmin)
exports.createAdminUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, fullName, roleId } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await AdminUser.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario admin con este email.'
      });
    }

    // Verificar que el rol exista
    const role = await AdminRole.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado.'
      });
    }

    const adminUser = await AdminUser.create({
      email,
      password,
      fullName,
      roleId
    });

    res.status(201).json({
      success: true,
      message: 'Usuario admin creado exitosamente.',
       adminUser
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un usuario admin por ID
// @route   GET /api/admin/users/:id
// @access  Private (solo admins)
exports.getAdminUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const adminUser = await AdminUser.findByPk(id, {
      include: [
        {
          model: AdminRole,
          as: 'role',
          attributes: ['id', 'roleName', 'description']
        }
      ]
    });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario admin no encontrado.'
      });
    }

    res.json({
      success: true,
       adminUser
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar un usuario admin
// @route   PUT /api/admin/users/:id
// @access  Private (solo superadmin)
exports.updateAdminUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { email, password, fullName, roleId, isActive } = req.body;

    const adminUser = await AdminUser.findByPk(id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario admin no encontrado.'
      });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== adminUser.email) {
      const existingUser = await AdminUser.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario admin con este email.'
        });
      }
    }

    // Verificar que el rol exista si se intenta actualizar
    if (roleId) {
      const role = await AdminRole.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado.'
        });
      }
    }

    await adminUser.update({ email, password, fullName, roleId, isActive });

    res.json({
      success: true,
      message: 'Usuario admin actualizado exitosamente.',
       adminUser
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un usuario admin
// @route   DELETE /api/admin/users/:id
// @access  Private (solo superadmin)
exports.deleteAdminUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const adminUser = await AdminUser.findByPk(id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario admin no encontrado.'
      });
    }

    // No permitir eliminar al propio usuario
    if (adminUser.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta.'
      });
    }

    await adminUser.destroy();

    res.json({
      success: true,
      message: 'Usuario admin eliminado exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Iniciar sesión como administrador
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario admin
    const adminUser = await AdminUser.findOne({
      where: { email },
      include: [
        {
          model: AdminRole,
          as: 'role',
          attributes: ['id', 'roleName', 'permissions']
        }
      ]
    });

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // Verificar contraseña
    const isMatch = await adminUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // Verificar si está activo
    if (!adminUser.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al soporte.'
      });
    }

    // Generar token
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role.roleName },
      process.env.ADMIN_JWT_SECRET || 'admin_secret_key_2024',
      { expiresIn: process.env.ADMIN_JWT_EXPIRE || '24h' }
    );

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
       user: adminUser.toJSON(),
      token
    });

  } catch (error) {
    next(error);
  }
}; // ✅ Cerrado correctamente

// @desc    Obtener perfil del usuario admin autenticado
// @route   GET /api/admin/profile
// @access  Private (solo admins)
exports.getAdminProfile = async (req, res, next) => {
  try {
    const adminUser = await AdminUser.findByPk(req.user.id, {
      include: [
        {
          model: AdminRole,
          as: 'role',
          attributes: ['id', 'roleName', 'permissions']
        }
      ]
    });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario admin no encontrado.'
      });
    }

    res.json({
      success: true,
       user: adminUser
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar perfil del usuario admin
// @route   PUT /api/admin/profile
// @access  Private (solo admins)
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fullName, email, password } = req.body;

    const adminUser = await AdminUser.findByPk(req.user.id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario admin no encontrado.'
      });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== adminUser.email) {
      const existingUser = await AdminUser.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario admin con este email.'
        });
      }
    }

    await adminUser.update({ fullName, email, password });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente.',
       user: adminUser
    });

  } catch (error) {
    next(error);
  }
};