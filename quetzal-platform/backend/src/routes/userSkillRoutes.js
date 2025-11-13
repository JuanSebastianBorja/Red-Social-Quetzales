// ============================================
// USERSKILL ROUTES - Rutas de Habilidades de Usuario
// ============================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware para proteger rutas
const { body, param, query } = require('express-validator');
const { 
  getUserSkills,
  createUserSkill,
  updateUserSkill,
  deleteUserSkill,
  deleteUserSkills,
  searchSkills,
  getUserSkillById
} = require('../controllers/userSkillController');

// ============================================
// VALIDACIONES
// ============================================

const validateUserSkill = [
  body('skillName')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la habilidad es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre de la habilidad debe tener entre 2 y 100 caracteres')
];

const validateUserSkillId = [
  param('id')
    .isUUID(4)
    .withMessage('ID de habilidad inválido')
];

const validateUserId = [
  param('userId')
    .isUUID(4)
    .withMessage('ID de usuario inválido')
];

const validateSkillSearch = [
  query('query')
    .trim()
    .notEmpty()
    .withMessage('La consulta de búsqueda es obligatoria')
    .isLength({ min: 2, max: 50 })
    .withMessage('La consulta debe tener entre 2 y 50 caracteres'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Número de página inválido'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Límite de resultados inválido')
];

// ============================================
// RUTAS PÚBLICAS (no requieren autenticación)
// ============================================

// GET /api/users/:userId/skills - Obtener habilidades de un usuario
router.get('/users/:userId/skills', validateUserId, getUserSkills);

// GET /api/user-skills/:id - Obtener una habilidad por ID
router.get('/user-skills/:id', validateUserSkillId, getUserSkillById);

// GET /api/user-skills/search - Buscar habilidades por nombre
router.get('/user-skills/search', validateSkillSearch, searchSkills);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// POST /api/user-skills - Crear una nueva habilidad
router.post('/user-skills', auth, validateUserSkill, createUserSkill);

// PUT /api/user-skills/:id - Actualizar una habilidad
router.put('/user-skills/:id', auth, validateUserSkillId, validateUserSkill, updateUserSkill);

// DELETE /api/user-skills/:id - Eliminar una habilidad
router.delete('/user-skills/:id', auth, validateUserSkillId, deleteUserSkill);

// DELETE /api/users/:userId/skills - Eliminar todas las habilidades de un usuario
router.delete('/users/:userId/skills', auth, validateUserId, deleteUserSkills);

// ============================================
// EXPLICACIÓN DE LAS RUTAS:
// ============================================

/*

📌 ¿QUÉ HACE CADA RUTA?

1. GET /api/users/:userId/skills
- Retorna todas las habilidades de un usuario
- Parámetros: page, limit
- Uso: Ver habilidades de un proveedor en su perfil

2. GET /api/user-skills/:id
- Retorna una habilidad específica por ID
- Uso: Ver detalles de una habilidad

3. GET /api/user-skills/search
- Busca habilidades por nombre (case-insensitive)
- Parámetros: query, page, limit
- Uso: Buscar proveedores por habilidad

4. POST /api/user-skills
- Crea una nueva habilidad para el usuario autenticado
- Body: { skillName }
- Uso: Agregar habilidades al perfil

5. PUT /api/user-skills/:id
- Actualiza una habilidad existente
- Body: { skillName }
- Uso: Editar nombre de habilidad

6. DELETE /api/user-skills/:id
- Elimina una habilidad específica
- Uso: Quitar habilidad del perfil

7. DELETE /api/users/:userId/skills
- Elimina todas las habilidades de un usuario
- Uso: Limpiar perfil de habilidades (admin o propio usuario)

*/

module.exports = router;