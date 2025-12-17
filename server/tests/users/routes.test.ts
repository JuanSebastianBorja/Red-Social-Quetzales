import request from 'supertest';
import express from 'express';

// Mock de base de datos
jest.mock('../../src/lib/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock de autenticación
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'user-test-id';
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next()
}));

// Mock de argon2 
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  verify: jest.fn().mockResolvedValue(true)
}));

import { usersRouter } from '../../src/modules/users/routes';
import { pool } from '../../src/lib/db';

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /users/search', () => {

  it('debe devolver usuarios proveedores', async () => {

    // Query principal
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'u1',
            full_name: 'Juan Pérez',
            city: 'Bogotá',
            average_rating: 4.5,
            total_ratings: 10
          }
        ]
      })
      // Mock: consulta COUNT
      .mockResolvedValueOnce({
        rows: [{ count: '1' }]
      });

    const res = await request(app).get('/users/search');

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.total).toBe(1);
  });

});

// obtener perfil propio
describe('GET /users/me', () => {

  it('debe devolver el perfil del usuario autenticado', async () => {

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{
        id: 'user-test-id',
        email: 'test@mail.com',
        full_name: 'Usuario Test',
        city: 'Medellín',
        user_type: 'provider'
      }]
    });

    const res = await request(app).get('/users/me');

    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Usuario Test');
  });

});

// actualizar perfil propio
describe('PATCH /users/me', () => {

  it('debe actualizar el perfil del usuario', async () => {

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{
        id: 'user-test-id',
        full_name: 'Nuevo Nombre',
        city: 'Cali'
      }]
    });

    const res = await request(app)
      .patch('/users/me')
      .send({
        full_name: 'Nuevo Nombre',
        city: 'Cali'
      });

    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Nuevo Nombre');
  });

});

// cambiar contraseña propia
describe('PATCH /users/me/password', () => {

  it('debe cambiar la contraseña correctamente', async () => {

    // Obtener contraseña actual
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ password: 'hashed-old' }]
      })
      // Update password
      .mockResolvedValueOnce({});

    const res = await request(app)
      .patch('/users/me/password')
      .send({
        current_password: '12345678',
        new_password: 'nuevaPassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

});

// obtener perfil público de otro usuario
describe('GET /users/:id/profile', () => {

  it('debe devolver perfil público', async () => {

    (pool.query as jest.Mock)
      // Usuario
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'u1',
          full_name: 'Proveedor',
          is_verified: true
        }]
      })
      // Privacidad
      .mockResolvedValueOnce({
        rows: [{ public_profile: true, show_email: false, show_phone: false }]
      })
      // Ciudad
      .mockResolvedValueOnce({
        rows: [{ city: 'Bogotá' }]
      });

    const res = await request(app).get('/users/u1/profile');

    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Proveedor');
  });

});



