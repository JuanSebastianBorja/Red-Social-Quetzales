// ============================================
// RATING ROUTES - Rutas de Calificaciones
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getRatings,
  getRatingById,
  createRating,
  updateRating,
  deleteRating,
  getRatingsByService,
  getRatingsByUser,
  getRatingAverageByService
} = require('../controllers/ratingController');

// ============================================
// VALIDACIONES
// ============================================

const validateRating = [
  body('serviceId')
    .isUUID(4)
    .withMessage('El ID del servicio debe ser un UUID válido'),
  body('userId')
    .isUUID(4)
    .withMessage('El ID del usuario debe ser un UUID válido'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser un número entre 1 y 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('El comentario no debe superar los 500 caracteres')
];

const validateRatingId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de calificación inválido')
];

const validateServiceId = [
  param('serviceId')
    .isUUID(4)
    .withMessage('ID de servicio inválido')
];

const validateUserId = [
  param('userId')
    .isUUID(4)
    .withMessage('ID de usuario inválido')
];

const validateRatingFilters = [
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser un número entre 1 y 5'),
  query('serviceId')
    .optional()
    .isUUID(4)
    .withMessage('ID de servicio inválido'),
  query('userId')
    .optional()
    .isUUID(4)
    .withMessage('ID de usuario inválido'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página inválido'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite de resultados inválido')
];

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// GET /api/ratings - Obtener todas las calificaciones
router.get('/', auth, validateRatingFilters, getRatings);

// GET /api/ratings/:id - Obtener una calificación por ID
router.get('/:id', auth, validateRatingId, getRatingById);

// POST /api/ratings - Crear una nueva calificación
router.post('/', auth, validateRating, createRating);

// PUT /api/ratings/:id - Actualizar una calificación
router.put('/:id', auth, validateRatingId, validateRating, updateRating);

// DELETE /api/ratings/:id - Eliminar una calificación
router.delete('/:id', auth, validateRatingId, deleteRating);

// ============================================
// RUTAS PÚBLICAS (no requieren autenticación)
// ============================================

// GET /api/services/:serviceId/ratings - Obtener calificaciones de un servicio
router.get('/services/:serviceId/ratings', validateServiceId, getRatingsByService);

// GET /api/services/:serviceId/rating-average - Obtener promedio de calificaciones de un servicio
router.get('/services/:serviceId/rating-average', validateServiceId, getRatingAverageByService);

// GET /api/users/:userId/ratings - Obtener calificaciones de un usuario
router.get('/users/:userId/ratings', validateUserId, getRatingsByUser);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/ratings
- Retorna todas las calificaciones con filtros opcionales
- Parámetros: page, limit, rating, serviceId, userId
- Uso: Ver todas las calificaciones en el panel de administración

2. GET /api/ratings/:id
- Retorna una calificación específica por ID
- Uso: Ver detalles de una calificación

3. POST /api/ratings
- Crea una nueva calificación
- Body: { serviceId, userId, rating, comment }
- Uso: Crear calificaciones desde el frontend

4. PUT /api/ratings/:id
- Actualiza una calificación existente
- Body: { rating, comment }
- Uso: Editar una calificación ya creada

5. DELETE /api/ratings/:id
- Elimina una calificación (solo admins o el usuario que la creó)
- Uso: Eliminar calificaciones inválidas o incorrectas

6. GET /api/services/:serviceId/ratings
- Retorna todas las calificaciones de un servicio
- Parámetros: page, limit
- Uso: Ver calificaciones de un servicio específico

7. GET /api/services/:serviceId/rating-average
- Retorna el promedio de calificaciones de un servicio
- Uso: Mostrar rating promedio en el frontend

8. GET /api/users/:userId/ratings
- Retorna todas las calificaciones de un usuario
- Parámetros: page, limit
- Uso: Ver calificaciones hechas por un usuario

*/

module.exports = router;