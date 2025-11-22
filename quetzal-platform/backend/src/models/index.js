// ============================================
// MODELS INDEX - Relaciones entre Modelos
// ============================================

const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const User = require('./User');
const Service = require('./Service');
const AdminRole = require('./AdminRole');
const AdminUser = require('./AdminUser');
const Analytics = require('./Analytics');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Dispute = require('./Dispute');
const EscrowAccount = require('./EscrowAccount');
const Notification = require('./Notification');
const NotificationPreference = require('./NotificationPreference');
const Rating = require('./Rating');
const ServiceImage = require('./ServiceImage');
const ServiceReport = require('./ServiceReport');
const ServiceRequest = require('./ServiceRequest');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const UserReport = require('./UserReport');
const UserSkill = require('./UserSkill');

// ============================================
// RELACIONES (ASSOCIATIONS)
// ============================================

// User -> Services
User.hasMany(Service, {
    foreignKey: 'userId',
    as: 'services',
    onDelete: 'CASCADE'
});

Service.belongsTo(User, {
    foreignKey: 'userId',
    as: 'provider'
});

// User -> Transactions
User.hasMany(Transaction, {
    foreignKey: 'userId',
    as: 'userTransactions',
    onDelete: 'CASCADE'
});

Transaction.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Service -> Ratings
Service.hasMany(Rating, {
    foreignKey: 'serviceId',
    as: 'ratings',
    onDelete: 'CASCADE'
});

Rating.belongsTo(Service, {
    foreignKey: 'serviceId',
    as: 'ratingService'
});

Rating.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Service -> Images
Service.hasMany(ServiceImage, {
    foreignKey: 'serviceId',
    as: 'images',
    onDelete: 'CASCADE'
});

ServiceImage.belongsTo(Service, {
    foreignKey: 'serviceId',
    as: 'imageService',
    onDelete: 'CASCADE'
});

// ServiceRequest
ServiceRequest.belongsTo(Service, {
    foreignKey: 'serviceId',
    as: 'requestService',
    onDelete: 'CASCADE'
});

ServiceRequest.belongsTo(User, {
    foreignKey: 'buyerId',
    as: 'buyer',
    onDelete: 'CASCADE'
});

ServiceRequest.belongsTo(User, {
    foreignKey: 'sellerId',
    as: 'seller',
    onDelete: 'CASCADE'
});

// Wallet
User.hasOne(Wallet, {
    foreignKey: 'userId',
    as: 'wallet',
    onDelete: 'CASCADE'
});

Wallet.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

Wallet.hasMany(Transaction, {
    foreignKey: 'walletId',
    as: 'transactions',
    onDelete: 'SET NULL'
});

Transaction.belongsTo(Wallet, {
    foreignKey: 'walletId',
    as: 'wallet'
});

// UserReport
User.hasMany(UserReport, {
    foreignKey: 'userId',
    as: 'reports',
    onDelete: 'CASCADE'
});

UserReport.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// UserSkill
User.hasMany(UserSkill, {
    foreignKey: 'userId',
    as: 'skills',
    onDelete: 'CASCADE'
});

UserSkill.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// AdminRole
AdminRole.hasMany(AdminUser, {
    foreignKey: 'roleId',
    as: 'users',
    onDelete: 'CASCADE'
});

AdminUser.belongsTo(AdminRole, {
    foreignKey: 'roleId',
    as: 'role'
});

// Analytics
Analytics.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Conversation
Conversation.belongsTo(User, {
    foreignKey: 'user1Id',
    as: 'user1',
    onDelete: 'CASCADE'
});

Conversation.belongsTo(User, {
    foreignKey: 'user2Id',
    as: 'user2',
    onDelete: 'CASCADE'
});

Conversation.belongsTo(Service, {
    foreignKey: 'serviceId',
    as: 'conversationService',
    onDelete: 'SET NULL'
});

Conversation.hasMany(Message, {
    foreignKey: 'conversationId',
    as: 'messages',
    onDelete: 'CASCADE'
});

// Message
Message.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender',
    onDelete: 'CASCADE'
});

Message.belongsTo(Conversation, {
    foreignKey: 'conversationId',
    as: 'conversation',
    onDelete: 'CASCADE'
});

// Dispute
Dispute.belongsTo(EscrowAccount, {
    foreignKey: 'escrowId',
    as: 'escrow'
});

