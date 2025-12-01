// ============================================
// SERVICEIMAGE ROUTES - Rutas de Imágenes de Servicio
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { uploadServiceImages, getImagesByService } = require('../controllers/ServiceImageController');

// Configurar almacenamiento para multer
const uploadDir = path.join(process.cwd(), 'uploads', 'service_images');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (_) {}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, unique + '-' + safeName);
  }
});
const upload = multer({ storage });

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
router.post('/services/:serviceId/images/upload', auth.protect, upload.array('images', 10), uploadServiceImages);


// ============================================
// RUTAS PÚBLICAS
// ============================================

router.get('/services/:serviceId/images', getImagesByService);

module.exports = router;
