// ============================================
// ADMIN CONTROLLER - Controlador de Administración
// ============================================

const User = require('../models/User');
const Service = require('../models/Service');
const Transaction = require('../models/Transaction');
const Escrow = require('../models/Escrow');
const Rating = require('../models/Rating');
const { Op } = require('sequelize');

// @desc    Obtener todos los usuarios
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Actualizar estado de usuario (activar/desactivar)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        user.isActive = isActive;
        await user.save();

        res.json({
            success: true,
            message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Actualizar rol de usuario
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validar rol
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No permitir que un admin se quite sus propios permisos
        if (user.id === req.user.id && role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No puedes quitarte tus propios permisos de administrador'
            });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: `Rol actualizado a ${role} exitosamente`,
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Eliminar usuario
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // No permitir eliminar el propio usuario
        if (id === req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        await user.destroy();

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Actualizar estado de servicio
// @route   PUT /api/admin/services/:id/status
// @access  Private/Admin
exports.updateServiceStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        service.isActive = isActive;
        await service.save();

        res.json({
            success: true,
            message: `Servicio ${isActive ? 'activado' : 'desactivado'} exitosamente`,
            data: service
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Eliminar servicio
// @route   DELETE /api/admin/services/:id
// @access  Private/Admin
exports.deleteService = async (req, res, next) => {
    try {
        const { id } = req.params;

        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        await service.destroy();

        res.json({
            success: true,
            message: 'Servicio eliminado exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obtener todas las transacciones
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                {
                    model: User,
                    as: 'Sender',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: User,
                    as: 'Receiver',
                    attributes: ['id', 'fullName', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: transactions,
            count: transactions.length
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obtener estadísticas generales
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            };
        }

        // Contar usuarios
        const totalUsers = await User.count({ where: dateFilter });
        const activeUsers = await User.count({ 
            where: { ...dateFilter, isActive: true } 
        });
        const verifiedUsers = await User.count({ 
            where: { ...dateFilter, isVerified: true } 
        });

        // Contar servicios
        const totalServices = await Service.count({ where: dateFilter });
        const activeServices = await Service.count({ 
            where: { ...dateFilter, isActive: true } 
        });

        // Contar transacciones
        const totalTransactions = await Transaction.count({ where: dateFilter });
        const completedTransactions = await Transaction.count({ 
            where: { ...dateFilter, status: 'completed' } 
        });

        // Calcular ingresos
        const transactions = await Transaction.findAll({
            where: { ...dateFilter, status: 'completed' },
            attributes: ['amount']
        });
        const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // Calcular comisiones (10%)
        const platformFees = totalRevenue * 0.10;

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    verified: verifiedUsers
                },
                services: {
                    total: totalServices,
                    active: activeServices
                },
                transactions: {
                    total: totalTransactions,
                    completed: completedTransactions
                },
                revenue: {
                    total: totalRevenue.toFixed(2),
                    platformFees: platformFees.toFixed(2)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Obtener actividad reciente
// @route   GET /api/admin/activity
// @access  Private/Admin
exports.getRecentActivity = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        // Obtener usuarios recientes
        const recentUsers = await User.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'fullName', 'createdAt']
        });

        // Obtener servicios recientes
        const recentServices = await Service.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                attributes: ['fullName']
            }]
        });

        // Obtener transacciones recientes
        const recentTransactions = await Transaction.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'Sender',
                    attributes: ['fullName']
                },
                {
                    model: User,
                    as: 'Receiver',
                    attributes: ['fullName']
                }
            ]
        });

        // Formatear actividades
        const activities = [
            ...recentUsers.map(u => ({
                type: 'user',
                description: 'Nuevo usuario registrado',
                user: u.fullName,
                createdAt: u.createdAt
            })),
            ...recentServices.map(s => ({
                type: 'service',
                description: `Nuevo servicio: ${s.title}`,
                user: s.User?.fullName,
                createdAt: s.createdAt
            })),
            ...recentTransactions.map(t => ({
                type: 'transaction',
                description: `Transacción de Q${t.amount}`,
                user: t.Sender?.fullName,
                createdAt: t.createdAt
            }))
        ];

        // Ordenar por fecha y limitar
        activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const limitedActivities = activities.slice(0, limit);

        res.json({
            success: true,
            data: limitedActivities
        });
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
