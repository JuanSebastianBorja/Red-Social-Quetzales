// ============================================
// ADMIN ROUTES - Rutas de Administración
// ============================================

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de admin
router.use(protect);
router.use(authorize('admin'));

// Rutas de usuarios
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Rutas de servicios
router.put('/services/:id/status', adminController.updateServiceStatus);
router.delete('/services/:id', adminController.deleteService);

// Rutas de transacciones
router.get('/transactions', adminController.getAllTransactions);

// Rutas de estadísticas y reportes
router.get('/stats', adminController.getStats);
router.get('/activity', adminController.getRecentActivity);

module.exports = router;
