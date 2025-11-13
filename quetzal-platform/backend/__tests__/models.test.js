// ============================================
// MODELS INTEGRATION TEST
// ============================================

const { sequelize } = require('../src/config/database');
const { 
  User, 
  Service, 
  Wallet, 
  Transaction, 
  Contract, 
  Conversation, 
  Message 
} = require('../src/models');

describe('Models Integration', () => {
  
  beforeAll(async () => {
    // Connect to database
    await sequelize.authenticate();
  });

  describe('Model Loading', () => {
    it('should load User model', () => {
      expect(User).toBeDefined();
      expect(User.name).toBe('User');
    });

    it('should load Service model', () => {
      expect(Service).toBeDefined();
      expect(Service.name).toBe('Service');
    });

    it('should load Wallet model', () => {
      expect(Wallet).toBeDefined();
    });

    it('should load Transaction model', () => {
      expect(Transaction).toBeDefined();
    });

    it('should load Contract model', () => {
      expect(Contract).toBeDefined();
    });

    it('should load Conversation model', () => {
      expect(Conversation).toBeDefined();
    });

    it('should load Message model', () => {
      expect(Message).toBeDefined();
    });
  });

  describe('Model Associations', () => {
    it('User should have associations', () => {
      const associations = User.associations;
      expect(associations).toHaveProperty('services');
      expect(associations).toHaveProperty('wallet');
      expect(associations).toHaveProperty('transactions');
    });

    it('Service should belong to User', () => {
      const associations = Service.associations;
      expect(associations).toHaveProperty('provider');
    });

    it('Contract should have associations', () => {
      const associations = Contract.associations;
      expect(associations).toHaveProperty('service');
      expect(associations).toHaveProperty('buyer');
      expect(associations).toHaveProperty('seller');
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
