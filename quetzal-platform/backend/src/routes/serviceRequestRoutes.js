// ============================================
// SERVICEREQUEST ROUTES - Rutas de Solicitudes de Servicio
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getServiceRequests,
  getServiceRequestById,
  createServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceRequestsByService,
  getServiceRequestsByUser
} = require('../controllers/serviceRequestController');

// ============================================
// VALIDACIONES
// ============================================

const validateServiceRequest = [
  body('serviceId')
    .isUUID(4)
    .withMessage('El ID del servicio debe ser un UUID válido'),
  body('buyerId')
    .isUUID(4)
    .withMessage('El ID del comprador debe ser un UUID válido'),
  body('sellerId')
    .isUUID(4)
    .withMessage('El ID del vendedor debe ser un UUID válido'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('El mensaje no debe superar los 1000 caracteres'),
  body('proposedPrice')
    .optional()
    .isDecimal({ decimal_digits: '2' })
    .withMessage('El precio propuesto debe ser un número decimal válido'),
  body('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'negotiating'])
    .withMessage('Estado inválido')
];

const validateServiceRequestId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de solicitud inválido')
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

const validateServiceRequestFilters = [
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'negotiating'])
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

// GET /api/service-requests - Obtener todas las solicitudes de servicio
router.get('/', auth, validateServiceRequestFilters, getServiceRequests);

// GET /api/service-requests/:id - Obtener una solicitud por ID
router.get('/:id', auth, validateServiceRequestId, getServiceRequestById);

// POST /api/service-requests - Crear una nueva solicitud
router.post('/', auth, validateServiceRequest, createServiceRequest);

// PUT /api/service-requests/:id - Actualizar una solicitud
router.put('/:id', auth, validateServiceRequestId, validateServiceRequest, updateServiceRequest);

// DELETE /api/service-requests/:id - Eliminar una solicitud
router.delete('/:id', auth, validateServiceRequestId, deleteServiceRequest);

// GET /api/services/:serviceId/requests - Obtener solicitudes de un servicio
router.get('/services/:serviceId/requests', auth, validateServiceId, getServiceRequestsByService);

// GET /api/users/:userId/requests - Obtener solicitudes de un usuario
router.get('/users/:userId/requests', auth, validateUserId, getServiceRequestsByUser);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/service-requests
- Retorna todas las solicitudes de servicio con filtros opcionales
- Parámetros: page, limit, status, serviceId, buyerId, sellerId
- Uso: Ver todas las solicitudes en el panel de administración

2. GET /api/service-requests/:id
- Retorna una solicitud específica por ID
- Uso: Ver detalles de una solicitud

3. POST /api/service-requests
- Crea una nueva solicitud de servicio
- Body: { serviceId, buyerId, sellerId, message, proposedPrice }
- Uso: Crear una solicitud desde el frontend

4. PUT /api/service-requests/:id
- Actualiza una solicitud existente
- Body: { status, rejectionReason, proposedPrice, negotiatedPrice, termsAgreed }
- Uso: Aceptar, rechazar o negociar una solicitud

5. DELETE /api/service-requests/:id
- Elimina una solicitud (solo admins o usuarios involucrados)
- Uso: Eliminar solicitudes inválidas o canceladas

6. GET /api/services/:serviceId/requests
- Retorna todas las solicitudes de un servicio
- Parámetros: page, limit, status
- Uso: Ver solicitudes de un servicio específico

7. GET /api/users/:userId/requests
- Retorna todas las solicitudes de un usuario (como comprador o vendedor)
- Parámetros: page, limit, role, status
- Uso: Ver solicitudes del usuario en su perfil

*/

module.exports = router;