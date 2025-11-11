// ============================================
// USER ROUTES - Rutas para usuarios
// ============================================

const express = require('express');
const router = express.Router();

// GET /api/users - Obtener todos los usuarios (admin)
router.get('/', (req, res) => {
    res.json({ 
        message: 'Obtener todos los usuarios',
        status: 'en desarrollo'
    });
});

// GET /api/users/:id - Obtener un usuario específico
router.get('/:id', (req, res) => {
    res.json({ 
        message: `Obtener usuario ${req.params.id}`,
        status: 'en desarrollo'
    });
});

// PUT /api/users/:id - Actualizar un usuario
router.put('/:id', (req, res) => {
    res.json({ 
        message: `Actualizar usuario ${req.params.id}`,
        body: req.body,
        status: 'en desarrollo'
    });
});

// DELETE /api/users/:id - Eliminar un usuario
router.delete('/:id', (req, res) => {
    res.json({ 
        message: `Eliminar usuario ${req.params.id}`,
        status: 'en desarrollo'
    });
});

module.exports = router;
