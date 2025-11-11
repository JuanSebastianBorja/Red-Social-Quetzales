// ============================================
// SERVICEREPORT.JS - Modelo de Reportes de Servicios
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServiceReport = sequelize.define('ServiceReport', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'reporter_id',
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'service_id',
        references: {
            model: 'services',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'dismissed', 'action_taken'),
        defaultValue: 'pending'
    },
    reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'reviewed_by',
        references: {
            model: 'admin_users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at'
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'admin_notes'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    tableName: 'service_reports',
    timestamps: false, 
    underscored: true
});

module.exports = ServiceReport;