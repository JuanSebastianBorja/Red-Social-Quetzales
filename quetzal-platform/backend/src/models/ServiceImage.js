// ============================================
// SERVICEIMAGE.JS - Modelo de Imágenes de Servicios
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServiceImage = sequelize.define('ServiceImage', {
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
    validate: {
      notEmpty: { msg: 'El ID del servicio es obligatorio.' },
      isUUID: { args: 4, msg: 'El ID del servicio debe tener formato UUID válido.' },
    },
  },

  imageUrl: {
  type: DataTypes.TEXT,
  allowNull: false,
  field: 'image_url',
  validate: {
    notEmpty: { msg: 'La URL de la imagen es obligatoria.' }
  },
  },
  
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_primary',
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'order_index',
    validate: {
      min: { args: [0], msg: 'El índice de orden no puede ser negativo.' },
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'service_images',
  timestamps: false, 
  underscored: true,
  indexes: [
    {
      fields: ['service_id'],
      name: 'idx_service_images_service_id',
    },
  ],
});

// MÉTODOS PERSONALIZADOS

// Buscar imágenes por servicio
ServiceImage.findByServiceId = async function (serviceId) {
  return await this.findAll({
    where: { serviceId },
    order: [['orderIndex', 'ASC']],
  });
};

// Obtener imagen principal de un servicio
ServiceImage.findPrimaryImage = async function (serviceId) {
  return await this.findOne({
    where: { serviceId, isPrimary: true },
  });
};

// Establecer una imagen como principal (reseteando las demás)
ServiceImage.setPrimaryImage = async function (serviceId, imageId) {
  const transaction = await sequelize.transaction();
  try {
    await this.update(
      { isPrimary: false },
      { where: { serviceId }, transaction }
    );
    await this.update(
      { isPrimary: true },
      { where: { id: imageId }, transaction }
    );
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw new Error('Error al establecer la imagen principal: ' + error.message);
  }
};

// Eliminar todas las imágenes de un servicio
ServiceImage.deleteByServiceId = async function (serviceId) {
  return await this.destroy({ where: { serviceId } });
};

module.exports = ServiceImage;