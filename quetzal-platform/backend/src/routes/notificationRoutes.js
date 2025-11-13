// ============================================
// NOTIFICATION ROUTES - Rutas de Notificaciones
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notificationController');

// ============================================
// VALIDACIONES
// ============================================

const validateNotification = [
  body('userId')
    .isUUID(4)
    .withMessage('El ID del usuario debe ser un UUID válido'),
  body('type')
    .notEmpty()
    .withMessage('El tipo de notificación es obligatorio'),
  body('title')
    .notEmpty()
    .withMessage('El título es obligatorio'),
  body('message')
    .notEmpty()
    .withMessage('El mensaje es obligatorio'),
  body('referenceId')
    .optional()
    .isUUID(4)
    .withMessage('El ID de referencia debe ser un UUID válido'),
  body('actionUrl')
    .optional()
    .isURL()
    .withMessage('La URL de acción debe ser válida')
];

const validateNotificationId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de notificación inválido')
];

const validateNotificationFilters = [
  query('type')
    .optional()
    .isIn(['service_request', 'payment_completed', 'new_message', 'dispute_opened', 'escrow_released'])
    .withMessage('Tipo de notificación inválido'),
  query('isRead')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Valor de "isRead" inválido'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt'])
    .withMessage('Campo de ordenamiento inválido'),
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

// GET /api/notifications - Obtener todas las notificaciones del usuario
router.get('/', auth, validateNotificationFilters, getNotifications);

// GET /api/notifications/:id - Obtener una notificación específica
router.get('/:id', auth, validateNotificationId, getNotificationById);

// POST /api/notifications - Crear una nueva notificación
router.post('/', auth, validateNotification, createNotification);

// PUT /api/notifications/:id - Actualizar una notificación
router.put('/:id', auth, validateNotificationId, validateNotification, updateNotification);

// DELETE /api/notifications/:id - Eliminar una notificación
router.delete('/:id', auth, validateNotificationId, deleteNotification);

// PUT /api/notifications/:id/read - Marcar como leída
router.put('/:id/read', auth, validateNotificationId, markAsRead);

// PUT /api/notifications/mark-all-read - Marcar todas como leídas
router.put('/mark-all-read', auth, markAllAsRead);

// GET /api/notifications/unread-count - Obtener cantidad de no leídas
router.get('/unread-count', auth, getUnreadCount);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/notifications
- Retorna todas las notificaciones del usuario autenticado
- Parámetros: page, limit, type, isRead, sortBy
- Uso: Ver notificaciones en el panel del usuario

2. GET /api/notifications/:id
- Retorna una notificación específica por ID
- Uso: Ver detalles de una notificación

3. POST /api/notifications
- Crea una nueva notificación
- Body: { userId, type, title, message, referenceId, actionUrl }
- Uso: Enviar notificaciones internas (ej: sistema, admin)

4. PUT /api/notifications/:id
- Actualiza una notificación existente
- Body: { type, title, message, isRead, actionUrl }
- Uso: Editar tipo o marcar como leída/no leída

5. DELETE /api/notifications/:id
- Elimina una notificación (solo el usuario dueño o admin)
- Uso: Eliminar notificaciones irrelevantes

6. PUT /api/notifications/:id/read
- Marca una notificación como leída
- Uso: Actualizar estado de lectura

7. PUT /api/notifications/mark-all-read
- Marca todas las notificaciones del usuario como leídas
- Uso: Botón "Marcar todo como leído"

8. GET /api/notifications/unread-count
- Retorna la cantidad de notificaciones no leídas
- Uso: Badge de notificaciones en el frontend

*/

module.exports = router;