// ============================================
// RATING.JS - Modelo de Calificaciones
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rating = sequelize.define(
  'Rating',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'service_id',
      references: {
        model: 'services',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'La calificación mínima es 1.' },
        max: { args: [5], msg: 'La calificación máxima es 5.' },
      },
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    tableName: 'ratings',
    timestamps: false, 
    indexes: [
      { fields: ['service_id'] },
      { fields: ['user_id'] },
      { fields: ['rating'] },
    ],
    uniqueKeys: {
      unique_rating_per_user_service: {
        fields: ['service_id', 'user_id'],
      },
    },
  }
);

module.exports = Rating;
