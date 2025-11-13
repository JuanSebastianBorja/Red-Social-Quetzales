// ============================================
// USERREPORT ROUTES - Rutas de Reportes de Usuario
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getUserReports,
  createUserReport,
  getUserReportById,
  updateUserReport,
  deleteUserReport,
  getUserReportsByUser,
  generateTransactionReport
} = require('../controllers/userReportController');

// ============================================
// VALIDACIONES
// ============================================

const validateUserReport = [
  body('reportType')
    .isIn(['transactions', 'earnings', 'tax', 'activity'])
    .withMessage('Tipo de reporte inválido'),
  body('dateRangeStart')
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('dateRangeEnd')
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  body('reportData')
    .isObject()
    .withMessage('Los datos del reporte deben ser un objeto JSON válido')
];

const validateUserReportId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de reporte inválido')
];

const validateUserId = [
  param('userId')
    .isUUID(4)
    .withMessage('ID de usuario inválido')
];

const validateTransactionReport = [
  body('dateRangeStart')
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('dateRangeEnd')
    .isISO8601()
    .withMessage('Fecha de fin inválida')
];

const validateUserReportFilters = [
  query('reportType')
    .optional()
    .isIn(['transactions', 'earnings', 'tax', 'activity'])
    .withMessage('Tipo de reporte inválido'),
  query('userId')
    .optional()
    .isUUID(4)
    .withMessage('ID de usuario inválido'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Fecha inicial inválida'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Fecha final inválida'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página inválido'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite de resultados inválido')
];

const validateUserReportUpdate = [
  ...validateUserReportId,
  body('reportType')
    .optional()
    .isIn(['transactions', 'earnings', 'tax', 'activity'])
    .withMessage('Tipo de reporte inválido'),
  body('dateRangeStart')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('dateRangeEnd')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  body('reportData')
    .optional()
    .isObject()
    .withMessage('Los datos del reporte deben ser un objeto JSON válido')
];

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// GET /api/user-reports - Obtener todos los reportes de usuario (solo admins)
router.get('/', auth, validateUserReportFilters, getUserReports);

// POST /api/user-reports - Crear un nuevo reporte de usuario
router.post('/', auth, validateUserReport, createUserReport);

// GET /api/user-reports/:id - Obtener un reporte por ID
router.get('/:id', auth, validateUserReportId, getUserReportById);

// PUT /api/user-reports/:id - Actualizar un reporte de usuario
router.put('/:id', auth, validateUserReportUpdate, updateUserReport);

// DELETE /api/user-reports/:id - Eliminar un reporte de usuario
router.delete('/:id', auth, validateUserReportId, deleteUserReport);

// GET /api/users/:userId/reports - Obtener reportes de un usuario
router.get('/users/:userId/reports', auth, validateUserId, validateUserReportFilters, getUserReportsByUser);

// POST /api/user-reports/transactions - Generar reporte de transacciones
router.post('/transactions', auth, validateTransactionReport, generateTransactionReport);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/user-reports
- Retorna todos los reportes de usuario (solo admins)
- Parámetros: page, limit, reportType, userId, dateFrom, dateTo
- Uso: Ver todos los reportes en el panel de administración

2. POST /api/user-reports
- Crea un nuevo reporte de usuario
- Body: { reportType, dateRangeStart, dateRangeEnd, reportData }
- Uso: Crear reportes personalizados

3. GET /api/user-reports/:id
- Retorna un reporte específico por ID
- Uso: Ver detalles de un reporte

4. PUT /api/user-reports/:id
- Actualiza un reporte existente (solo admins)
- Body: { reportType, dateRangeStart, dateRangeEnd, reportData }
- Uso: Corregir o actualizar datos de un reporte

5. DELETE /api/user-reports/:id
- Elimina un reporte (solo admins)
- Uso: Eliminar reportes inválidos

6. GET /api/users/:userId/reports
- Retorna todos los reportes de un usuario
- Parámetros: page, limit, reportType, dateFrom, dateTo
- Uso: Ver historial de reportes de un usuario

7. POST /api/user-reports/transactions
- Genera un reporte de transacciones para el usuario autenticado
- Body: { dateRangeStart, dateRangeEnd }
- Uso: Generar reporte de transacciones (HU22)

*/

module.exports = router;