// ============================================
// CONTRACT ROUTES - Rutas de Contratación
// ============================================

const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { protect } = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas
router.use(protect);

// ============================================
// RUTAS DE CONTRATOS
// ============================================

// POST /api/contracts - Crear nuevo contrato (contratar servicio)
router.post('/', 
  contractController.createContractValidators,
  contractController.createContract
);

// GET /api/contracts/:id - Obtener detalles de un contrato
router.get('/:id', contractController.getContract);

// PUT /api/contracts/:id/status - Actualizar estado del contrato
router.put('/:id/status',
  contractController.updateStatusValidators,
  contractController.updateContractStatus
);

// GET /api/contracts/my/purchases - Mis compras (como comprador)
router.get('/my/purchases', contractController.getMyPurchases);

// GET /api/contracts/my/sales - Mis ventas (como vendedor)
router.get('/my/sales', contractController.getMySales);

module.exports = router;
