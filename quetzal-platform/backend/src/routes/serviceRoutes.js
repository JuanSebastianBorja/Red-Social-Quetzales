    // ============================================
    // SERVICE ROUTES - Rutas de Servicios
    // ============================================

    const express = require('express');
    const { body } = require('express-validator');
    const {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    getMyServices,
    getServicesByCategory
    } = require('../controllers/serviceController');
    const { protect, authorize } = require('../middleware/auth');

    const router = express.Router();

    // ============================================
    // VALIDACIONES
    // ============================================
    const createServiceValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('El título es requerido')
        .isLength({ min: 10, max: 255 })
        .withMessage('El título debe tener entre 10 y 255 caracteres'),
    
    body('description')
        .trim()
        .notEmpty()
        .withMessage('La descripción es requerida')
        .isLength({ min: 50, max: 5000 })
        .withMessage('La descripción debe tener entre 50 y 5000 caracteres'),
    
    body('category')
        .isIn(['desarrollo', 'diseno', 'marketing', 'escritura', 'video', 'musica', 'negocios', 'educacion', 'lifestyle', 'otros'])
        .withMessage('Categoría inválida'),
    
    body('price')
        .isFloat({ min: 0.1 })
        .withMessage('El precio debe ser mayor a 0.1 Quetzales'),
    
    body('deliveryTime')
        .optional()
        .isString()
        .withMessage('El tiempo de entrega debe ser texto'),
    
    body('requirements')
        .optional()
        .isString()
        .withMessage('Los requisitos deben ser texto')
    ];

    const updateServiceValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 10, max: 255 })
        .withMessage('El título debe tener entre 10 y 255 caracteres'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ min: 50, max: 5000 })
        .withMessage('La descripción debe tener entre 50 y 5000 caracteres'),
    
    body('category')
        .optional()
        .isIn(['desarrollo', 'diseno', 'marketing', 'escritura', 'video', 'musica', 'negocios', 'educacion', 'lifestyle', 'otros'])
        .withMessage('Categoría inválida'),
    
    body('price')
        .optional()
        .isFloat({ min: 0.1 })
        .withMessage('El precio debe ser mayor a 0.1 Quetzales'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'paused'])
        .withMessage('Estado inválido')
    ];

    // ============================================
    // RUTAS PÚBLICAS (no requieren autenticación)
    // ============================================

    // GET /api/services - Obtener todos los servicios
    router.get('/', getServices);

    // GET /api/services/category/:category - Servicios por categoría
    router.get('/category/:category', getServicesByCategory);

    // GET /api/services/:id - Obtener un servicio específico
    router.get('/:id', getServiceById);

    // ============================================
    // RUTAS PRIVADAS (requieren autenticación)
    // ============================================

    // GET /api/services/my-services - Mis servicios
    router.get('/my/services', protect, getMyServices);

    // POST /api/services - Crear servicio
    router.post(
    '/',
    protect,
    authorize('provider', 'both'),  // Solo providers pueden crear
    createServiceValidation,
    createService
    );

    // PUT /api/services/:id - Actualizar servicio
    router.put(
    '/:id',
    protect,
    updateServiceValidation,
    updateService
    );

    // DELETE /api/services/:id - Eliminar servicio
    router.delete(
    '/:id',
    protect,
    deleteService
    );

    module.exports = router;


    // ============================================
    // DOCUMENTACIÓN DE ENDPOINTS
    // ============================================

    /*

    📌 ENDPOINTS DISPONIBLES:

    1. GET /api/services
    - Descripción: Obtener todos los servicios activos
    - Query params opcionales:
        * category: filtrar por categoría
        * minPrice: precio mínimo
        * maxPrice: precio máximo
        * search: buscar en título y descripción
        * sort: ordenar (price-asc, price-desc, popular)
    - Ejemplo: GET /api/services?category=desarrollo&sort=price-asc

    2. GET /api/services/:id
    - Descripción: Obtener un servicio por ID
    - Ejemplo: GET /api/services/123e4567-e89b-12d3-a456-426614174000

    3. GET /api/services/category/:category
    - Descripción: Obtener servicios de una categoría
    - Ejemplo: GET /api/services/category/desarrollo

    4. GET /api/services/my/services
    - Descripción: Obtener MIS servicios (requiere auth)
    - Headers: Authorization: Bearer {token}

    5. POST /api/services
    - Descripción: Crear un nuevo servicio (requiere auth)
    - Headers: Authorization: Bearer {token}
    - Body: {
        "title": "Desarrollo de Sitio Web",
        "description": "Creo sitios web profesionales...",
        "category": "desarrollo",
        "price": 15.5,
        "deliveryTime": "7",
        "requirements": "Logo, contenido, colores"
        }

    6. PUT /api/services/:id
    - Descripción: Actualizar un servicio (requiere auth y ser dueño)
    - Headers: Authorization: Bearer {token}
    - Body: {
        "title": "Nuevo título",
        "price": 20.0,
        "status": "paused"
        }

    7. DELETE /api/services/:id
    - Descripción: Eliminar un servicio (requiere auth y ser dueño)
    - Headers: Authorization: Bearer {token}

    */