Dispute.belongsTo(User, {
    foreignKey: 'complainantId',
    as: 'complainant'
});

Dispute.belongsTo(User, {
    foreignKey: 'respondentId',
    as: 'respondent'
});

Dispute.belongsTo(AdminUser, {
    foreignKey: 'resolvedBy',
    as: 'resolvedByAdmin'
});

// EscrowAccount
EscrowAccount.belongsTo(Service, {
    foreignKey: 'serviceId',
    as: 'escrowService'
});

EscrowAccount.belongsTo(User, {
    foreignKey: 'buyerId',
    as: 'buyer'
});

EscrowAccount.belongsTo(User, {
    foreignKey: 'sellerId',
    as: 'seller'
});

// Notification
User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications',
    onDelete: 'CASCADE'
});

Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// NotificationPreference
NotificationPreference.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// ServiceReport
ServiceReport.belongsTo(User, {
    foreignKey: 'reporterId',
    as: 'reporter',
    onDelete: 'CASCADE'
});

ServiceReport.belongsTo(Service, {
    foreignKey: 'serviceId',
    as: 'reportedService',
    onDelete: 'CASCADE'
});

ServiceReport.belongsTo(AdminUser, {
    foreignKey: 'reviewedBy',
    as: 'reviewer',
    onDelete: 'SET NULL'
});

// ============================================
// EXPLICACIÓN DE LAS RELACIONES:
// ============================================

/*

📌 ¿QUÉ SIGNIFICA ESTO?

1. User.hasMany(Service)
- Un usuario puede crear MUCHOS servicios
- Ejemplo: Juan puede crear "Desarrollo Web", "Diseño Logo", etc.

2. Service.belongsTo(User)
- Cada servicio pertenece a UN usuario
- Ejemplo: El servicio "Desarrollo Web" fue creado por Juan

3. as: 'provider'
- Le ponemos un "alias" para que sea más claro
- Ahora cuando traigamos un servicio, podemos acceder al usuario como "provider"
- Ejemplo: service.provider.fullName

4. onDelete: 'CASCADE'
- Si eliminas un usuario, automáticamente se eliminan todos sus servicios
- Es para mantener la base de datos limpia

---

5. Service.hasMany(ServiceImage)
- Un servicio puede tener MUCHAS imágenes
- Ejemplo: El servicio "Desarrollo Web" puede tener imágenes "imagen1.jpg", "imagen2.jpg", etc.

6. ServiceImage.belongsTo(Service)
- Cada imagen pertenece a UN servicio
- Ejemplo: La imagen "imagen1.jpg" pertenece al servicio "Desarrollo Web"

7. as: 'imageService'
- Le ponemos un alias diferente para evitar conflictos
- Ahora cuando traigamos una imagen, podemos acceder al servicio como "imageService"
- Ejemplo: image.imageService.title

---

📌 ¿CÓMO SE USA EN CÓDIGO?

// Obtener un servicio con sus imágenes:
const service = await Service.findByPk(serviceId, {
    include: [{
        model: ServiceImage,
        as: 'images',
        attributes: ['id', 'imageUrl', 'isPrimary', 'orderIndex'],
        order: [['orderIndex', 'ASC']]
    }]
});

// Resultado:
{
    id: "123",
    title: "Desarrollo Web",
    images: [
        { id: "456", imageUrl: "https://...", isPrimary: true, orderIndex: 0 },
        { id: "789", imageUrl: "https://...", isPrimary: false, orderIndex: 1 }
    ]
}

// Obtener una imagen con su servicio:
const image = await ServiceImage.findByPk(imageId, {
    include: [{
        model: Service,
        as: 'imageService',
        attributes: ['title', 'price']
    }]
});

// Resultado:
{
    id: "456",
    imageUrl: "https://...",
    imageService: {
        title: "Desarrollo Web",
        price: 15.5
    }
}

*/
module.exports = {
    sequelize,
    Sequelize,

    User,
    Service,
    AdminRole,
    AdminUser,
    Analytics,
    Conversation,
    Message,
    Dispute,
    EscrowAccount,
    Notification,
    NotificationPreference,
    Rating,
    ServiceImage,
    ServiceReport,
    ServiceRequest,
    Wallet,
    Transaction,
    UserReport,
    UserSkill
};
