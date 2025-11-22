// ============================================
// MESSAGE ROUTES - Rutas de Mensajería
// ============================================

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

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