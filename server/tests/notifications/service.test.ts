import { NotificationService } from '../../src/modules/notifications/service';

// Mock onlineUsers (WebSocket)
jest.mock('../../src/modules/messaging/ws', () => ({
  onlineUsers: new Map(),
}));

import { onlineUsers } from '../../src/modules/messaging/ws';

describe('NotificationService', () => {

  let mockPool: any;
  let service: NotificationService;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    service = new NotificationService(mockPool);
    onlineUsers.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //crea notificación
  it('should create notification and emit websocket if user is online', async () => {
        const mockSocket = {
    connected: true,
    emit: jest.fn(),
    } as unknown as import('socket.io').Socket;

onlineUsers.set('user1', new Set([mockSocket]));

    // Insert notification
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ id: 'notif1', created_at: new Date() }],
      })
      // Preferences
      .mockResolvedValueOnce({
        rows: [{ push_enabled: true }],
      });

    await service.createNotification({
      userId: 'user1',
      type: 'new_message',
      title: 'Nuevo mensaje',
      message: 'Hola',
      actionUrl: '/mensajes',
    });

    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'new_notification',
      expect.objectContaining({
        id: 'notif1',
        type: 'new_message',
        title: 'Nuevo mensaje',
        message: 'Hola',
      })
    );
  });

  it('should NOT emit websocket if user is offline', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ id: 'notif1', created_at: new Date() }],
      })
      .mockResolvedValueOnce({
        rows: [{ push_enabled: true }],
      });

    await service.createNotification({
      userId: 'user1',
      type: 'new_message',
      title: 'Nuevo mensaje',
      message: 'Hola',
      actionUrl: '/mensajes',
    });

    expect(mockPool.query).toHaveBeenCalledTimes(2);
  });

  // obtener conteo de no leídas
  it('should return unread notifications count', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ count: '5' }],
    });

    const count = await service.getUnreadCount('user1');

    expect(count).toBe(5);
  });

  // obtener lista de notificaciones
  it('should return notifications list', async () => {
    const fakeNotifications = [{ id: '1' }, { id: '2' }];
    mockPool.query.mockResolvedValueOnce({
      rows: fakeNotifications,
    });

    const result = await service.getNotifications('user1', 10, 0);

    expect(result).toEqual(fakeNotifications);
  });

  // marcar como leída
  it('should return true when notification is marked as read', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'notif1' }],
    });

    const result = await service.markAsRead('user1', 'notif1');

    expect(result).toBe(true);
  });

  it('should return false when notification does not exist', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [],
    });

    const result = await service.markAsRead('user1', 'notif1');

    expect(result).toBe(false);
  });

  // marcar todas como leídas
  it('should mark all notifications as read', async () => {
    mockPool.query.mockResolvedValueOnce({});

    await service.markAllAsRead('user1');

    expect(mockPool.query).toHaveBeenCalled();
  });

});
