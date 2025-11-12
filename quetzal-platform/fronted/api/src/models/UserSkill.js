// ============================================
// USERSKILL.JS - Modelo de Habilidades de Usuario
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User'); 

const UserSkill = sequelize.define('UserSkill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
    validate: {
      isUUID: {
        args: 4,
        msg: 'El ID del usuario debe ser un UUID válido',
      },
    },
  },
  skillName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'skill_name',
    set(value) {
      this.setDataValue('skillName', value.trim());
    },
    validate: {
      notEmpty: {
        msg: 'El nombre de la habilidad es obligatorio',
      },
      len: {
        args: [2, 100],
        msg: 'El nombre de la habilidad debe tener entre 2 y 100 caracteres',
      },
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'user_skills',
  timestamps: false, 
  indexes: [
    {
      name: 'idx_user_skills_user_id',
      fields: ['user_id'],
    },
  ],
});

// RELACIONES
/**UserSkill.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
});**/

// MÉTODOS PERSONALIZADOS

// Obtener todas las habilidades de un usuario
UserSkill.findByUserId = async function (userId) {
  return await this.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
};

// ➕ Agregar una habilidad (evita duplicados)
UserSkill.addSkill = async function (userId, skillName) {
  const normalizedSkill = skillName.trim();

  const exists = await this.findOne({
    where: { userId, skillName: normalizedSkill },
  });

  if (exists) {
    throw new Error('Esta habilidad ya está registrada para este usuario');
  }

  return await this.create({ userId, skillName: normalizedSkill });
};

// Eliminar una habilidad específica
UserSkill.removeSkill = async function (userId, skillName) {
  const deleted = await this.destroy({
    where: { userId, skillName: skillName.trim() },
  });

  if (!deleted) {
    throw new Error('No se encontró la habilidad para eliminar');
  }

  return deleted;
};

// Eliminar todas las habilidades de un usuario
UserSkill.removeAllByUser = async function (userId) {
  return await this.destroy({ where: { userId } });
};

module.exports = UserSkill;
