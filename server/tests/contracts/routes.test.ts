import request from 'supertest';
import express from 'express';
import { contractsRouter } from '../../src/modules/contracts/routes';

// Mock del middleware de auth
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.userId = 1; // usuario falso autenticado
    next();
  }
}));

// Mock de la BD
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock de notificaciones
jest.mock('../../src/modules/notifications/service', () => ({
  notificationService: {
    createNotification: jest.fn()
  }
}));

import { pool } from '../../src/lib/db';

const app = express();
app.use(express.json());
app.use('/contracts', contractsRouter);

describe('POST /contracts', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar 400 si no se envía service_id', async () => {
    const res = await request(app)
      .post('/contracts')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('service_id is required');
  });

  it('debe crear un contrato correctamente', async () => {
    // Mock consulta servicio
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          user_id: 2,
          price_qz_halves: 10,
          status: 'active',
          title: 'Diseño de logo',
          description: 'Logo profesional',
          delivery_time: 5
        }]
      })
      // Mock ver contrato existente
      .mockResolvedValueOnce({ rowCount: 0 })
      // Mock insert contrato
      .mockResolvedValueOnce({
        rows: [{
          id: 99,
          title: 'Diseño de logo',
          status: 'pending'
        }]
      });

    const res = await request(app)
      .post('/contracts')
      .send({ service_id: 5 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('pending');
  });

});

// 2. Servicio no encontrado
it('debe retornar 404 si el servicio no existe', async () => {
  (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });

  const res = await request(app)
    .post('/contracts')
    .send({ service_id: 999 });

  expect(res.status).toBe(404);
  expect(res.body.error).toBe('Service not found');
});

// 3. Servicio inactivo
it('debe retornar 400 si el servicio no está activo', async () => {
  (pool.query as jest.Mock).mockResolvedValueOnce({
    rowCount: 1,
    rows: [{
      user_id: 2,
      status: 'inactive', // ← inactivo
      price_qz_halves: 10,
      title: 'Inactivo',
      description: '...',
      delivery_time: 3
    }]
  });

  const res = await request(app)
    .post('/contracts')
    .send({ service_id: 10 });

  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Service is not active');
});

// 4. Contratar tu propio servicio
it('debe retornar 400 si el usuario intenta contratar su propio servicio', async () => {
  (pool.query as jest.Mock).mockResolvedValueOnce({
    rowCount: 1,
    rows: [{
      user_id: 1, // ← mismo que req.userId
      status: 'active',
      price_qz_halves: 10,
      title: 'Mi propio servicio',
      description: '...',
      delivery_time: 3
    }]
  });

  const res = await request(app)
    .post('/contracts')
    .send({ service_id: 11 });

  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Cannot contract your own service');
});

// 5. Ya tiene un contrato activo
it('debe retornar 400 si ya existe un contrato activo para ese servicio', async () => {
  (pool.query as jest.Mock)
    .mockResolvedValueOnce({ // servicio
      rowCount: 1,
      rows: [{
        user_id: 2,
        status: 'active',
        price_qz_halves: 10,
        title: 'Servicio X',
        description: '...',
        delivery_time: 3
      }]
    })
    .mockResolvedValueOnce({ // contrato existente
      rowCount: 1 // ← ya hay uno activo
    });

  const res = await request(app)
    .post('/contracts')
    .send({ service_id: 12 });

  expect(res.status).toBe(400);
  expect(res.body.error).toBe('You already have an active contract for this service');
});

// obtener lista de contratos
describe('GET /contracts', () => {

  it('debe devolver la lista de contratos del usuario', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          service_id: 10,
          client_id: 1,
          provider_id: 2,
          status: 'active',
          price_qz_halves: 300,
          created_at: new Date()
        }
      ]
    });

    const res = await request(app).get('/contracts');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe('active');
  });

});

// obtener contrato por id
describe('GET /contracts/:id', () => {

  it('debe devolver el contrato si existe y pertenece al usuario', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 1,
          service_id: 10,
          client_id: 1,
          provider_id: 2,
          status: 'active'
        }
      ]
    });

    const res = await request(app).get('/contracts/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.status).toBe('active');
  });
    it('debe devolver 404 si el contrato no existe', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 0,
        rows: []
    });

  const res = await request(app).get('/contracts/999');

  expect(res.status).toBe(404);
  expect(res.body.error).toBe('Contract not found or access denied');
});

});