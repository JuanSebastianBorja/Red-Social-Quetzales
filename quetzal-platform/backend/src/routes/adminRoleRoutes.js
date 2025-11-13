// ============================================
// ADMINROLE ROUTES - Rutas para roles de administrador
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param } = require('express-validator');
const { 
  getAdminRoles,
  createAdminRole,
  getAdminRoleById,
  updateAdminRole,
  deleteAdminRole,
  getRolesByPermission,
  checkRolePermission
} = require('../controllers/adminRoleController');

// ============================================
// VALIDACIONES
// ============================================

const validateRole = [
  body('roleName')
    .trim()
    .notEmpty()
    .withMessage('El nombre del rol es obligatorio')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre del rol debe tener entre 3 y 50 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La descripción no debe superar los 255 caracteres'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Los permisos deben ser un objeto JSON válido')
];

const validateRoleId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de rol inválido')
];

const validatePermission = [
  param('permissionKey')
    .trim()
    .notEmpty()
    .withMessage('La clave de permiso es obligatoria')
];

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// GET /api/admin/roles - Obtener todos los roles
router.get('/', auth, getAdminRoles);

// POST /api/admin/roles - Crear un nuevo rol
router.post('/', auth, validateRole, createAdminRole);

// GET /api/admin/roles/:id - Obtener un rol por ID
router.get('/:id', auth, validateRoleId, getAdminRoleById);

// PUT /api/admin/roles/:id - Actualizar un rol
router.put('/:id', auth, validateRoleId, validateRole, updateAdminRole);

// DELETE /api/admin/roles/:id - Eliminar un rol
router.delete('/:id', auth, validateRoleId, deleteAdminRole);

// GET /api/admin/roles/permission/:permissionKey - Buscar roles por permiso
router.get('/permission/:permissionKey', auth, validatePermission, getRolesByPermission);

// GET /api/admin/roles/:id/has-permission/:permission - Verificar permiso de rol
router.get('/:id/has-permission/:permission', auth, validateRoleId, checkRolePermission);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/admin/roles
- Retorna todos los roles de administrador
- Parámetros: page, limit (opcional)
- Uso: Listar roles en panel de administración

2. POST /api/admin/roles
- Crea un nuevo rol de administrador
- Body: { roleName, description, permissions }
- Uso: Crear roles como "moderador", "superadmin", etc.

3. GET /api/admin/roles/:id
- Retorna un rol específico por ID
- Uso: Ver detalles de un rol

4. PUT /api/admin/roles/:id
- Actualiza un rol existente
- Body: { roleName, description, permissions }
- Uso: Editar permisos o nombre de un rol

5. DELETE /api/admin/roles/:id
- Elimina un rol (si no tiene usuarios asignados)
- Uso: Eliminar roles obsoletos

6. GET /api/admin/roles/permission/:permissionKey
- Busca roles que tengan un permiso específico
- Ejemplo: Buscar roles con permiso "users"
- Uso: Auditoría de permisos

7. GET /api/admin/roles/:id/has-permission/:permission
- Verifica si un rol específico tiene un permiso
- Ejemplo: ¿El rol "moderador" tiene permiso "services"?
- Uso: Validación de permisos en tiempo de ejecución

*/

module.exports = router;