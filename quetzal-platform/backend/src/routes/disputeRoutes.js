// ============================================
// DISPUTE ROUTES - Rutas de Disputas
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getDisputes,
  createDispute,
  getDisputeById,
  updateDispute,
  deleteDispute,
  getDisputesByUser,
  getDisputesByEscrow
} = require('../controllers/disputeController');

// ============================================
// VALIDACIONES
// ============================================

const validateDispute = [
  body('escrowId')
    .isUUID(4)
    .withMessage('El ID de la cuenta de garantía debe ser un UUID válido'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('El motivo de la disputa es obligatorio'),
  body('evidenceUrls')
    .optional()
    .isArray()
    .withMessage('Las pruebas deben ser un array de URLs'),
  body('evidenceUrls.*')
    .optional()
    .isURL()
    .withMessage('Cada URL de evidencia debe ser válida')
];

const validateDisputeId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de disputa inválido')
];

const validateUserId = [
  param('userId')
    .isUUID(4)
    .withMessage('ID de usuario inválido')
];

const validateEscrowId = [
  param('escrowId')
    .isUUID(4)
    .withMessage('ID de cuenta de garantía inválido')
];

const validateDisputeUpdate = [
  ...validateDisputeId,
  body('status')
    .isIn(['open', 'in_review', 'resolved', 'dismissed'])
    .withMessage('Estado inválido'),
  body('resolution')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La resolución no puede estar vacía')
];

const validateDisputeFilters = [
  query('status')
    .optional()
    .isIn(['open', 'in_review', 'resolved', 'dismissed'])
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

const validateUserDisputeFilters = [
  ...validateUserId,
  query('role')
    .optional()
    .isIn(['complainant', 'respondent'])
    .withMessage('Rol inválido'),
  query('status')
    .optional()
    .isIn(['open', 'in_review', 'resolved', 'dismissed'])
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

// GET /api/disputes - Obtener todas las disputas (solo admins)
router.get('/', auth, validateDisputeFilters, getDisputes);

// POST /api/disputes - Crear una nueva disputa
router.post('/', auth, validateDispute, createDispute);

// GET /api/disputes/:id - Obtener una disputa por ID
router.get('/:id', auth, validateDisputeId, getDisputeById);

// PUT /api/disputes/:id - Actualizar una disputa (resolverla)
router.put('/:id', auth, validateDisputeUpdate, updateDispute);

// DELETE /api/disputes/:id - Eliminar una disputa
router.delete('/:id', auth, validateDisputeId, deleteDispute);

// GET /api/users/:userId/disputes - Obtener disputas de un usuario
router.get('/users/:userId/disputes', auth, validateUserDisputeFilters, getDisputesByUser);

// GET /api/escrows/:escrowId/disputes - Obtener disputas por cuenta de garantía
router.get('/escrows/:escrowId/disputes', auth, validateEscrowId, getDisputesByEscrow);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/disputes
- Retorna todas las disputas (solo admins)
- Parámetros: page, limit, status, sortBy
- Uso: Ver todas las disputas en el panel de administración

2. POST /api/disputes
- Crea una nueva disputa
- Body: { escrowId, reason, evidenceUrls }
- Uso: Crear disputa desde el frontend

3. GET /api/disputes/:id
- Retorna una disputa específica por ID
- Uso: Ver detalles de una disputa

4. PUT /api/disputes/:id
- Actualiza una disputa (resolverla)
- Body: { status, resolution }
- Uso: Resolver o rechazar una disputa (admin)

5. DELETE /api/disputes/:id
- Elimina una disputa (solo admins)
- Uso: Eliminar disputas inválidas

6. GET /api/users/:userId/disputes
- Retorna todas las disputas de un usuario (como denunciante o demandado)
- Parámetros: role, status, page, limit
- Uso: Ver disputas de un usuario en su perfil

7. GET /api/escrows/:escrowId/disputes
- Retorna todas las disputas de una cuenta de garantía
- Uso: Ver disputas de una transacción específica

*/

module.exports = router;