// ============================================
// SERVICEIMAGE ROUTES - Rutas de Imágenes de Servicio
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const { uploadImage, getImagesByService, getImageById, updateImage, deleteImage } = require('../controllers/ServiceImageController');

// Validaciones
const validateImage = [
  body('imageUrl').isURL().withMessage('Debe ser una URL válida.'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary debe ser booleano.'),
  body('orderIndex').optional().isInt({ min: 0 }).withMessage('orderIndex debe ser un número entero positivo.')
];

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// POST /api/services/:serviceId/images - Subir imagen para un servicio
router.post('/services/:serviceId/images', auth, validateImage, uploadImage);

// PUT /api/service-images/:id - Actualizar imagen
router.put('/service-images/:id', auth, validateImage, updateImage);

// DELETE /api/service-images/:id - Eliminar imagen
router.delete('/service-images/:id', auth, deleteImage);

// ============================================
// RUTAS PÚBLICAS
// ============================================

// GET /api/services/:serviceId/images - Obtener imágenes de un servicio
router.get('/services/:serviceId/images', getImagesByService);

// GET /api/service-images/:id - Obtener imagen por ID
router.get('/service-images/:id', getImageById);

module.exports = router;