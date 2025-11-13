// test-all-controllers.js
const { User, Service, Wallet, Transaction, EscrowAccount, ServiceRequest, Rating, Conversation, Message, Notification, NotificationPreference, UserSkill, Dispute, ServiceReport, Analytics, UserReport, AdminRole, AdminUser, ServiceImage } = require('./src/models');
const { 
  getAdminUsers,
  createAdminUser,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  adminLogin,
  getAdminProfile,
  updateAdminProfile
} = require('./src/controllers/AdminUserController');

async function testAllControllers() {
  const timestamp = Date.now();

  try {
    // 1. Crear un rol de admin
    const adminRole = await AdminRole.create({
      roleName: `Test Role ${timestamp}`,
      description: 'Rol de prueba para pruebas automatizadas',
      permissions: { users: true, services: true }
    });
    console.log('✅ AdminRole creado:', adminRole.toJSON());

    // 2. Crear un usuario admin
    const adminUser = await AdminUser.create({
      email: `admin-test-${timestamp}@example.com`,
      password: 'Admin123456',
      fullName: 'Admin de Prueba',
      roleId: adminRole.id
    });
    console.log('✅ AdminUser creado:', adminUser.toJSON());

    // 3. Crear dos usuarios
    const user1 = await User.create({
      email: `user1-test-${timestamp}@example.com`,
      password: 'User123456',
      fullName: 'Usuario de Prueba 1'
    });
    console.log('✅ Usuario 1 creado:', user1.toJSON());

    const user2 = await User.create({
      email: `user2-test-${timestamp + 1}@example.com`, // ✅ Diferente
      password: 'User123456',
      fullName: 'Usuario de Prueba 2'
    });
    console.log('✅ Usuario 2 creado:', user2.toJSON());

    // 4. Buscar o crear cartera para el usuario (✅ Evitar duplicados)
    let wallet = await Wallet.findOne({ where: { userId: user1.id } });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: user1.id,
        balance: 100.0,
        currency: 'QUETZALES'
      });
    } else {
      console.log('⚠️ Wallet ya existente:', wallet.toJSON());
    }
    console.log('✅ Wallet encontrada o creada:', wallet.toJSON());

    // 5. Crear una transacción
    const transaction = await Transaction.create({
      walletId: wallet.id,
      type: 'deposit',
      amount: 50.0,
      description: 'Depósito de prueba',
      status: 'completed'
    });
    console.log('✅ Transaction creada:', transaction.toJSON());

    // 6. Crear un servicio
    const service = await Service.create({
      userId: user1.id,
      title: 'Servicio de Prueba',
      description: 'Esta es una descripción de prueba que tiene más de 50 caracteres para cumplir con la validación del modelo. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      category: 'desarrollo',
      price: 15.5,
      deliveryTime: '7 días',
      status: 'active'
    });
    console.log('✅ Servicio creado:', service.toJSON());

    // 7. Crear una imagen de servicio (✅ URL sin espacios)
    const serviceImage = await ServiceImage.create({
      serviceId: service.id,
      imageUrl: 'https://example.com/image.jpg', // ✅ Quitados espacios
      isPrimary: true,
      orderIndex: 0
    });
    console.log('✅ ServiceImage creada:', serviceImage.toJSON());

    // 8. Crear una solicitud de servicio
    const serviceRequest = await ServiceRequest.create({
      serviceId: service.id,
      buyerId: user2.id,
      sellerId: user1.id,
      message: 'Hola, me interesa este servicio.',
      status: 'pending'
    });
    console.log('✅ ServiceRequest creada:', serviceRequest.toJSON());

    // 9. Crear una calificación
    const rating = await Rating.create({
      serviceId: service.id,
      userId: user2.id,
      rating: 5,
      comment: 'Excelente servicio, muy profesional.'
    });
    console.log('✅ Rating creada:', rating.toJSON());

    // 10. Crear una conversación (✅ Asegurar que user1Id < user2Id)
    const [user1Id, user2Id] = user1.id < user2.id ? [user1.id, user2.id] : [user2.id, user1.id];
    const conversation = await Conversation.create({
      user1Id,
      user2Id,
      serviceId: service.id
    });
    console.log('✅ Conversation creada:', conversation.toJSON());

    // 11. Crear un mensaje
    const message = await Message.create({
      conversationId: conversation.id,
      senderId: user1.id,
      message: '¡Hola! Gracias por tu interés en mi servicio.'
    });
    console.log('✅ Message creada:', message.toJSON());

    // 12. Crear una notificación
    const notification = await Notification.create({
      userId: user2.id,
      type: 'service_request',
      title: 'Nueva solicitud',
      message: 'Han solicitado tu servicio.'
    });
    console.log('✅ Notification creada:', notification.toJSON());

    // 13. Crear preferencias de notificación (✅ Evitar duplicados)
    let notificationPref = await NotificationPreference.findOne({ where: { userId: user2.id } });
    if (!notificationPref) {
      notificationPref = await NotificationPreference.create({
        userId: user2.id,
        emailTransactions: true,
        emailMessages: true,
        emailServices: false,
        emailMarketing: false,
        pushEnabled: true
      });
    } else {
      console.log('⚠️ Preferencias de notificación ya existentes:', notificationPref.toJSON());
    }
    console.log('✅ NotificationPreference encontrada o creada:', notificationPref.toJSON());

    // 14. Crear una habilidad de usuario
    const userSkill = await UserSkill.create({
      userId: user1.id,
      skillName: 'Desarrollo Web'
    });
    console.log('✅ UserSkill creada:', userSkill.toJSON());

    // 15. Crear una cuenta de garantía
    const escrow = await EscrowAccount.create({
      serviceId: service.id,
      buyerId: user2.id,
      sellerId: user1.id,
      amount: 15.5,
      status: 'pending'
    });
    console.log('✅ EscrowAccount creada:', escrow.toJSON());

    // 16. Crear una disputa
    const dispute = await Dispute.create({
      escrowId: escrow.id,
      complainantId: user2.id,
      respondentId: user1.id,
      reason: 'El servicio no se entregó como se acordó.',
      status: 'open'
    });
    console.log('✅ Dispute creada:', dispute.toJSON());

    // 17. Crear un reporte de servicio
    const serviceReport = await ServiceReport.create({
      reporterId: user2.id,
      serviceId: service.id,
      reason: 'Contenido inapropiado',
      status: 'pending'
    });
    console.log('✅ ServiceReport creada:', serviceReport.toJSON());

    // 18. Crear un registro de analytics
    const analytics = await Analytics.create({
      userId: user1.id,
      action: 'view_service',
      entityType: 'service',
      entityId: service.id
    });
    console.log('✅ Analytics creada:', analytics.toJSON());

    // 19. Crear un reporte de usuario (✅ Campos corregidos)
    const userReport = await UserReport.create({
      user_id: user1.id,
      report_type: 'activity',
      date_range_start: new Date('2024-01-01'),
      date_range_end: new Date('2024-12-31'),
      report_data: { summary: 'Reporte de actividad del año 2024' }
    });
    console.log('✅ UserReport creada:', userReport.toJSON());

    // 20. Consultar con relaciones
    const userWithRelations = await User.findByPk(user1.id, {
      include: [
        { model: Wallet, as: 'wallet' },
        { model: Service, as: 'services' },
        { model: UserSkill, as: 'skills' },
        { model: Notification, as: 'notifications' }
      ]
    });
    console.log('✅ Usuario con relaciones:', userWithRelations.toJSON());

    const serviceWithRelations = await Service.findByPk(service.id, {
      include: [
        { model: User, as: 'provider' },
        { model: ServiceImage, as: 'images' },
        { model: Rating, as: 'ratings' }
      ]
    });
    console.log('✅ Servicio con relaciones:', serviceWithRelations.toJSON());

    console.log('🎉 ¡Todos los modelos están funcionando correctamente!');
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Campo inválido:', error.errors?.[0]?.path);
    console.error('Tipo de error:', error.name);
  }
}

testAllControllers();