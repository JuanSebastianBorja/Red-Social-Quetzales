// ============================================
// ESCROW ROUTES - Rutas de custodia de pagos
// ============================================

const express = require('express');
const router = express.Router();

// GET /api/escrow - Obtener mis custodias
router.get('/', (req, res) => {
    res.json({ 
        message: 'Obtener custodias del usuario',
        status: 'en desarrollo'
    });
});

// POST /api/escrow - Crear nueva custodia
router.post('/', (req, res) => {
    res.json({ 
        message: 'Crear nueva custodia',
        body: req.body,
        status: 'en desarrollo'
    });
});

// PUT /api/escrow/:id/release - Liberar fondos
router.put('/:id/release', (req, res) => {
    res.json({ 
        message: `Liberar fondos de custodia ${req.params.id}`,
        status: 'en desarrollo'
    });
});

// PUT /api/escrow/:id/dispute - Disputar custodia
router.put('/:id/dispute', (req, res) => {
    res.json({ 
        message: `Disputar custodia ${req.params.id}`,
        body: req.body,
        status: 'en desarrollo'
    });
});

module.exports = router;
