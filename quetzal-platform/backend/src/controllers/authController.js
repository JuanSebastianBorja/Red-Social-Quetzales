    // ============================================
    // AUTH CONTROLLER - Controlador de Autenticación
    // ============================================

    const User = require('../models/User');
    const jwt = require('jsonwebtoken');
    const { validationResult } = require('express-validator');

    // Generar JWT Token
    const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'quetzal_secret_key_2024',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    };

    // @desc    Registrar nuevo usuario
    // @route   POST /api/auth/register
    // @access  Public
    exports.register = async (req, res, next) => {
    try {
        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
        }

        const { email, password, fullName, phone, city, userType } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findByEmail(email.toLowerCase());
        if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'El email ya está registrado'
        });
        }

        // Crear usuario
        const user = await User.create({
        email: email.toLowerCase(),
        password,
        fullName,
        phone,
        city,
        userType: userType || 'consumer'
        });

        // Generar token
        const token = generateToken(user.id);

        res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
            user: user.toJSON(),
            token
        }
        });

    } catch (error) {
        next(error);
    }
    };

    // @desc    Iniciar sesión
    // @route   POST /api/auth/login
    // @access  Public
    exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
        }

        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findByEmail(email.toLowerCase());
        if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
        }

        // Verificar si está activo
        if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Tu cuenta ha sido desactivada. Contacta al soporte.'
        });
        }

        // Verificar contraseña
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
        }

        // Generar token
        const token = generateToken(user.id);

        res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
            user: user.toJSON(),
            token
        }
        });

    } catch (error) {
        next(error);
    }
    };

    // @desc    Verificar token
    // @route   GET /api/auth/verify
    // @access  Private
    exports.verifyToken = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
        });

        if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
        }

        res.json({
        success: true,
        data: { user }
        });

    } catch (error) {
        next(error);
    }
    };

    // @desc    Cerrar sesión
    // @route   POST /api/auth/logout
    // @access  Private
    exports.logout = async (req, res, next) => {
    try {
        // En una implementación real, aquí invalidarías el token
        // Por ahora solo retornamos éxito
        res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        next(error);
    }
    };

    // @desc    Olvidé mi contraseña
    // @route   POST /api/auth/forgot-password
    // @access  Public
    exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findByEmail(email.toLowerCase());
        if (!user) {
        // Por seguridad, no revelamos si el email existe
        return res.json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
        });
        }

        // TODO: Generar token de reset y enviar email
        // Por ahora solo retornamos éxito
        res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
        });

    } catch (error) {
        next(error);
    }
    };

    // @desc    Resetear contraseña
    // @route   POST /api/auth/reset-password
    // @access  Public
    exports.resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        // TODO: Verificar token de reset y actualizar contraseña
        // Por ahora retornamos un mensaje
        res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        next(error);
    }
    };