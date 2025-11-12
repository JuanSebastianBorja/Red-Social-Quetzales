    // ============================================
    // SERVICE CONTROLLER - Controlador de Servicios
    // ============================================

    const Service = require('../models/Service');
    const User = require('../models/User');
    const { validationResult } = require('express-validator');
    const { Op } = require('sequelize');

    // ============================================
    // @desc    Obtener todos los servicios (con filtros opcionales)
    // @route   GET /api/services
    // @access  Public (cualquiera puede ver servicios)
    // ============================================
    exports.getServices = async (req, res, next) => {
    try {
        // Extraer parámetros de búsqueda de la URL
        const {
        category,    // ?category=desarrollo
        minPrice,    // ?minPrice=5
        maxPrice,    // ?maxPrice=20
        search,      // ?search=diseño web
        sort         // ?sort=price-asc
        } = req.query;

        // Construir filtros dinámicamente
        let filters = { status: 'active' };

        // Si hay categoría, agregarla al filtro
        if (category) {
        filters.category = category;
        }

        // Si hay búsqueda por texto
        if (search) {
        filters[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } }
        ];
        }

        // Si hay rango de precio
        if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price[Op.gte] = minPrice;
        if (maxPrice) filters.price[Op.lte] = maxPrice;
        }

        // Determinar el orden
        let order = [['created_at', 'DESC']]; // Por defecto: más recientes primero
        if (sort === 'price-asc') order = [['price', 'ASC']];
        if (sort === 'price-desc') order = [['price', 'DESC']];
        if (sort === 'popular') order = [['views_count', 'DESC']];

        // Buscar servicios en la base de datos
        const services = await Service.findAll({
        where: filters,
        order,
        include: [
            {
            model: User,
            as: 'provider',
            attributes: ['id', 'fullName', 'avatar'] // Solo traer estos campos
            }
        ]
        });

        res.json({
        success: true,
        count: services.length,
        data: services
        });

    } catch (error) {
        next(error);
    }
    };

    // ============================================
    // @desc    Obtener un servicio por ID
    // @route   GET /api/services/:id
    // @access  Public
    // ============================================
    exports.getServiceById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const service = await Service.findByPk(id, {
        include: [
            {
            model: User,
            as: 'provider',
            attributes: ['id', 'fullName', 'avatar', 'bio', 'email']
            }
        ]
        });

        if (!service) {
        return res.status(404).json({
            success: false,
            message: 'Servicio no encontrado'
        });
        }

        // Incrementar contador de vistas
        await service.incrementViews();

        res.json({
        success: true,
        data: service
        });

    } catch (error) {
        next(error);
    }
    };

    // ============================================
    // @desc    Crear un nuevo servicio
    // @route   POST /api/services
    // @access  Private (solo usuarios autenticados)
    // ============================================
    exports.createService = async (req, res, next) => {
    try {
        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
        }

        const { title, description, category, price, deliveryTime, requirements } = req.body;

        // Verificar que el usuario sea provider o both
        if (req.user.userType === 'consumer') {
        return res.status(403).json({
            success: false,
            message: 'Solo los proveedores pueden crear servicios'
        });
        }

        // Crear el servicio
        const service = await Service.create({
        userId: req.user.id,  // El usuario autenticado es el dueño
        title,
        description,
        category,
        price,
        deliveryTime,
        requirements,
        status: 'active'
        });

        // Obtener el servicio completo con el usuario
        const serviceWithUser = await Service.findByPk(service.id, {
        include: [
            {
            model: User,
            as: 'provider',
            attributes: ['id', 'fullName', 'avatar']
            }
        ]
        });

        res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: serviceWithUser
        });

    } catch (error) {
        next(error);
    }
    };

    // ============================================
    // @desc    Actualizar un servicio
    // @route   PUT /api/services/:id
    // @access  Private (solo el dueño del servicio)
    // ============================================
    exports.updateService = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Buscar el servicio
        const service = await Service.findByPk(id);

        if (!service) {
        return res.status(404).json({
            success: false,
            message: 'Servicio no encontrado'
        });
        }

        // Verificar que el usuario sea el dueño
        if (service.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para editar este servicio'
        });
        }

        // Campos que se pueden actualizar
        const { title, description, category, price, deliveryTime, requirements, status } = req.body;

        // Actualizar el servicio
        await service.update({
        title: title || service.title,
        description: description || service.description,
        category: category || service.category,
        price: price || service.price,
        deliveryTime: deliveryTime || service.deliveryTime,
        requirements: requirements !== undefined ? requirements : service.requirements,
        status: status || service.status
        });

        res.json({
        success: true,
        message: 'Servicio actualizado exitosamente',
        data: service
        });

    } catch (error) {
        next(error);
    }
    };

    // ============================================
    // @desc    Eliminar un servicio
    // @route   DELETE /api/services/:id
    // @access  Private (solo el dueño)
    // ============================================
    exports.deleteService = async (req, res, next) => {
    try {
        const { id } = req.params;

        const service = await Service.findByPk(id);

        if (!service) {
        return res.status(404).json({
            success: false,
            message: 'Servicio no encontrado'
        });
        }

        // Verificar que el usuario sea el dueño
        if (service.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para eliminar este servicio'
        });
        }

        // Eliminar el servicio
        await service.destroy();

        res.json({
        success: true,
        message: 'Servicio eliminado exitosamente'
        });

    } catch (error) {
        next(error);
    }
    };

    // ============================================
    // @desc    Obtener los servicios del usuario autenticado
    // @route   GET /api/services/my-services
    // @access  Private
    // ============================================
    exports.getMyServices = async (req, res, next) => {
    try {
        const services = await Service.findByUser(req.user.id);

        res.json({
        success: true,
        count: services.length,
        data: services
        });

    } catch (error) {
        next(error);
    }
    };

    // ============================================
    // @desc    Obtener servicios por categoría
    // @route   GET /api/services/category/:category
    // @access  Public
    // ============================================
    exports.getServicesByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;

        const services = await Service.findByCategory(category);

        res.json({
        success: true,
        count: services.length,
        data: services
        });

    } catch (error) {
        next(error);
    }
    };