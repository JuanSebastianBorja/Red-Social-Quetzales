// ============================================
// CONVERSATION ROUTES - Rutas de Conversaciones
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const { createConversation, getConversations, getConversation, updateConversationStatus, deleteConversation } = require('../controllers/conversationController');

// Validaciones
const validateConversation = [
  body('user2Id').isUUID().withMessage('ID de usuario inválido.'),
  body('serviceId').optional().isUUID().withMessage('ID de servicio inválido.')
];

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// POST /api/conversations - Crear o obtener conversación
router.post('/', auth, validateConversation, createConversation);

// GET /api/conversations - Obtener conversaciones del usuario
router.get('/', auth, getConversations);

// GET /api/conversations/:id - Obtener una conversación específica
router.get('/:id', auth, getConversation);

// PUT /api/conversations/:id - Actualizar estado de la conversación
router.put('/:id', auth, body('status').isIn(['active', 'archived', 'blocked']).withMessage('Estado no válido'), updateConversationStatus);

// DELETE /api/conversations/:id - Eliminar conversación
router.delete('/:id', auth, deleteConversation);

module.exports = router;