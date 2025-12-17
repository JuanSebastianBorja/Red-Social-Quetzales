import request from 'supertest';
import express from 'express';
import { serviceRequestsRouter } from '../../src/modules/service-requests/routes';

// Mock del pool de PostgreSQL
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock del middleware authenticate
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    // Simulamos usuario autenticado
    req.userId = 'user-123';
    next();
  },
}));

// Mock del notificationService
jest.mock('../../src/modules/notifications/service', () => ({
  notificationService: {
    createNotification: jest.fn(),
  },
}));

import { pool } from '../../src/lib/db';

const app = express();
app.use(express.json());
app.use('/service-requests', serviceRequestsRouter);

describe('Service Requests Routes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST /service-requests
  describe('POST /service-requests', () => {

    it('❌ debe fallar si no se envía service_id', async () => {
      const res = await request(app)
        .post('/service-requests')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('service_id es requerido');
    });

    it('❌ debe fallar si el servicio no existe', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      });

      const res = await request(app)
        .post('/service-requests')
        .send({ service_id: 'service-1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Servicio no encontrado');
    });

    it('✅ debe crear una solicitud de servicio correctamente', async () => {
      //  Mock buscar servicio
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 'service-1',
            user_id: 'seller-999',
            price_qz_halves: 100,
            status: 'active',
          }],
        })
        // Mock insert service_request
        .mockResolvedValueOnce({
          rows: [{
            id: 'sr-1',
            service_id: 'service-1',
            buyer_id: 'user-123',
            seller_id: 'seller-999',
            status: 'pending',
          }],
        });

      const res = await request(app)
        .post('/service-requests')
        .send({
          service_id: 'service-1',
          message: 'Estoy interesado',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('sr-1');
      expect(res.body.status).toBe('pending');
    });
  });

  // GET /service-requests
  describe('GET /service-requests', () => {

    it('✅ debe listar solicitudes del usuario', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { id: 'sr-1', status: 'pending' },
          { id: 'sr-2', status: 'accepted' },
        ],
      });

      const res = await request(app)
        .get('/service-requests');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });
-
  // PATCH /service-requests/:id
  describe('PATCH /service-requests/:id', () => {

    it('❌ debe fallar si la solicitud no existe', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      });

      const res = await request(app)
        .patch('/service-requests/sr-404')
        .send({ status: 'accepted' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Solicitud no encontrada');
    });

    it('❌ debe fallar si el usuario no pertenece a la solicitud', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'sr-1',
          buyer_id: 'otro-user',
          seller_id: 'otro-seller',
          status: 'pending',
        }],
      });

      const res = await request(app)
        .patch('/service-requests/sr-1')
        .send({ status: 'cancelled' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('No perteneces a esta solicitud');
    });
  });
});
