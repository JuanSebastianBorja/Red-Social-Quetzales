// server/tests/notifications/routes.test.ts
import express from 'express';
import request from 'supertest';
import { notificationsRouter } from '../../src/modules/notifications/routes';
import { NotificationService } from '../../src/modules/notifications/service'; // ¡importa el original para acceder al mock!

// 1. Mock authenticate
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.userId = 'user-test';
    next();
  },
}));

// 2. Mock NotificationService — con mocks definidos DENTRO
jest.mock('../../src/modules/notifications/service', () => {
  const mock = {
    getUnreadCount: jest.fn(),
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  return {
    NotificationService: jest.fn().mockImplementation(() => mock),
    // Exportamos el mock para usarlo en los tests
    __mocks: mock,
  };
});

// 3. Ahora accedemos a los mocks a través del módulo mockeado
const { __mocks: serviceMocks } = jest.requireMock('../../src/modules/notifications/service');

// 4. App setup
const app = express();
app.use(express.json());
app.use('/notifications', notificationsRouter);

describe('Notifications Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // obtener conteo de no leídas
  it('GET /notifications/unread → returns unread count', async () => {
    serviceMocks.getUnreadCount.mockResolvedValue(3);
    const res = await request(app).get('/notifications/unread');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 3 });
    expect(serviceMocks.getUnreadCount).toHaveBeenCalledWith('user-test');
  });

  // obtener lista de notificaciones
  it('GET /notifications → returns notifications list', async () => {
    const fakeNotifications = [
      { id: '1', message: 'Hola' },
      { id: '2', message: 'Nuevo mensaje' },
    ];
    serviceMocks.getNotifications.mockResolvedValue(fakeNotifications);
    const res = await request(app).get('/notifications?limit=10&offset=0');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeNotifications);
    expect(serviceMocks.getNotifications).toHaveBeenCalledWith('user-test', 10, 0);
  });

  // marcar como leída
  it('PATCH /notifications/:id/read → marks as read', async () => {
    serviceMocks.markAsRead.mockResolvedValue(true);
    const res = await request(app).patch('/notifications/123/read');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(serviceMocks.markAsRead).toHaveBeenCalledWith('user-test', '123');
  });

  // marcar como leída - no encontrado
  it('PATCH /notifications/:id/read → 404 if not found', async () => {
    serviceMocks.markAsRead.mockResolvedValue(false);
    const res = await request(app).patch('/notifications/999/read');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Notification not found' });
  });

// marcar todas como leídas
  it('PATCH /notifications/read-all → marks all as read', async () => {
    serviceMocks.markAllAsRead.mockResolvedValue(undefined);
    const res = await request(app).patch('/notifications/read-all');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(serviceMocks.markAllAsRead).toHaveBeenCalledWith('user-test');
  });
});