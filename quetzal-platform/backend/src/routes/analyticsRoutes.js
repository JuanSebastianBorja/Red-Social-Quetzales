// ============================================
// ANALYTICS ROUTES - Rutas de Analytics
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getAnalytics,
  createAnalytics,
  getAnalyticsById,
  updateAnalytics,
  deleteAnalytics,
  getAnalyticsByUser,
  getAnalyticsByAction,
  getAnalyticsByEntity
} = require('../controllers/analyticsController');

// ============================================
// VALIDACIONES
// ============================================

const validateAnalytics = [
  body('action')
    .trim()
    .notEmpty()
    .withMessage('La acción es obligatoria'),
  body('action')
    .isLength({ max: 100 })
    .withMessage('La acción no debe superar los 100 caracteres'),
  body('entityType')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El tipo de entidad no debe superar los 50 caracteres'),
  body('entityId')
    .optional()
    .isUUID(4)
    .withMessage('El ID de entidad debe ser un UUID válido'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Los metadatos deben ser un objeto JSON válido'),
  body('ipAddress')
    .optional()
    .isIP()
    .withMessage('La dirección IP debe ser válida'),
  body('userAgent')
    .optional()
    .isLength({ max: 500 })
    .withMessage('El agente de usuario no debe superar los 500 caracteres')
];

const validateAnalyticsId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de analytics inválido')
];

const validateUserId = [
  param('userId')
    .isUUID(4)
    .withMessage('ID de usuario inválido')
];

const validateEntity = [
  param('entityType')
    .trim()
    .notEmpty()
    .withMessage('El tipo de entidad es obligatorio'),
  param('entityId')
    .isUUID(4)
    .withMessage('El ID de entidad debe ser un UUID válido')
];

const validateAction = [
  param('actionName')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la acción es obligatorio')
];

const validateAnalyticsFilters = [
  query('action')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La acción no debe superar los 100 caracteres'),
  query('entityType')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El tipo de entidad no debe superar los 50 caracteres'),
  query('userId')
    .optional()
    .isUUID(4)
    .withMessage('El ID de usuario debe ser un UUID válido'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('La fecha inicial debe ser válida'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('La fecha final debe ser válida'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página inválido'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite de resultados inválido')
];

const validateUserAnalyticsFilters = [
  ...validateUserId,
  query('action')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La acción no debe superar los 100 caracteres'),
  query('entityType')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El tipo de entidad no debe superar los 50 caracteres'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('La fecha inicial debe ser válida'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('La fecha final debe ser válida'),
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

// GET /api/analytics - Obtener todas las métricas de analytics (solo admins)
router.get('/', auth, validateAnalyticsFilters, getAnalytics);

// POST /api/analytics - Crear una nueva métrica de analytics
router.post('/', auth, validateAnalytics, createAnalytics);

// GET /api/analytics/:id - Obtener una métrica por ID
router.get('/:id', auth, validateAnalyticsId, getAnalyticsById);

// PUT /api/analytics/:id - Actualizar una métrica (resolverla)
router.put('/:id', auth, validateAnalyticsId, validateAnalytics, updateAnalytics);

// DELETE /api/analytics/:id - Eliminar una métrica
router.delete('/:id', auth, validateAnalyticsId, deleteAnalytics);

// GET /api/users/:userId/analytics - Obtener analytics de un usuario
router.get('/users/:userId/analytics', auth, validateUserAnalyticsFilters, getAnalyticsByUser);

// GET /api/analytics/action/:actionName - Obtener analytics por acción
router.get('/action/:actionName', auth, validateAction, validateAnalyticsFilters, getAnalyticsByAction);

// GET /api/analytics/entity/:entityType/:entityId - Obtener analytics por entidad
router.get('/entity/:entityType/:entityId', auth, validateEntity, validateAnalyticsFilters, getAnalyticsByEntity);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/analytics
- Retorna todas las métricas de analytics (solo admins)
- Parámetros: page, limit, action, entityType, userId, dateFrom, dateTo
- Uso: Ver todas las métricas en el panel de administración

2. POST /api/analytics
- Crea una nueva métrica de analytics
- Body: { action, entityType, entityId, metadata, ipAddress, userAgent }
- Uso: Registrar eventos del sistema (vistas, clics, etc.)

3. GET /api/analytics/:id
- Retorna una métrica específica por ID
- Uso: Ver detalles de una métrica

4. PUT /api/analytics/:id
- Actualiza una métrica (resolverla)
- Body: { action, entityType, entityId, metadata }
- Uso: Corregir o actualizar datos de una métrica (admin)

5. DELETE /api/analytics/:id
- Elimina una métrica (solo admins)
- Uso: Eliminar métricas inválidas

6. GET /api/users/:userId/analytics
- Retorna todas las métricas de un usuario
- Parámetros: page, limit, action, entityType, dateFrom, dateTo
- Uso: Ver historial de acciones de un usuario

7. GET /api/analytics/action/:actionName
- Retorna todas las métricas de una acción específica
- Parámetros: page, limit, userId, dateFrom, dateTo
- Uso: Ver frecuencia de una acción en el sistema

8. GET /api/analytics/entity/:entityType/:entityId
- Retorna todas las métricas de una entidad específica
- Parámetros: page, limit, userId, dateFrom, dateTo
- Uso: Ver historial de una entidad (servicio, transacción, etc.)

*/

module.exports = router;