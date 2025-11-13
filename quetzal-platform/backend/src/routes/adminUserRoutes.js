// ============================================
// ADMINUSER ROUTES - Rutas de Usuarios Administradores
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param } = require('express-validator');
const { 
  getAdminUsers,
  createAdminUser,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  adminLogin,
  getAdminProfile,
  updateAdminProfile
} = require('../controllers/adminUserController');

// ============================================
// VALIDACIONES
// ============================================

const validateAdminUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('fullName')
    .notEmpty()
    .withMessage('El nombre completo es obligatorio'),
  body('roleId')
    .isUUID(4)
    .withMessage('El ID del rol debe ser un UUID válido')
];

const validateAdminLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
];

const validateAdminId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de usuario admin inválido')
];

// ============================================
// RUTAS PÚBLICAS (no requieren autenticación)
// ============================================

// POST /api/admin/login - Iniciar sesión como administrador
router.post('/login', validateAdminLogin, adminLogin);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// GET /api/admin/users - Obtener todos los usuarios administradores
router.get('/users', auth, getAdminUsers);

// POST /api/admin/users - Crear un nuevo usuario admin
router.post('/users', auth, validateAdminUser, createAdminUser);

// GET /api/admin/users/:id - Obtener un usuario admin por ID
router.get('/users/:id', auth, validateAdminId, getAdminUserById);

// PUT /api/admin/users/:id - Actualizar un usuario admin
router.put('/users/:id', auth, validateAdminId, validateAdminUser, updateAdminUser);

// DELETE /api/admin/users/:id - Eliminar un usuario admin
router.delete('/users/:id', auth, validateAdminId, deleteAdminUser);

// GET /api/admin/profile - Obtener perfil del admin autenticado
router.get('/profile', auth, getAdminProfile);

// PUT /api/admin/profile - Actualizar perfil del admin autenticado
router.put('/profile', auth, body('fullName').optional(), body('email').optional().isEmail(), body('password').optional().isLength({ min: 8 }), updateAdminProfile);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/admin/users
- Retorna todos los usuarios administradores
- Parámetros: page, limit, isActive, roleId (opcional)
- Uso: Listar admins en panel de administración

2. POST /api/admin/users
- Crea un nuevo usuario admin
- Body: { email, password, fullName, roleId }
- Uso: Crear nuevos admins por superadmin

3. GET /api/admin/users/:id
- Retorna un usuario admin específico por ID
- Uso: Ver detalles de un admin

4. PUT /api/admin/users/:id
- Actualiza un usuario admin existente
- Body: { email, password, fullName, roleId, isActive }
- Uso: Editar información de un admin

5. DELETE /api/admin/users/:id
- Elimina un usuario admin (si no es el propio)
- Uso: Eliminar admins inactivos o no necesarios

6. POST /api/admin/login
- Iniciar sesión como administrador
- Body: { email, password }
- Retorna: { user, token }

7. GET /api/admin/profile
- Obtener perfil del admin autenticado
- Uso: Mostrar datos del admin en su panel

8. PUT /api/admin/profile
- Actualizar perfil del admin autenticado
- Body: { fullName, email, password }
- Uso: Editar datos personales del admin

*/

module.exports = router;