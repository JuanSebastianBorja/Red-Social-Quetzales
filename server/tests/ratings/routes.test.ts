import request from 'supertest';
import express from 'express';
import { ratingsRouter } from '../../src/modules/ratings/routes';

// MOCKS 
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'buyer-1';
    next();
  },
}));

const mockQuery = jest.fn();

jest.mock('../../src/lib/db', () => ({
  pool: {
    query: (...args: any[]) => mockQuery(...args),
  },
}));

// APP 
const app = express();
app.use(express.json());
app.use('/ratings', ratingsRouter);

describe('Ratings Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //post ratings
  describe('POST /ratings', () => {
    it('should create a rating successfully', async () => {
      mockQuery
        // contrato
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 'contract-1',
            service_id: 'service-1',
            buyer_id: 'buyer-1',
            seller_id: 'seller-1',
            status: 'completed',
          }],
        })
        // duplicado
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        // insert rating
        .mockResolvedValueOnce({
          rows: [{
            id: 'rating-1',
            service_id: 'service-1',
            user_id: 'buyer-1',
            rating: 5,
            comment: 'Excelente',
            created_at: new Date(),
          }],
        })
        // update contrato
        .mockResolvedValueOnce({});

      const res = await request(app)
        .post('/ratings')
        .send({
          contract_id: 'contract-1',
          rating: 5,
          comment: 'Excelente',
        });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(5);
    });

    it('should reject rating outside range', async () => {
      const res = await request(app)
        .post('/ratings')
        .send({
          contract_id: 'contract-1',
          rating: 6,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('rating debe estar entre 1 y 5');
    });
  });

  // get ratings por servicio
  describe('GET /ratings/service/:id', () => {
    it('should list service ratings with avg and total', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 'r1', rating: 5 }],
        })
        .mockResolvedValueOnce({
          rows: [{ total: 1, avg: 5 }],
        });

      const res = await request(app).get('/ratings/service/service-1');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.avg).toBe(5);
      expect(res.body.items.length).toBe(1);
    });
  });

  // get ratings por usuario
  describe('GET /ratings/user/:id', () => {
    it('should list ratings received by provider', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 'r1', rating: 4 }],
        })
        .mockResolvedValueOnce({
          rows: [{ total: 1, avg: 4 }],
        });

      const res = await request(app).get('/ratings/user/seller-1');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.avg).toBe(4);
    });
  });

  // get ratings por usuario que califica
  describe('GET /ratings/by-user/:id', () => {
    it('should list ratings made by user', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 'r1', rating: 5 }],
        })
        .mockResolvedValueOnce({
          rows: [{ total: 1, avg: 5 }],
        });

      const res = await request(app).get('/ratings/by-user/buyer-1');

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.avg).toBe(5);
    });
  });
});
