// ============================================
// ESCROW ROUTES - Rutas de Cuentas en Garantía (Escrow)
// ============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getEscrows,
  getEscrowById,
  createEscrow,
  updateEscrow,
  deleteEscrow,
  getEscrowsByService,
  getEscrowsByUser
} = require('../controllers/escrowController');

// ============================================
// VALIDACIONES
// ============================================

const validateEscrow = [
  body('serviceId')
    .isUUID(4)
    .withMessage('El ID del servicio debe ser un UUID válido'),
  body('buyerId')
    .isUUID(4)
    .withMessage('El ID del comprador debe ser un UUID válido'),
  body('sellerId')
    .isUUID(4)
    .withMessage('El ID del vendedor debe ser un UUID válido'),
  body('amount')
    .isDecimal({ decimal_digits: '2' })
    .withMessage('El monto debe ser un número decimal válido'),
  body('status')
    .optional()
    .isIn(['pending', 'funded', 'released', 'refunded', 'disputed'])
    .withMessage('Estado inválido')
];

const validateEscrowId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de escrow inválido')
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

const validateEscrowFilters = [
  query('status')
    .optional()
    .isIn(['pending', 'funded', 'released', 'refunded', 'disputed'])
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

// GET /api/escrow - Obtener todas las cuentas de garantía
router.get('/', protect, validateEscrowFilters, getEscrows); // <-- Cambiado 'auth' por 'protect'

// GET /api/escrow/:id - Obtener una cuenta de garantía por ID
router.get('/:id', protect, validateEscrowId, getEscrowById); // <-- Cambiado 'auth' por 'protect'

// POST /api/escrow - Crear una nueva cuenta de garantía
router.post('/', protect, validateEscrow, createEscrow); // <-- Cambiado 'auth' por 'protect'

// PUT /api/escrow/:id - Actualizar una cuenta de garantía
router.put('/:id', protect, validateEscrowId, validateEscrow, updateEscrow); // <-- Cambiado 'auth' por 'protect'

// DELETE /api/escrow/:id - Eliminar una cuenta de garantía
router.delete('/:id', protect, validateEscrowId, deleteEscrow); // <-- Cambiado 'auth' por 'protect'

// GET /api/services/:serviceId/escrows - Obtener cuentas de garantía de un servicio
router.get('/services/:serviceId/escrows', protect, validateServiceId, getEscrowsByService); // <-- Cambiado 'auth' por 'protect'

// GET /api/users/:userId/escrows - Obtener cuentas de garantía de un usuario
router.get('/users/:userId/escrows', protect, validateUserId, getEscrowsByUser); // <-- Cambiado 'auth' por 'protect'

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/escrow
- Retorna todas las cuentas de garantía con filtros opcionales
- Parámetros: page, limit, status, serviceId, buyerId, sellerId
- Uso: Ver todas las cuentas de garantía en el panel de administración

2. GET /api/escrow/:id
- Retorna una cuenta de garantía específica por ID
- Uso: Ver detalles de una cuenta de garantía

3. POST /api/escrow
- Crea una nueva cuenta de garantía
- Body: { serviceId, buyerId, sellerId, amount }
- Uso: Crear una cuenta de garantía para un servicio

4. PUT /api/escrow/:id
- Actualiza una cuenta de garantía existente
- Body: { status, disputeReason }
- Uso: Actualizar estado o razón de disputa

5. DELETE /api/escrow/:id
- Elimina una cuenta de garantía (solo admins)
- Uso: Eliminar cuentas de garantía inválidas

6. GET /api/services/:serviceId/escrows
- Retorna todas las cuentas de garantía de un servicio
- Parámetros: page, limit, status
- Uso: Ver garantías de un servicio específico

7. GET /api/users/:userId/escrows
- Retorna todas las garantías de un usuario (como comprador o vendedor)
- Parámetros: page, limit, role, status
- Uso: Ver garantías del usuario en su perfil

*/

module.exports = router;