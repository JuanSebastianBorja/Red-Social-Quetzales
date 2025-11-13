// ============================================
// MESSAGE ROUTES - Rutas de Mensajes
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const { sendMessage, getMessages, markAsRead, deleteMessage } = require('../controllers/messageController');

// Validaciones
const validateMessage = [
  body('conversationId').isUUID().withMessage('ID de conversación inválido.'),
  body('message').trim().notEmpty().withMessage('El mensaje no puede estar vacío.')
];

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// POST /api/messages - Enviar un mensaje
router.post('/', auth, validateMessage, sendMessage);

// GET /api/messages/:conversationId - Obtener mensajes de una conversación
router.get('/:conversationId', auth, getMessages);

// PUT /api/messages/read/:conversationId - Marcar mensajes como leídos
router.put('/read/:conversationId', auth, markAsRead);

// DELETE /api/messages/:id - Eliminar un mensaje
router.delete('/:id', auth, deleteMessage);

module.exports = router;