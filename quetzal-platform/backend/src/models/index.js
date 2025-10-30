    // ============================================
    // MODELS INDEX - Relaciones entre Modelos
    // ============================================

    const User = require('./User');
    const Service = require('./Service');

    // ============================================
    // RELACIONES (ASSOCIATIONS)
    // ============================================

    // Un Usuario puede tener MUCHOS Servicios
    User.hasMany(Service, {
    foreignKey: 'userId',
    as: 'services',
    onDelete: 'CASCADE'  // Si se elimina el usuario, se eliminan sus servicios
    });

    // Un Servicio pertenece a UN Usuario
    Service.belongsTo(User, {
    foreignKey: 'userId',
    as: 'provider'  // Lo llamamos "provider" para que sea más claro
    });

    // ============================================
    // EXPLICACIÓN DE LAS RELACIONES:
    // ============================================

    /*

    📌 ¿QUÉ SIGNIFICA ESTO?

    1. User.hasMany(Service)
    - Un usuario puede crear MUCHOS servicios
    - Ejemplo: Juan puede crear "Desarrollo Web", "Diseño Logo", etc.

    2. Service.belongsTo(User)
    - Cada servicio pertenece a UN usuario
    - Ejemplo: El servicio "Desarrollo Web" fue creado por Juan

    3. as: 'provider'
    - Le ponemos un "alias" para que sea más claro
    - Ahora cuando traigamos un servicio, podemos acceder al usuario como "provider"
    - Ejemplo: service.provider.fullName

    4. onDelete: 'CASCADE'
    - Si eliminas un usuario, automáticamente se eliminan todos sus servicios
    - Es para mantener la base de datos limpia

    ---

    📌 ¿CÓMO SE USA EN CÓDIGO?

    // Obtener un servicio con su proveedor:
    const service = await Service.findByPk(serviceId, {
    include: [{
        model: User,
        as: 'provider',
        attributes: ['fullName', 'email', 'avatar']
    }]
    });

    // Resultado:
    {
    id: "123",
    title: "Desarrollo Web",
    price: 15.5,
    provider: {
        fullName: "Juan Pérez",
        email: "juan@example.com",
        avatar: "https://..."
    }
    }

    // Obtener todos los servicios de un usuario:
    const user = await User.findByPk(userId, {
    include: [{
        model: Service,
        as: 'services'
    }]
    });

    // Resultado:
    {
    id: "456",
    fullName: "Juan Pérez",
    services: [
        { title: "Desarrollo Web", price: 15.5 },
        { title: "Diseño Logo", price: 8.0 }
    ]
    }

    */

    module.exports = {
    User,
    Service
    };