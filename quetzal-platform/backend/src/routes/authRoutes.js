    // ============================================
    // AUTH ROUTES - Rutas de Autenticación
    // ============================================

    const express = require('express');
    const { body } = require('express-validator');
    const {
    register,
    login,
    verifyToken,
    logout,
    forgotPassword,
    resetPassword
    } = require('../controllers/authController');
    const { protect } = require('../middleware/authMiddleware');

    const router = express.Router();

    // Validaciones
    const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una mayúscula y un número'),
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('El nombre completo es requerido')
        .isLength({ min: 3 })
        .withMessage('El nombre debe tener al menos 3 caracteres'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Número de teléfono inválido'),
    body('userType')
        .isIn(['provider', 'consumer', 'both'])
        .withMessage('Tipo de usuario inválido')
    ];

    const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
    ];

    const forgotPasswordValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido')
    ];

    const resetPasswordValidation = [
    body('token')
        .notEmpty()
        .withMessage('Token es requerido'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una mayúscula y un número')
    ];

    // Rutas públicas
    router.post('/register', registerValidation, register);
    router.post('/login', loginValidation, login);
    router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
    router.post('/reset-password', resetPasswordValidation, resetPassword);

    // Rutas protegidas
    router.get('/verify', protect, verifyToken);
    router.post('/logout', protect, logout);

    module.exports = router;