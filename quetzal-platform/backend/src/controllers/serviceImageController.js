const path = require('path');
const { Service, ServiceImage } = require('../models');

// ============================================
// SUBIR IMÁGENES
// ============================================
exports.uploadServiceImages = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    if (service.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para subir imágenes'
      });
    }

    const existing = await ServiceImage.count({ where: { serviceId } });

    const images = await Promise.all(
      req.files.map((file, i) =>
        ServiceImage.create({
          serviceId,
          imageUrl: `/uploads/service_images/${file.filename}`,
          isPrimary: false,
          orderIndex: existing + i
        })
      )
    );

    const hasPrimary = await ServiceImage.findOne({
      where: { serviceId, isPrimary: true }
    });

    if (!hasPrimary && images.length > 0) {
      await images[0].update({ isPrimary: true });
    }

    res.status(201).json({
      success: true,
      message: 'Imágenes subidas exitosamente',
      data: images
    });

  } catch (err) {
    next(err);
  }
};

// ============================================
// GET IMÁGENES DE UN SERVICIO
// ============================================
exports.getImagesByService = async (req, res) => {
  const images = await ServiceImage.findAll({
    where: { serviceId: req.params.serviceId },
    order: [['orderIndex', 'ASC']]
  });

  res.json({ success: true, data: images });
};
