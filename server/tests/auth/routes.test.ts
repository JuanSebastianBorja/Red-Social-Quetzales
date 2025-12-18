// tests/auth/auth.routes.test.ts
import request from 'supertest';
import express, { Express } from 'express';
import { authRouter } from '../../src/modules/auth/routes';

// Mockear dependencias externas
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../../src/lib/auth', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  signAccessToken: jest.fn(),
}));

// Importar mocks para usarlos en las pruebas
import { pool } from '../../src/lib/db';
import { hashPassword, verifyPassword, signAccessToken } from '../../src/lib/auth';

// Configurar app Express para pruebas
const app: Express = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('POST /auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com' }); // falta password, full_name, city

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing fields');
  });

  it('registra un usuario correctamente', async () => {
    // Mocks
    (hashPassword as jest.Mock).mockResolvedValue('hashed123');
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{
        id: 'user123',
        email: 'test@test.com',
        full_name: 'Test User',
        user_type: 'both',
        city: 'Bogotá'
      }]
    });
    (signAccessToken as jest.Mock).mockReturnValue('fake-jwt-token');

    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@test.com',
        password: '12345678',
        full_name: 'Test User',
        city: 'Bogotá'
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBe('fake-jwt-token');
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.user.user_type).toBe('both');
  });

  it('retorna 409 si el email ya existe', async () => {
    (hashPassword as jest.Mock).mockResolvedValue('hashed123');
    (pool.query as jest.Mock).mockRejectedValueOnce({
      code: '23505', // unique violation en PostgreSQL
      message: 'duplicate key'
    });

    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'existing@test.com',
        password: '12345678',
        full_name: 'Existing',
        city: 'Medellín'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email exists');
  });
});

describe('POST /auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com' }); // falta password

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password required');
  });

  it('retorna 401 si el usuario no existe', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 }); // no es admin
    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 }); // no es usuario

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'notfound@test.com', password: '123456' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('login correcto para usuario normal', async () => {
    // Primera query: no es admin
    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
    // Segunda query: sí es usuario
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 'user456', password: 'hashed123', user_type: 'client' }]
    });
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (signAccessToken as jest.Mock).mockReturnValue('user-jwt-token');

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('user-jwt-token');
    expect(res.body.scope).toBe('user');
    expect(res.body.role).toBe('client');
  });

  it('login correcto para admin', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 'admin1', password: 'adminhash', role_name: 'superadmin' }]
    });
    (pool.query as jest.Mock).mockResolvedValueOnce({ // mock para verificar crypt
      rows: [{ ok: true }]
    });

    (signAccessToken as jest.Mock).mockReturnValue('admin-jwt-token');

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@quetzales.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('admin-jwt-token');
    expect(res.body.scope).toBe('admin');
    expect(res.body.role).toBe('superadmin');
  });

  it('retorna 401 si la contraseña es incorrecta', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 }); // no admin
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 'user789', password: 'correct-hash', user_type: 'provider' }]
    });
    (verifyPassword as jest.Mock).mockResolvedValue(false); // contraseña incorrecta

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'wrong-pass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});
