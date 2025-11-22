// ============================================
// USER ROUTES - Rutas para usuarios
// ============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Desestructura aquí
const { body } = require('express-validator');
const { 
  getProfile,
  updateProfile,
  getUserById,
  searchUsers,
  getUserServices,
  getUserSkills,
  deleteAccount,
  getUserStats 
} = require('../controllers/userController');

// ============================================
// VALIDACIONES
// ============================================

const updateUserValidation = [
  body('fullName').optional().isLength({ min: 2, max: 255 }).withMessage('Nombre debe tener entre 2 y 255 caracteres'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phone').optional().isLength({ max: 50 }).withMessage('Teléfono demasiado largo'),
  body('city').optional().isLength({ max: 100 }).withMessage('Ciudad demasiado larga'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Biografía demasiado larga'),
  body('website').optional().isURL().withMessage('URL inválida')
];

// ============================================
// RUTAS PÚBLICAS (no requieren autenticación)
// ============================================

// GET /api/users/:id - Obtener un usuario por ID
router.get('/:id', getUserById);

// GET /api/users/search - Buscar usuarios por filtros
router.get('/search', searchUsers);

// GET /api/users/:id/services - Obtener servicios de un usuario
router.get('/:id/services', getUserServices);

// GET /api/users/:id/skills - Obtener habilidades de un usuario
router.get('/:id/skills', getUserSkills);

// GET /api/users/:id/stats - Obtener estadísticas de un usuario
router.get('/:id/stats', getUserStats);

// ============================================
// RUTAS PRIVADAS (requieren autenticación)
// ============================================

// GET /api/users/profile - Obtener mi perfil
router.get('/profile', protect, getProfile); // <-- Cambiado 'auth' por 'protect'

// PUT /api/users/profile - Actualizar mi perfil
router.put('/profile', protect, updateUserValidation, updateProfile); // <-- Cambiado 'auth' por 'protect'

// DELETE /api/users/profile - Eliminar mi cuenta
router.delete('/profile', protect, deleteAccount); // <-- Cambiado 'auth' por 'protect'

// ============================================
// RUTAS DE ADMINISTRADOR (requieren rol admin)
// ============================================

// GET /api/users - Obtener todos los usuarios
router.get('/', protect, (req, res) => { // <-- Cambiado 'auth' por 'protect'
  // TODO: Implementar lógica de administrador
  res.json({ message: 'Obtener todos los usuarios', status: 'en desarrollo' });
});

// PUT /api/users/:id - Actualizar un usuario (admin)
router.put('/:id', protect, updateUserValidation, (req, res) => { // <-- Cambiado 'auth' por 'protect'
  // TODO: Implementar lógica de administrador
  res.json({ message: `Actualizar usuario ${req.params.id}`, body: req.body, status: 'en desarrollo' });
});

// DELETE /api/users/:id - Eliminar un usuario (admin)
router.delete('/:id', protect, (req, res) => { // <-- Cambiado 'auth' por 'protect'
  // TODO: Implementar lógica de administrador
  res.json({ message: `Eliminar usuario ${req.params.id}`, status: 'en desarrollo' });
});

module.exports = router;