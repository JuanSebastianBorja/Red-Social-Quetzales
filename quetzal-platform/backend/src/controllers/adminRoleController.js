// ============================================
// ADMINROLE CONTROLLER - Controlador de Roles de Administrador
// ============================================

const { validationResult } = require('express-validator');
const { AdminRole, AdminUser } = require('../models');

// @desc    Obtener todos los roles de administrador
// @route   GET /api/admin/roles
// @access  Private (solo admins)
exports.getAdminRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const roles = await AdminRole.findAndCountAll({
      attributes: ['id', 'roleName', 'description', 'permissions', 'createdAt'],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      count: roles.count,
      pages: Math.ceil(roles.count / parseInt(limit)),
       roles: roles.rows
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Crear un nuevo rol de administrador
// @route   POST /api/admin/roles
// @access  Private (solo superadmin)
exports.createAdminRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { roleName, description, permissions } = req.body;

    // Verificar si el rol ya existe
    const existingRole = await AdminRole.findOne({ where: { roleName } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un rol con ese nombre.'
      });
    }

    const role = await AdminRole.create({
      roleName,
      description,
      permissions
    });

    res.status(201).json({
      success: true,
      message: 'Rol de administrador creado exitosamente.',
       role
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un rol por ID
// @route   GET /api/admin/roles/:id
// @access  Private (solo admins)
exports.getAdminRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await AdminRole.findByPk(id, {
      attributes: ['id', 'roleName', 'description', 'permissions', 'createdAt']
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado.'
      });
    }

    res.json({
      success: true,
       role
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar un rol de administrador
// @route   PUT /api/admin/roles/:id
// @access  Private (solo superadmin)
exports.updateAdminRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { roleName, description, permissions } = req.body;

    const role = await AdminRole.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado.'
      });
    }

    // Verificar si el nuevo nombre ya está en uso
    if (roleName && roleName !== role.roleName) {
      const existingRole = await AdminRole.findOne({ where: { roleName } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un rol con ese nombre.'
        });
      }
    }

    await role.update({ roleName, description, permissions });

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente.',
       role
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un rol de administrador
// @route   DELETE /api/admin/roles/:id
// @access  Private (solo superadmin)
exports.deleteAdminRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await AdminRole.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado.'
      });
    }

    // Verificar que no haya usuarios con este rol
    const adminUsers = await AdminUser.count({ where: { roleId: id } });
    if (adminUsers > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el rol porque hay usuarios asignados a él.'
      });
    }

    await role.destroy();

    res.json({
      success: true,
      message: 'Rol eliminado exitosamente.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Buscar roles por permiso
// @route   GET /api/admin/roles/permission/:permissionKey
// @access  Private (solo admins)
exports.getRolesByPermission = async (req, res, next) => {
  try {
    const { permissionKey } = req.params;

    const roles = await AdminRole.findByPermission(permissionKey);

    res.json({
      success: true,
      count: roles.length,
       roles
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verificar si un rol tiene un permiso específico
// @route   GET /api/admin/roles/:id/has-permission/:permission
// @access  Private (solo admins)
exports.checkRolePermission = async (req, res, next) => {
  try {
    const { id, permission } = req.params;

    const role = await AdminRole.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado.'
      });
    }

    const hasPerm = role.hasPermission(permission);

    res.json({
      success: true,
       hasPermission: hasPerm
    });

  } catch (error) {
    next(error);
  }
};