// ============================================
// TRANSACTION ROUTES - Rutas de Transacciones
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByWallet,
  getWalletBalance
} = require('../controllers/transactionController');

// ============================================
// VALIDACIONES
// ============================================

const validateTransaction = [
  body('walletId')
    .isUUID(4)
    .withMessage('El ID de la wallet debe ser un UUID válido'),
  body('type')
    .isIn(['purchase', 'transfer_in', 'transfer_out', 'withdrawal', 'payment', 'refund', 'deposit'])
    .withMessage('Tipo de transacción inválido'),
  body('amount')
    .isDecimal({ decimal_digits: '2' })
    .withMessage('El monto debe ser un número decimal válido'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'cancelled'])
    .withMessage('Estado de transacción inválido')
];

const validateTransactionId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de transacción inválido')
];

const validateWalletId = [
  param('walletId')
    .isUUID(4)
    .withMessage('ID de wallet inválido')
];

const validateTransactionFilters = [
  query('type')
    .optional()
    .isIn(['purchase', 'transfer_in', 'transfer_out', 'withdrawal', 'payment', 'refund', 'deposit'])
    .withMessage('Tipo de transacción inválido'),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'cancelled'])
    .withMessage('Estado de transacción inválido'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
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

// GET /api/transactions - Obtener todas las transacciones
router.get('/', auth, validateTransactionFilters, getTransactions);

// GET /api/transactions/:id - Obtener una transacción por ID
router.get('/:id', auth, validateTransactionId, getTransactionById);

// POST /api/transactions - Crear una nueva transacción
router.post('/', auth, validateTransaction, createTransaction);

// PUT /api/transactions/:id - Actualizar una transacción
router.put('/:id', auth, validateTransactionId, validateTransaction, updateTransaction);

// DELETE /api/transactions/:id - Eliminar una transacción
router.delete('/:id', auth, validateTransactionId, deleteTransaction);

// GET /api/wallets/:walletId/transactions - Obtener transacciones de una wallet específica
router.get('/wallets/:walletId/transactions', auth, validateWalletId, getTransactionsByWallet);

// GET /api/wallets/:walletId/balance - Obtener balance de una wallet
router.get('/wallets/:walletId/balance', auth, validateWalletId, getWalletBalance);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/transactions
- Retorna todas las transacciones con filtros opcionales
- Parámetros: page, limit, type, status, startDate, endDate, walletId
- Uso: Ver todas las transacciones en el panel de administración

2. GET /api/transactions/:id
- Retorna una transacción específica por ID
- Uso: Ver detalles de una transacción

3. POST /api/transactions
- Crea una nueva transacción
- Body: { walletId, type, amount, description, referenceId, status }
- Uso: Registrar pagos, depósitos, etc.

4. PUT /api/transactions/:id
- Actualiza una transacción existente
- Body: { type, amount, description, referenceId, status }
- Uso: Corregir o actualizar estado de una transacción

5. DELETE /api/transactions/:id
- Elimina una transacción (solo admins)
- Uso: Eliminar transacciones inválidas o incorrectas

6. GET /api/wallets/:walletId/transactions
- Retorna todas las transacciones de una wallet específica
- Parámetros: page, limit, type, status
- Uso: Ver historial de transacciones de un usuario

7. GET /api/wallets/:walletId/balance
- Retorna el balance actual de una wallet
- Uso: Ver saldo de un usuario

*/

module.exports = router;