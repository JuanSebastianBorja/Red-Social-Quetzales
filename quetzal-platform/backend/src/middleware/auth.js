    // ============================================
    // AUTH MIDDLEWARE - Middleware de Autenticación
    // ============================================

    const { createClient } = require('@supabase/supabase-js');
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');

    // Inicializar cliente de Supabase usando las mismas credenciales que el frontend
const supabase = createClient(
  process.env.SUPABASE_URL, // Asegúrate de tener esta variable de entorno en Render
  process.env.SUPABASE_ANON_KEY  // Asegúrate de tener esta variable de entorno en Render
);


    // Proteger rutas - Verificar JWT
    exports.protect = async (req, res, next) => {
    try {
        let token;

        // Obtener token del header Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        }

        // Verificar si existe el token
        if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado. Token no proporcionado'
        });
        }

        try {
      // Verificar token usando el cliente de Supabase Auth
      const { data, error } = await supabase.auth.getUser(token);

      if (error) {
        console.error("Error verificando token con Supabase:", error);
        throw error; // Lanzar el error para que lo maneje el catch
      }

      const supabaseUser = data.user;

        // Buscar usuario
        const user = await User.findByPk(supabaseUser.id,{
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({
            success: false,
            message: 'Usuario no encontrado'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
            success: false,
            message: 'Tu cuenta ha sido desactivada'
            });
        }

        // Agregar usuario al request
        req.user = user;
        next();

        } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
        }

    } catch (error) {
        next(error);
    }
    };

// Verificar roles específicos
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // Verificar primero si hay un campo 'role' (admin, user)
        const userRole = req.user.role || req.user.userType;
        
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `No tienes permisos suficientes para acceder a esta ruta. Rol requerido: ${roles.join(', ')}`
            });
        }
        next();
    };
};

// Verificar si es administrador
exports.requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Se requieren permisos de administrador'
        });
    }
    next();
};

// Verificar si el usuario es el dueño del recurso
    exports.checkOwnership = (resourceUserId) => {
    return (req, res, next) => {
        if (req.user.id !== resourceUserId) {
        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para realizar esta acción'
        });
        }
        next();
    };
    };

    // Opcional: Protección suave (no requiere autenticación pero la usa si existe)
    exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        // CORREGIDO: Usar supabase.auth.getUser en lugar de jwt.verify
        const { data, error } = await supabase.auth.getUser(token);

        if (error) {
            // Token inválido, continuar sin usuario
            console.error("Token opcional inválido (Supabase):", error);
        } else {
            const supabaseUser = data.user;

            // Buscar usuario en tu base de datos local
            const user = await User.findByPk(supabaseUser.id, { // <-- CORREGIDO: Usar supabaseUser.id
                attributes: { exclude: ['password'] }
            });

            if (user && user.isActive) {
                req.user = user; // <-- Adjuntar usuario local a req
            }
        }
      } catch (error) {
        // Error inesperado al verificar token opcional, continuar sin usuario
        console.error("Error verificando token opcional (Supabase):", error);
        // No se adjunta req.user, se continúa sin autenticación
      }
    }

    next();

  } catch (error) {
    next(error);
  }
};