// tests/messaging/routes.test.ts

// Mock del middleware de autenticación
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: () => void) => {
    req.userId = 'user123';
    next();
  },
}));

// Mock de la base de datos
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock de uuid (para mensajes iniciales)
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123'),
}));

// Imports
import request from 'supertest';
import express, { Express } from 'express';
import { messagingRouter } from '../../src/modules/messaging/routes';
import { pool } from '../../src/lib/db';

// Configuración de la app
const app: Express = express();
app.use(express.json());
app.use('/messaging', messagingRouter);

describe('GET /messaging/conversations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('debe listar las conversaciones del usuario', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: 'conv1',
          user1_id: 'user123',
          user2_id: 'user456',
          user1_name: 'Juan',
          user2_name: 'María',
        },
      ],
    });

    const res = await request(app).get('/messaging/conversations');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});

describe('GET /messaging/conversations/:id/messages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('debe retornar 403 si el usuario no pertenece a la conversación', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ user1_id: 'user999', user2_id: 'user888' }],
    });

    const res = await request(app).get('/messaging/conversations/conv999/messages');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acceso denegado');
  });

  it('debe listar mensajes si el usuario tiene acceso', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [{ user1_id: 'user123', user2_id: 'user456' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'msg1',
            message: 'Hola',
            sender_name: 'Juan',
          },
        ],
      });

    const res = await request(app).get('/messaging/conversations/conv123/messages');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /messaging/conversations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('debe retornar 400 si falta otherUserId', async () => {
    const res = await request(app).post('/messaging/conversations').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('otherUserId es requerido');
  });

  it('debe retornar 400 si el usuario intenta chatear consigo mismo', async () => {
    const res = await request(app)
      .post('/messaging/conversations')
      .send({ otherUserId: 'user123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No puedes chatear contigo mismo');
  });

  it('debe retornar 400 si el otro usuario no existe o está inactivo', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 }); // solo 1 usuario válido

    const res = await request(app)
      .post('/messaging/conversations')
      .send({ otherUserId: 'user-invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Usuario no válido');
  });

  it('debe crear una conversación exitosamente', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 2 }) // ambos usuarios existen
      .mockResolvedValueOnce({ rows: [{ id: 'new-conv' }] });

    const res = await request(app)
      .post('/messaging/conversations')
      .send({ otherUserId: 'user456' });

    expect(res.status).toBe(201);
    expect(res.body.conversationId).toBe('new-conv');
  });

  it('debe crear una conversación con mensaje inicial', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 2 })
      .mockResolvedValueOnce({ rows: [{ id: 'conv-with-msg' }] });

    const res = await request(app)
      .post('/messaging/conversations')
      .send({ otherUserId: 'user456', initialMessage: '¡Hola!' });

    expect(res.status).toBe(201);
    expect(pool.query).toHaveBeenCalledTimes(3); // conversación + mensaje
  });
});