// ============================================
// VALIDATION MIDDLEWARE
// ============================================

const { validationResult } = require('express-validator');

/**
 * Middleware para validar los campos usando express-validator
 */
const validationMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

module.exports = validationMiddleware;
