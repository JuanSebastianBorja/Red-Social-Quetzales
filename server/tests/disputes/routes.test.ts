import express, { Express } from 'express';
import request from 'supertest';
import { disputesRouter } from '../../src/modules/disputes/routes';
import { pool } from '../../src/lib/db';

// Mockear dependencias
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.userId = req.testUserId || 'user-123';
    next();
  },
}));

// No necesitamos mockear notificationService porque no se usa en las rutas GET

describe('Disputes Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/disputes', disputesRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /disputes', () => {
    it('debe devolver la lista de disputas del usuario autenticado', async () => {
      const mockDisputes = [
        {
          id: 'dispute-1',
          complainant_id: 'user-123',
          respondent_id: 'user-456',
          status: 'open',
          complainant_name: 'Juan',
          respondent_name: 'Ana',
          contract_title: 'Diseño de logo',
        },
      ];

      (pool.query as jest.Mock).mockResolvedValue({ rows: mockDisputes });

      const res = await request(app)
        .get('/disputes')
        .set('testUserId', 'user-123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockDisputes);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['user-123']
      );
    });

    it('debe filtrar por status válido', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const res = await request(app)
        .get('/disputes?status=in_review')
        .set('testUserId', 'user-123');

      expect(res.status).toBe(200);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND d.status = $2'),
        ['user-123', 'in_review']
      );
    });

    it('debe ignorar status inválido', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const res = await request(app)
        .get('/disputes?status=invalid_status')
        .set('testUserId', 'user-123');

      expect(res.status).toBe(200);
      // La consulta NO debe incluir el filtro de status
      const callArgs = (pool.query as jest.Mock).mock.calls[0];
      expect(callArgs[0]).not.toMatch(/d\.status = \$\d+/);
      expect(callArgs[1]).toEqual(['user-123']);
    });

    it('debe responder 500 si falla la base de datos', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .get('/disputes')
        .set('testUserId', 'user-123');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Error al cargar disputas' });
    });
  });

  describe('GET /disputes/:id', () => {
    it('debe devolver el detalle si el usuario es parte de la disputa', async () => {
      const mockDispute = {
        id: 'dispute-500',
        complainant_id: 'user-123',
        respondent_id: 'user-789',
        complainant_name: 'Juan',
        respondent_name: 'Camila',
        service_title: 'Desarrollo web',
        amount_qz_halves: 5000,
        escrow_status: 'disputed',
      };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockDispute], rowCount: 1 });

      const res = await request(app)
        .get('/disputes/dispute-500')
        .set('testUserId', 'user-123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockDispute);
    });

    it('debe devolver 404 si la disputa no existe o no pertenece al usuario', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      const res = await request(app)
        .get('/disputes/dispute-999')
        .set('testUserId', 'user-123');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Disputa no encontrada o no autorizada' });
    });

    it('debe responder 500 si falla la base de datos', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Query failed'));

      const res = await request(app)
        .get('/disputes/dispute-500')
        .set('testUserId', 'user-123');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Error al cargar la disputa' });
    });
  });
});