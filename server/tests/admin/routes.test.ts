import request from 'supertest';
import express from 'express';
import { notificationService } from '../../src/modules/notifications/service';

// MOCK BASE DE DATOS
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

// MOCK MIDDLEWARE ADMIN
jest.mock('../../src/middleware/admin', () => ({
  authenticateAdmin: (req: any, _res: any, next: any) => {
    req.adminId = 'admin-test-id';
    req.adminRole = 'superadmin';
    next();
  },
  requireAdminRole: (_roles: string[]) => (_req: any, _res: any, next: any) => next()
}));

// MOCK JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'fake-jwt-token')
}));

// MOCK NOTIFICATIONS
jest.mock('../../src/modules/notifications/service', () => ({
  notificationService: {
    createNotification: jest.fn()
  }
}));

import { adminRouter } from '../../src/modules/admin/routes';
import { pool } from '../../src/lib/db';

const app = express();
app.use(express.json());
app.use('/admin', adminRouter);

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// POST /admin/login
describe('POST /admin/login', () => {

  it('debe devolver token si credenciales son válidas', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'admin-1', password: 'hashed-pass', role_name: 'superadmin' }]
      })
      .mockResolvedValueOnce({
        rows: [{ ok: true }]
      });

    const res = await request(app)
      .post('/admin/login')
      .send({ email: 'admin@test.com', password: '12345678' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('fake-jwt-token');
    expect(res.body.role).toBe('superadmin');
  });

  it('debe devolver 401 si credenciales son inválidas', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 0,
      rows: []
    });

    const res = await request(app)
      .post('/admin/login')
      .send({ email: 'admin@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

});

// GET /admin/users
describe('GET /admin/users', () => {

  it('debe devolver lista de admins', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{
        id: '1',
        email: 'admin@test.com',
        full_name: 'Admin Test',
        role_name: 'superadmin'
      }]
    });

    const res = await request(app).get('/admin/users');

    expect(res.status).toBe(200);
    expect(res.body[0].email).toBe('admin@test.com');
  });

});

// GET /admin/services
describe('GET /admin/services', () => {

  it('debe devolver lista de servicios', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{
        id: 1,
        user_id: 'user-1',
        title: 'Servicio prueba',
        status: 'active'
      }]
    });

    const res = await request(app).get('/admin/services');

    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Servicio prueba');
  });

  it('debe filtrar servicios por estado', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 2, status: 'paused' }]
    });

    const res = await request(app).get('/admin/services?status=paused');

    expect(res.status).toBe(200);
    expect(res.body[0].status).toBe('paused');
  });

});

// PATCH /admin/services/:id/status
describe('PATCH /admin/services/:id/status', () => {

  it('debe actualizar el estado del servicio', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 1, status: 'inactive' }]
    });

    const res = await request(app)
      .patch('/admin/services/1/status')
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');
  });

  it('debe devolver 400 si estado inválido', async () => {
    const res = await request(app)
      .patch('/admin/services/1/status')
      .send({ status: 'otro' });

    expect(res.status).toBe(400);
  });

  it('debe devolver 404 si el servicio no existe', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 0,
      rows: []
    });

    const res = await request(app)
      .patch('/admin/services/999/status')
      .send({ status: 'active' });

    expect(res.status).toBe(404);
  });

});

// GET /admin/reports
describe('GET /admin/reports', () => {

  it('debe devolver lista de reportes', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, status: 'pending' }]
    });

    const res = await request(app).get('/admin/reports');

    expect(res.status).toBe(200);
    expect(res.body[0].status).toBe('pending');
  });

});

// PATCH /admin/reports/:id
describe('PATCH /admin/reports/:id', () => {

  it('debe marcar reporte como reviewed', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ service_id: 'service-1' }]
    });

    const res = await request(app)
      .patch('/admin/reports/1')
      .send({ status: 'reviewed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reviewed');
  });

  it('debe eliminar servicio y notificar proveedor', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ service_id: 'service-99' }]
      })
      .mockResolvedValueOnce({
        rows: [{ user_id: 'user-123' }]
      })
      .mockResolvedValueOnce({});

    const res = await request(app)
      .patch('/admin/reports/99')
      .send({ status: 'action_taken' });

    expect(res.status).toBe(200);
    expect(notificationService.createNotification).toHaveBeenCalled();
  });

});

// GET /admin/disputes
describe('GET /admin/disputes', () => {

  it('debe devolver lista de disputas', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 'disp-1', dispute_status: 'open' }]
    });

    const res = await request(app).get('/admin/disputes');

    expect(res.status).toBe(200);
    expect(res.body[0].dispute_status).toBe('open');
  });

});

// PATCH /admin/disputes/:id/status
describe('PATCH /admin/disputes/:id/status', () => {

  it('debe devolver 404 si disputa no existe', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 0
    });

    const res = await request(app)
      .patch('/admin/disputes/999/status')
      .send({ status: 'resolved' });

    expect(res.status).toBe(404);
  });

  it('debe reembolsar al comprador', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{
        escrow_id: 'escrow-1',
        amount_qz_halves: 500,
        escrow_status: 'disputed',
        buyer_id: 'buyer-1',
        seller_id: 'seller-1',
        contract_title: 'Contrato Test'
      }]
    });

    const mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn()
    };

    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    const res = await request(app)
      .patch('/admin/disputes/1/status')
      .send({
        status: 'resolved',
        resolution_type: 'refund_to_buyer'
      });

    expect(res.status).toBe(200);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

});
