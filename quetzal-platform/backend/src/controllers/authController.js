    // ============================================
    // AUTH CONTROLLER - Controlador de Autenticación
    // ============================================

    const { User, Wallet } = require('../models');
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

    // @desc    Sincronizar usuario de Supabase con la base de datos local
    // @route   POST /api/auth/sync-with-supabase
    // @access  Public (pero se verifica el token de Supabase)
    exports.syncUserWithSupabase = async (req, res, next) => {
        try {
                const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

    const { token } = req.body; // El access_token de Supabase recibido del frontend

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de Supabase requerido'
      });
    }

    // Verificar el token con el cliente de Supabase (esto lo puedes hacer en el controlador o en un servicio aparte)
    // Asegúrate de que tienes el cliente de Supabase inicializado en este archivo o importado desde otro lugar
        const { createClient } = require('@supabase/supabase-js'); 
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            return res.status(503).json({
                success: false,
                message: 'Supabase no está configurado en el backend. Define SUPABASE_URL y SUPABASE_ANON_KEY.'
            });
        }
        const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Usar el cliente de Supabase para verificar el token
    const { data, error } = await supabaseClient.auth.getUser(token);

    if (error) {
      console.error("Error verificando token con Supabase en sync:", error);
      return res.status(401).json({
        success: false,
        message: 'Token de Supabase inválido'
      });
    }

    const supabaseUser = data.user; // Información del usuario desde Supabase Auth

    // Buscar usuario en la base de datos local usando el ID de Supabase
    let localUser = await User.findByPk(supabaseUser.id);

    if (!localUser) {
      // Si no existe, crearlo en la base de datos local
      console.log(`Usuario ${supabaseUser.email} no encontrado en DB local. Creando...`);

      // Extraer datos de Supabase para crear el usuario local
      const userMetadata = supabaseUser.user_metadata || {};
      const appMetadata = supabaseUser.app_metadata || {};

      localUser = await User.create({
        id: supabaseUser.id, // Importante: Usar el ID de Supabase como ID local
        email: supabaseUser.email,
        password: '$2a$10$SupabaseOnlyUserPlaceholderHash',
        fullName: userMetadata.full_name || supabaseUser.email.split('@')[0], // Usar metadata o derivar del email
        phone: userMetadata.phone || '',
        city: userMetadata.city || '',
        userType: userMetadata.user_type || 'consumer', // Asumiendo que 'user_type' está en metadata
        // avatar: userMetadata.avatar || '', // Si manejas avatar localmente
        // bio: userMetadata.bio || '',
        // website: userMetadata.website || '',
        isVerified: supabaseUser.email_confirmed_at ? true : false, // Usar confirmación de Supabase
        isActive: true, // Puedes manejar activación localmente si es diferente
        // Otros campos que quieras mapear desde Supabase
      });

      // Opcional: Crear wallet automáticamente (esto probablemente ya lo haces con un trigger en la DB)
      // const wallet = await Wallet.create({ userId: localUser.id, balance: 0.00, currency: 'QUETZALES' });

      console.log(`Usuario ${localUser.email} creado en DB local.`);
    } else {
      console.log(`Usuario ${localUser.email} ya existe en DB local.`);
      // Opcional: Actualizar datos del usuario local si han cambiado en Supabase
      // await localUser.update({
      //   fullName: userMetadata.full_name || localUser.fullName,
      //   email: supabaseUser.email, // Actualizar si cambió?
      //   // ... otros campos ...
      // });
    }

    // Devolver datos del usuario local (sin contraseña)
    res.json({
      success: true,
      message: 'Usuario sincronizado correctamente',
      user: {
        id: localUser.id,
        name: localUser.fullName,
        email: localUser.email,
        userType: localUser.userType,
        role: localUser.userType, // o localUser.role si tienes un campo específico
        avatar: localUser.avatar, // o una URL basada en el email si usas ui-avatars
      }
    });

  } catch (error) {
    console.error("Error en syncUserWithSupabase:", error);
    next(error); // Pasa el error al middleware de manejo de errores global
  }
};