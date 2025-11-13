// ============================================
<<<<<<< HEAD
// MESSAGE ROUTES - Rutas de Mensajes
=======
// MESSAGE ROUTES - Rutas de Mensajería
>>>>>>> cc4c4af3e771aba7082da02ff554d4eb7b32c798
// ============================================

const express = require('express');
const router = express.Router();
<<<<<<< HEAD
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
=======
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas
router.use(protect);

// ============================================
// RUTAS DE CONVERSACIONES
// ============================================

// Obtener mis conversaciones
router.get('/conversations', messageController.getMyConversations);

// Crear nueva conversación
router.post('/conversations', 
  messageController.createConversationValidators,
  messageController.createConversation
);

// Obtener conversación específica
router.get('/conversations/:conversationId', messageController.getConversation);

// Marcar conversación como leída
router.put('/conversations/:conversationId/read', messageController.markConversationAsRead);

// ============================================
// RUTAS DE MENSAJES
// ============================================

// Obtener mensajes de una conversación
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Enviar mensaje
router.post('/conversations/:conversationId/messages',
  messageController.sendMessageValidators,
  messageController.sendMessage
);

module.exports = router;
>>>>>>> cc4c4af3e771aba7082da02ff554d4eb7b32c798
