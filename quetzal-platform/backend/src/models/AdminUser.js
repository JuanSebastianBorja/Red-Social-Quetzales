// AdminUser.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Debe ser un email válido' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: { args: [8, 255], msg: 'La contraseña debe tener al menos 8 caracteres' }
    }
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'full_name',
    validate: {
      notEmpty: { msg: 'El nombre completo es obligatorio' }
    }
  },
  roleId: { // ✅ Cambiado a camelCase
    type: DataTypes.UUID,
    allowNull: false,
    field: 'role_id', // ✅ Campo real en la base de datos
    references: {
      model: 'admin_roles', // ✅ Nombre real de la tabla
      key: 'id'
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  }
}, {
  tableName: 'admin_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['is_active'] }
  ],
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    }
  }
});

// Métodos de instancia
AdminUser.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

AdminUser.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Métodos estáticos
AdminUser.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

AdminUser.findActiveAdmins = async function() {
  return await this.findAll({
    where: { isActive: true },
    attributes: { exclude: ['password'] }
  });
};

module.exports = AdminUser;