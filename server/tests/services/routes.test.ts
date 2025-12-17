import request from 'supertest';
import express from 'express';

// MOCK de la base de datos 
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// MOCK de auth para que no pida JWT real
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.userId = 'user-test-id';
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next()
}));

import { servicesRouter } from '../../src/modules/services/routes';
import { pool } from '../../src/lib/db';

const app = express();
app.use(express.json());
app.use('/services', servicesRouter);

describe('GET /services', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver lista de servicios activos', async () => {

    // Mock: consulta principal (lista de servicios)
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'srv-1',
            title: 'Servicio de prueba',
            status: 'active',
            price_qz_halves: 20
          }
        ]
      })
      // Mock: consulta COUNT(*)
      .mockResolvedValueOnce({
        rows: [{ count: '1' }]
      });

    const res = await request(app).get('/services');

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty('services');
    expect(res.body.services.length).toBe(1);
    expect(res.body.total).toBe(1);
  });

});
