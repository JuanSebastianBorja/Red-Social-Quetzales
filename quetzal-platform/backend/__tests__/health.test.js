// ============================================
// HEALTH ENDPOINT TESTS
// ============================================

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');

describe('Health Endpoints', () => {
  
  // Test básico de servidor
  describe('GET /health', () => {
    it('should return 200 and status OK', async () => {
      const res = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('service');
    });
  });

  // Test de conexión DB
  describe('GET /health/db', () => {
    it('should return database status', async () => {
      const res = await request(app)
        .get('/health/db')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('database', 'connected');
      expect(res.body).toHaveProperty('tables');
    });
  });

  // Test de estadísticas
  describe('GET /health/stats', () => {
    it('should return platform statistics', async () => {
      const res = await request(app)
        .get('/health/stats')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('activeUsers');
      expect(res.body.stats).toHaveProperty('activeServices');
      expect(res.body.stats).toHaveProperty('totalTransactions');
      expect(res.body.stats).toHaveProperty('totalContracts');
    });
  });

  // Cleanup
  afterAll(async () => {
    await sequelize.close();
  });
});
