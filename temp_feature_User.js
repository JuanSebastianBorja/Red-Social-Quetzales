    // ============================================
    // USER.JS - Modelo de Usuario
    // ============================================

    const { DataTypes } = require('sequelize');
    const { sequelize } = require('../config/database');
    const bcrypt = require('bcryptjs');

    const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
        isEmail: {
            msg: 'Debe ser un email v├ílido'
        }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
        len: {
            args: [6, 255],
            msg: 'La contrase├▒a debe tener al menos 6 caracteres'
        }
        }
    },
    fullName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'full_name',
        validate: {
        notEmpty: {
            msg: 'El nombre completo es requerido'
        }
        }
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    userType: {
        type: DataTypes.ENUM('provider', 'consumer', 'both'),
        allowNull: false,
        defaultValue: 'consumer',
        field: 'user_type'
    },
    role: {
        type: DataTypes.ENUM('visitor', 'user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
        field: 'role'
    },
    avatar: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
        isUrl: {
            msg: 'Debe ser una URL v├ílida'
        }
        }
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
    }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
        if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
        },
        beforeUpdate: async (user) => {
        if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
        }
    }
    });

    // M├®todos de instancia
    User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
    };

    User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
    };

    // M├®todos est├íticos
    User.findByEmail = async function(email) {
    return await this.findOne({ where: { email } });
    };

    User.findActiveUsers = async function() {
    return await this.findAll({ 
        where: { isActive: true },
        attributes: { exclude: ['password'] }
    });
    };

    module.exports = User;
