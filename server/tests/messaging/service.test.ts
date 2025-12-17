import { canSendMessage, createMessage } from '../../src/modules/messaging/service';

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'uuid-mock',
}));

describe('Messaging Service', () => {

  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===============================
  // canSendMessage
  // ===============================

  it('should return false if conversation does not exist', async () => {
    mockPool.query.mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    });

    const result = await canSendMessage('conv1', 'user1', mockPool);
    expect(result).toBe(false);
  });

  it('should return true if user is participant', async () => {
    mockPool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user1_id: 'user1', user2_id: 'user2' }],
    });

    const result = await canSendMessage('conv1', 'user1', mockPool);
    expect(result).toBe(true);
  });

  it('should return false if user is not participant', async () => {
    mockPool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user1_id: 'user1', user2_id: 'user2' }],
    });

    const result = await canSendMessage('conv1', 'user3', mockPool);
    expect(result).toBe(false);
  });

  // ===============================
  // createMessage
  // ===============================

  it('should create message and notification successfully', async () => {

    // 1️⃣ Insert message
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'uuid-mock',
          conversation_id: 'conv1',
          sender_id: 'user1',
          message: 'Hola',
          message_type: 'text',
        }],
      })
      // 2️⃣ Get sender name
      .mockResolvedValueOnce({
        rows: [{ full_name: 'Juan Pérez' }],
      })
      // 3️⃣ Get conversation users
      .mockResolvedValueOnce({
        rows: [{ user1_id: 'user1', user2_id: 'user2' }],
      })
      // 4️⃣ Insert notification
      .mockResolvedValueOnce({});

    const result = await createMessage(
      'conv1',
      'user1',
      'Hola',
      'text',
      mockPool
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: 'uuid-mock',
        conversation_id: 'conv1',
        sender_id: 'user1',
        message: 'Hola',
        sender: {
          id: 'user1',
          full_name: 'Juan Pérez',
        },
      })
    );

    // Validar que se ejecutaron las queries
    expect(mockPool.query).toHaveBeenCalledTimes(4);
  });

});
