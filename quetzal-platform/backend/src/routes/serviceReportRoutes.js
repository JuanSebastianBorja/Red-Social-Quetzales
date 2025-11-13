// ============================================
// SERVICEREPORT ROUTES - Rutas de Reportes de Servicios
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getServiceReports,
  createServiceReport,
  getServiceReportById,
  updateServiceReport,
  deleteServiceReport,
  getServiceReportsByUser,
  getServiceReportsByService
} = require('../controllers/serviceReportController');

// ============================================
// VALIDACIONES
// ============================================

const validateServiceReport = [
  body('serviceId')
    .isUUID(4)
    .withMessage('El ID del servicio debe ser un UUID válido'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('El motivo del reporte es obligatorio'),
  body('reason')
    .isLength({ max: 500 })
    .withMessage('El motivo no debe superar los 500 caracteres')
];

const validateServiceReportId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de reporte inválido')
];

const validateUserId = [
  param('userId')
    .isUUID(4)
    .withMessage('ID de usuario inválido')
];

const validateServiceId = [
  param('serviceId')
    .isUUID(4)
    .withMessage('ID de servicio inválido')
];

const validateServiceReportUpdate = [
  ...validateServiceReportId,
  body('status')
    .isIn(['pending', 'reviewed', 'dismissed', 'action_taken'])
    .withMessage('Estado inválido'),
  body('reviewedBy')
    .optional()
    .isUUID(4)
    .withMessage('El ID del revisor debe ser un UUID válido'),
  body('adminNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Las notas del admin no deben superar los 1000 caracteres')
];

const validateServiceReportFilters = [
  query('status')
    .optional()
    .isIn(['pending', 'reviewed', 'dismissed', 'action_taken'])
    .withMessage('Estado inválido'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página inválido'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite de resultados inválido'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt'])
    .withMessage('Campo de ordenamiento inválido')
];

const validateUserReportFilters = [
  ...validateUserId,
  query('status')
    .optional()
    .isIn(['pending', 'reviewed', 'dismissed', 'action_taken'])
    .withMessage('Estado inválido'),
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

// GET /api/service-reports - Obtener todos los reportes de servicios (solo admins)
router.get('/', auth, validateServiceReportFilters, getServiceReports);

// POST /api/service-reports - Crear un nuevo reporte de servicio
router.post('/', auth, validateServiceReport, createServiceReport);

// GET /api/service-reports/:id - Obtener un reporte por ID
router.get('/:id', auth, validateServiceReportId, getServiceReportById);

// PUT /api/service-reports/:id - Actualizar un reporte (resolverlo)
router.put('/:id', auth, validateServiceReportUpdate, updateServiceReport);

// DELETE /api/service-reports/:id - Eliminar un reporte
router.delete('/:id', auth, validateServiceReportId, deleteServiceReport);

// GET /api/users/:userId/reports - Obtener reportes de un usuario
router.get('/users/:userId/reports', auth, validateUserReportFilters, getServiceReportsByUser);

// GET /api/services/:serviceId/reports - Obtener reportes de un servicio
router.get('/services/:serviceId/reports', auth, validateServiceId, getServiceReportsByService);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/service-reports
- Retorna todos los reportes de servicios (solo admins)
- Parámetros: page, limit, status, sortBy
- Uso: Ver todos los reportes en el panel de administración

2. POST /api/service-reports
- Crea un nuevo reporte de servicio
- Body: { serviceId, reason }
- Uso: Reportar un servicio inapropiado

3. GET /api/service-reports/:id
- Retorna un reporte específico por ID
- Uso: Ver detalles de un reporte

4. PUT /api/service-reports/:id
- Actualiza un reporte (resolverlo)
- Body: { status, reviewedBy, adminNotes }
- Uso: Resolver o rechazar un reporte (admin)

5. DELETE /api/service-reports/:id
- Elimina un reporte (solo admins)
- Uso: Eliminar reportes inválidos

6. GET /api/users/:userId/reports
- Retorna todos los reportes hechos por un usuario
- Parámetros: page, limit, status
- Uso: Ver historial de reportes de un usuario

7. GET /api/services/:serviceId/reports
- Retorna todos los reportes de un servicio
- Uso: Ver reportes recibidos por un servicio

*/

module.exports = router;