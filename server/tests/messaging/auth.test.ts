import jwt from 'jsonwebtoken';
import { verifySocketToken } from '../../src/modules/messaging/auth';

describe('verifySocketToken', () => {

  const SECRET = 'test_secret';

  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it('debe retornar el payload cuando el token es válido', () => {
    const token = jwt.sign({ userId: '123' }, SECRET);

    const result = verifySocketToken(token);

    expect(result).not.toBeNull();
    expect(result?.userId).toBe('123');
  });

  it('debe retornar null si el token es inválido', () => {
    const result = verifySocketToken('token-invalido');

    expect(result).toBeNull();
  });

  it('debe retornar null si el token está vacío', () => {
    const result = verifySocketToken('');

    expect(result).toBeNull();
  });

  it('debe retornar null si el token fue firmado con otro secreto', () => {
    const wrongToken = jwt.sign({ userId: '999' }, 'otro_secreto');

    const result = verifySocketToken(wrongToken);

    expect(result).toBeNull();
  });

});
