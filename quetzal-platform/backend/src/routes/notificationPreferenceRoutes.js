// ============================================
// NOTIFICATIONPREFERENCE ROUTES - Rutas de Preferencias de Notificación
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param } = require('express-validator');
const { 
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotificationPreferences,
  getNotificationPreferencesByUserId,
  deleteNotificationPreferences,
  getEmailNotificationsEnabled,
  getPushNotificationsEnabled
} = require('../controllers/notificationPreferenceController');

// ============================================
// VALIDACIONES
// ============================================

const validateNotificationPreference = [
  body('userId')
    .optional()
    .isUUID(4)
    .withMessage('El ID del usuario debe ser un UUID válido'),
  body('emailTransactions')
    .optional()
    .isBoolean()
    .withMessage('emailTransactions debe ser un valor booleano'),
  body('emailMessages')
    .optional()
    .isBoolean()
    .withMessage('emailMessages debe ser un valor booleano'),
  body('emailServices')
    .optional()
    .isBoolean()
    .withMessage('emailServices debe ser un valor booleano'),
  body('emailMarketing')
    .optional()
    .isBoolean()
    .withMessage('emailMarketing debe ser un valor booleano'),
  body('pushEnabled')
    .optional()
    .isBoolean()
    .withMessage('pushEnabled debe ser un valor booleano')
];

const validateUserId = [
  param('userId')
    .isUUID(4)
    .withMessage('ID de usuario inválido')
];

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// GET /api/notification-preferences - Obtener preferencias del usuario autenticado
router.get('/', auth, getNotificationPreferences);

// PUT /api/notification-preferences - Actualizar preferencias del usuario autenticado
router.put('/', auth, validateNotificationPreference, updateNotificationPreferences);

// GET /api/notification-preferences/:userId - Obtener preferencias de un usuario específico
router.get('/:userId', auth, validateUserId, getNotificationPreferencesByUserId);

// GET /api/notification-preferences/:userId/email-enabled - Obtener si el usuario quiere recibir notificaciones por email
router.get('/:userId/email-enabled', auth, validateUserId, getEmailNotificationsEnabled);

// GET /api/notification-preferences/:userId/push-enabled - Obtener si el usuario quiere recibir notificaciones push
router.get('/:userId/push-enabled', auth, validateUserId, getPushNotificationsEnabled);

// ============================================
// RUTAS PROTEGIDAS (solo admins)
// ============================================

// POST /api/notification-preferences - Crear preferencias para un usuario
router.post('/', auth, validateNotificationPreference, createNotificationPreferences);

// DELETE /api/notification-preferences/:userId - Eliminar preferencias de un usuario
router.delete('/:userId', auth, validateUserId, deleteNotificationPreferences);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/notification-preferences
- Retorna las preferencias de notificación del usuario autenticado
- Uso: Ver preferencias en el perfil del usuario

2. PUT /api/notification-preferences
- Actualiza las preferencias de notificación del usuario autenticado
- Body: { emailTransactions, emailMessages, emailServices, emailMarketing, pushEnabled }
- Uso: Actualizar preferencias desde el frontend

3. GET /api/notification-preferences/:userId
- Retorna las preferencias de notificación de un usuario específico
- Uso: Ver preferencias de otro usuario (admin)

4. POST /api/notification-preferences
- Crea preferencias de notificación para un usuario
- Body: { userId, emailTransactions, emailMessages, emailServices, emailMarketing, pushEnabled }
- Uso: Crear preferencias para un usuario (admin)

5. DELETE /api/notification-preferences/:userId
- Elimina las preferencias de notificación de un usuario
- Uso: Eliminar preferencias (admin)

6. GET /api/notification-preferences/:userId/email-enabled
- Retorna si el usuario quiere recibir notificaciones por email
- Uso: Verificar si se debe enviar email (sistema)

7. GET /api/notification-preferences/:userId/push-enabled
- Retorna si el usuario quiere recibir notificaciones push
- Uso: Verificar si se debe enviar push (sistema)

*/

module.exports = router;