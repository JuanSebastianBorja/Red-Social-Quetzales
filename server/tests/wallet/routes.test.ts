import request from 'supertest';
import express from 'express';

// Mock DB
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

// Mock auth
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'user-test-id';
    next();
  }
}));

// Mock notifications
jest.mock('../../src/modules/notifications/service', () => ({
  notificationService: {
    createNotification: jest.fn()
  }
}));

import { walletRouter } from '../../src/modules/wallet/routes';
import { pool } from '../../src/lib/db';

const app = express();
app.use(express.json());
app.use('/wallet', walletRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

// obtener balance de la cartera
describe('GET /wallet/balance', () => {

  it('debe devolver el balance del usuario', async () => {

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{
        balance_qz_halves: 20,
        balance_cop_cents: 10500
      }]
    });

    const res = await request(app).get('/wallet/balance');

    expect(res.status).toBe(200);
    expect(res.body.balance_qz).toBe(10);
    expect(res.body.balance_cop).toBe(105);
  });

  it('debe devolver 404 si no existe la wallet', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 0,
      rows: []
    });

    const res = await request(app).get('/wallet/balance');

    expect(res.status).toBe(404);
  });

});

// listar transacciones de la cartera
describe('GET /wallet/transactions', () => {

  it('debe listar transacciones del usuario', async () => {

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { id: 'tx1', type: 'transfer', status: 'completed' },
        { id: 'tx2', type: 'payment', status: 'completed' }
      ]
    });

    const res = await request(app).get('/wallet/transactions');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

});

// recargar cartera (entorno de desarrollo)
describe('POST /wallet/dev/topup', () => {

  it('debe fallar si amount_qz <= 0', async () => {

    const res = await request(app)
      .post('/wallet/dev/topup')
      .send({ amount_qz: 0 });

    expect(res.status).toBe(400);
  });


    it('debe hacer topup correctamente', async () => {

    // nombre del usuario
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ full_name: 'Juan Test' }]
    });

    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'acc-user' }] }) // cuenta usuario
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'acc-platform' }] }) // cuenta plataforma
        .mockResolvedValueOnce({ rows: [{ id: 'ltx-1' }] }) // ledger tx
        .mockResolvedValue({}), // resto
      release: jest.fn()
    };

    (pool.connect as jest.Mock).mockResolvedValue(mockClient);

    const res = await request(app)
      .post('/wallet/dev/topup')
      .send({ amount_qz: 5 });

    expect(res.status).toBe(200);
    expect(res.body.credited_qz).toBe(5);
  });

});

// transferir entre usuarios
describe('POST /wallet/transfer', () => {

  it('debe fallar si se transfiere a sí mismo', async () => {

    const res = await request(app)
      .post('/wallet/transfer')
      .send({
        recipient_id: 'user-test-id',
        amount_qz_halves: 2
      });

    expect(res.status).toBe(400);
  });

  it('debe fallar si no hay saldo suficiente', async () => {

    // destinatario existe
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'user2' }] }) // recipient
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // rate limit
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ balance_qz_halves: 0 }] }); // wallet

    const res = await request(app)
      .post('/wallet/transfer')
      .send({
        recipient_id: 'user2',
        amount_qz_halves: 10
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Saldo insuficiente');
  });

});

// generar reporte fiscal
describe('GET /wallet/reports', () => {

  it('debe generar reporte fiscal', async () => {

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: 'tx1',
          type: 'transfer_in',
          amount_qz_halves: 10,
          description: 'Ingreso',
          created_at: new Date(),
          category: 'income'
        }
      ]
    });

    const res = await request(app).get('/wallet/reports');

    expect(res.status).toBe(200);
    expect(res.body.summary.total_income_qz).toBe(5);
  });

});

