    // ============================================
    // SERVICE.JS - Modelo de Servicio
    // ============================================

    const { DataTypes } = require('sequelize');
    const { sequelize } = require('../config/database');

    // Este modelo representa la tabla "services" en PostgreSQL
    const Service = sequelize.define('Service', {
    // ID único del servicio (se genera automáticamente)
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },

    // ID del usuario que creó el servicio
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
        model: 'users',  // Se conecta con la tabla "users"
        key: 'id'
        }
    },

    // Título del servicio (ej: "Desarrollo de Sitio Web")
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
        notEmpty: {
            msg: 'El título es requerido'
        },
        len: {
            args: [10, 255],
            msg: 'El título debe tener entre 10 y 255 caracteres'
        }
        }
    },

    // Descripción detallada del servicio
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
        notEmpty: {
            msg: 'La descripción es requerida'
        },
        len: {
            args: [50, 5000],
            msg: 'La descripción debe tener entre 50 y 5000 caracteres'
        }
        }
    },

    // Categoría del servicio (desarrollo, diseño, etc.)
    category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
        isIn: {
            args: [['desarrollo', 'diseno', 'marketing', 'escritura', 'video', 'musica', 'negocios', 'educacion', 'lifestyle', 'otros']],
            msg: 'Categoría inválida'
        }
        }
    },

    // Precio en Quetzales (debe ser mayor a 0)
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
        min: {
            args: [0.1],
            msg: 'El precio debe ser mayor a 0.1 Quetzales'
        }
        }
    },

    // Tiempo de entrega (en días o descripción)
    deliveryTime: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'delivery_time'
    },

    // Requisitos que el cliente debe proporcionar
    requirements: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Estado del servicio: active, inactive, paused
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active',
        validate: {
        isIn: {
            args: [['active', 'inactive', 'paused']],
            msg: 'Estado inválido'
        }
        }
    },

    // Contador de vistas (cuántas personas vieron el servicio)
    viewsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'views_count'
    }

    }, {
    tableName: 'services',  // Nombre de la tabla en PostgreSQL
    timestamps: true,        // Agrega createdAt y updatedAt automáticamente
    createdAt: 'created_at',
    updatedAt: 'updated_at'
    });

    // ============================================
    // MÉTODOS PERSONALIZADOS
    // ============================================

    // Método para incrementar las vistas
    Service.prototype.incrementViews = async function() {
    this.viewsCount += 1;
    await this.save();
    };

    // Método para obtener el precio en COP (pesos colombianos)
    Service.prototype.getPriceInCOP = function() {
    const conversionRate = 10000; // 1 Quetzal = 10,000 COP
    return this.price * conversionRate;
    };

    // Método para verificar si está activo
    Service.prototype.isActive = function() {
    return this.status === 'active';
    };

    // ============================================
    // MÉTODOS ESTÁTICOS (se usan en Service.nombreMetodo())
    // ============================================

    // Buscar servicios por categoría
    Service.findByCategory = async function(category) {
    return await this.findAll({
        where: { 
        category,
        status: 'active' 
        },
        order: [['created_at', 'DESC']]
    });
    };

    // Buscar servicios por usuario
    Service.findByUser = async function(userId) {
    return await this.findAll({
        where: { userId },
        order: [['created_at', 'DESC']]
    });
    };

    // Buscar servicios activos
    Service.findActiveServices = async function() {
    return await this.findAll({
        where: { status: 'active' },
        order: [['created_at', 'DESC']]
    });
    };

    // Buscar servicios por rango de precio
    Service.findByPriceRange = async function(minPrice, maxPrice) {
    const { Op } = require('sequelize');
    return await this.findAll({
        where: {
        price: {
            [Op.between]: [minPrice, maxPrice]
        },
        status: 'active'
        }
    });
    };

    module.exports = Service;