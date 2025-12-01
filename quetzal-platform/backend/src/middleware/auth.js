    // ============================================
    // AUTH MIDDLEWARE - Middleware de Autenticación
    // ============================================

        const { createClient } = require('@supabase/supabase-js');
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');

        // Inicializar cliente de Supabase solo si hay variables de entorno presentes
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn('[auth] SUPABASE_URL/SUPABASE_ANON_KEY no configurados. Usando verificación JWT local.');
}


    // Proteger rutas - Verificar autenticación (Supabase o JWT local)
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
            let userId = null;

            if (supabase) {
                // Verificar token usando Supabase Auth si está configurado
                const { data, error } = await supabase.auth.getUser(token);
                if (error) {
                    console.error('Error verificando token con Supabase:', error);
                    throw error;
                }
                userId = data.user?.id;
            } else {
                // Fallback: verificar JWT local
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quetzal_secret_key_2024');
                userId = decoded.id;
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
            }

            // Buscar usuario local
            const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });

            if (!user) {
                return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
            }

            if (!user.isActive) {
                return res.status(403).json({ success: false, message: 'Tu cuenta ha sido desactivada' });
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
                let userId = null;
                if (supabase) {
                    const { data, error } = await supabase.auth.getUser(token);
                    if (error) {
                        console.error('Token opcional inválido (Supabase):', error);
                    } else {
                        userId = data.user?.id;
                    }
                } else {
                    try {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quetzal_secret_key_2024');
                        userId = decoded.id;
                    } catch (e) {
                        // token inválido, continuar sin usuario
                    }
                }

                if (userId) {
                    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
                    if (user && user.isActive) {
                        req.user = user;
                    }
                }
            } catch (error) {
                // Error inesperado al verificar token opcional, continuar sin usuario
                console.error('Error verificando token opcional:', error);
            }
        }

    next();

  } catch (error) {
    next(error);
  }
};