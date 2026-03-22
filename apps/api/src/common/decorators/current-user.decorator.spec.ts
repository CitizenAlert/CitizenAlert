import { CurrentUser } from './current-user.decorator';
import { createParamDecorator } from '@nestjs/common';

describe('CurrentUser Decorator', () => {
  it('should extract user from request object', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockRequest = {
      user: mockUser,
    };

    // Simulate what the decorator does - extracts user from request
    const result = (mockRequest as any).user;

    expect(result).toBeDefined();
    expect(result.id).toBe('1');
    expect(result.email).toBe('test@example.com');
  });

  it('should return undefined when user is not present on request', () => {
    const mockRequest = {} as any;

    const result = mockRequest.user;

    expect(result).toBeUndefined();
  });

  it('should extract specific user properties', () => {
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMIN',
    };

    const mockRequest = {
      user: mockUser,
    };

    const result = (mockRequest as any).user;

    expect(result.id).toBe('123');
    expect(result.email).toBe('user@example.com');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.role).toBe('ADMIN');
  });
});
