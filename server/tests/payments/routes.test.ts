import request from 'supertest';
import express from 'express';
import { paymentsRouter } from '../../src/modules/payments/routes';

// MOCKS 

// Auth
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    next();
  },
}));

// DB
const mockQuery = jest.fn();
const mockClientQuery = jest.fn();

jest.mock('../../src/lib/db', () => ({
  pool: {
    query: (...args: any[]) => mockQuery(...args),
    connect: jest.fn(() => ({
      query: mockClientQuery,
      release: jest.fn(),
    })),
  },
}));

//  APP 
const app = express();
app.use(express.json());
app.use('/payments', paymentsRouter);

describe('Payments Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // post /payments/purchase
  describe('POST /payments/purchase', () => {
    it('should create a purchase transaction', async () => {
      mockQuery
        // insert transaction
        .mockResolvedValueOnce({
          rows: [{ id: 'tx-1' }],
        })
        // actualizar balance usuario
        .mockResolvedValueOnce({});

      const res = await request(app)
        .post('/payments/purchase')
        .send({ qz_amount: 10 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          transaction_id: 'tx-1',
          qz_amount: 10,
          exchange_rate: expect.any(Number),
        })
      );

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should return 400 for invalid qz_amount', async () => {
      const res = await request(app)
        .post('/payments/purchase')
        .send({ qz_amount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid qz_amount');
    });
  });

  // post /payments/mock-confirm
  describe('POST /payments/mock-confirm', () => {
    it('should confirm a pending transaction', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) 
        // select transaction FOR UPDATE
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 'tx-1',
            user_id: 'user-1',
            status: 'pending',
            amount_qz_halves: 20,
          }],
        })
        // INSERT plataforma account
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'plat-acc' }] })
        // INSERT cuena usuario
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'user-acc' }] })
        // INSERT ledger transaction
        .mockResolvedValueOnce({ rows: [{ id: 'ledger-tx' }] })
        // INSERT ledger entries
        .mockResolvedValueOnce({})
        // UPDATE ledger tx
        .mockResolvedValueOnce({})
        // UPDATE transaction
        .mockResolvedValueOnce({})
        // COMMIT
        .mockResolvedValueOnce({});

      const res = await request(app)
        .post('/payments/mock-confirm')
        .send({ payment_reference: 'EP-123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });

      expect(mockClientQuery).toHaveBeenCalled();
    });

    it('should return 404 if transaction not found', async () => {
      mockClientQuery
        .mockResolvedValueOnce({}) 
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }); // SELECT

      const res = await request(app)
        .post('/payments/mock-confirm')
        .send({ payment_reference: 'NO-EXISTE' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Transaction not found');
    });

    it('should return 400 if payment_reference is missing', async () => {
      const res = await request(app)
        .post('/payments/mock-confirm')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('payment_reference required');
    });
  });
});
