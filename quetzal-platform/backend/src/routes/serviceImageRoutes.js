// ============================================
// SERVICEIMAGE ROUTES - Rutas de Imágenes de Servicio
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const {upload, uploadServiceImages, getImagesByService} = require('../controllers/ServiceImageController');

// Validaciones
const validateImage = [
  body('imageUrl').isURL().withMessage('Debe ser una URL válida.'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary debe ser booleano.'),
  body('orderIndex').optional().isInt({ min: 0 }).withMessage('orderIndex debe ser un número entero positivo.')
];

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Subir imágenes usando Multer
router.post('/services/:serviceId/images/upload', auth.protect, uploadServiceImages);


// ============================================
// RUTAS PÚBLICAS
// ============================================

router.get('/services/:serviceId/images', getImagesByService);

module.exports = router;
