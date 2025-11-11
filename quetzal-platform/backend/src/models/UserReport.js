// ============================================
// USERREPORT.JS - Modelo de Reportes de Usuario
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); 
const User = require('./User'); 

const UserReport = sequelize.define('UserReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  report_type: {
    type: DataTypes.ENUM('transactions', 'earnings', 'tax', 'activity'),
    allowNull: false,
  },
  date_range_start: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  date_range_end: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  report_data: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  generated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  download_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'user_reports',
  timestamps: false, 
  underscored: true, 
});

// RELACIONES
//UserReport.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = UserReport;
