    // ============================================
    // AUTH MIDDLEWARE - Middleware de Autenticación
    // ============================================

        const { createClient } = require('@supabase/supabase-js');
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');

        // Inicializar Supabase SOLO si hay credenciales
        const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
        const supabase = hasSupabase
            ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
            : null;


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
            let user = null;

            if (supabase) {
                // Verificar token usando el cliente de Supabase Auth
                const { data, error } = await supabase.auth.getUser(token);

                if (error) {
                    console.error("Error verificando token con Supabase:", error);
                    throw error; // Lanzar el error para que lo maneje el catch
                }

                const supabaseUser = data.user;
                user = await User.findByPk(supabaseUser.id, {
                    attributes: { exclude: ['password'] }
                });
            } else {
                // Fallback local: verificar JWT con secreto
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Intentar varias propiedades comunes
                const candidateId = decoded.id || decoded.userId || decoded.sub;
                if (candidateId) {
                    user = await User.findByPk(candidateId, { attributes: { exclude: ['password'] } });
                }
                if (!user && decoded.email) {
                    user = await User.findOne({ where: { email: decoded.email }, attributes: { exclude: ['password'] } });
                }
            }

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
                if (supabase) {
                    const { data, error } = await supabase.auth.getUser(token);
                    if (!error && data?.user) {
                        const supabaseUser = data.user;
                        const user = await User.findByPk(supabaseUser.id, { attributes: { exclude: ['password'] } });
                        if (user && user.isActive) req.user = user;
                    }
                } else {
                    try {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET);
                        const candidateId = decoded.id || decoded.userId || decoded.sub;
                        let user = null;
                        if (candidateId) {
                            user = await User.findByPk(candidateId, { attributes: { exclude: ['password'] } });
                        }
                        if (!user && decoded.email) {
                            user = await User.findOne({ where: { email: decoded.email }, attributes: { exclude: ['password'] } });
                        }
                        if (user && user.isActive) req.user = user;
                    } catch (e) {
                        // ignore optional auth errors
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