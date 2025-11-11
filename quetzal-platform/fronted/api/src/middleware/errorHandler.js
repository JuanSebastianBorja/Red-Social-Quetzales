    // ============================================
    // ERROR HANDLER - Middleware de Manejo de Errores
    // ============================================

    // Clase personalizada de error
    class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
    }

    // Middleware de manejo de errores
    const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log del error (en desarrollo)
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    // Error de Sequelize - Validación
    if (err.name === 'SequelizeValidationError') {
        const message = err.errors.map(e => e.message).join(', ');
        error = new AppError(message, 400);
    }

    // Error de Sequelize - Registro duplicado
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = 'Ya existe un registro con esos datos';
        error = new AppError(message, 400);
    }

    // Error de Sequelize - No encontrado
    if (err.name === 'SequelizeEmptyResultError') {
        const message = 'Recurso no encontrado';
        error = new AppError(message, 404);
    }

    // Error de JWT - Token inválido
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token inválido';
        error = new AppError(message, 401);
    }

    // Error de JWT - Token expirado
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expirado';
        error = new AppError(message, 401);
    }

    // Error de Cast (ID inválido)
    if (err.name === 'CastError') {
        const message = 'ID de recurso inválido';
        error = new AppError(message, 400);
    }

    // Respuesta de error
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && {
        error: err,
        stack: err.stack
        })
    });
    };

    // Manejo de rutas no encontradas
    const notFound = (req, res, next) => {
    const error = new AppError(`Ruta no encontrada - ${req.originalUrl}`, 404);
    next(error);
    };

    module.exports = errorHandler;
    module.exports.AppError = AppError;
    module.exports.notFound = notFound;