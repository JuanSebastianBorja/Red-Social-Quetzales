// ============================================
// ADMINROLE.JS -
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminRole = sequelize.define('AdminRole', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roleName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'role_name',
    validate: {
      notEmpty: { msg: 'El nombre del rol es obligatorio' },
      len: { args: [3, 50], msg: 'El nombre del rol debe tener entre 3 y 50 caracteres' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },

  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admin_roles',
  timestamps: true,        
  createdAt: 'created_at', 
  updatedAt: false,        
  underscored: true
});

// Métodos de utilidad (mantenidos)
AdminRole.findByName = async function (roleName) {
  return await this.findOne({ where: { roleName } });
};

AdminRole.findAllWithPermissions = async function () {
  return await this.findAll({ attributes: ['id', 'roleName', 'permissions'] });
};

// Métodos adicionales útiles
AdminRole.findByPermission = async function (permissionKey) {
  const { Op } = require('sequelize');
  return await this.findAll({
    where: {
      permissions: {
        [Op.contains]: { [permissionKey]: true }
      }
    }
  });
};

// Método para verificar permisos
AdminRole.prototype.hasPermission = function(permission) {
  return this.permissions?.all === true || this.permissions?.[permission] === true;
};

module.exports = AdminRole;