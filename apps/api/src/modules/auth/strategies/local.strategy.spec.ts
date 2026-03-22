import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UserRole } from '../../users/entities/user.entity';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  describe('validate', () => {
    it('should return user for valid credentials', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      const result = await strategy.validate('test@example.com', 'password123');

      expect(result).toEqual(user);
      expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(strategy.validate('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with "Invalid credentials" message', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      try {
        await strategy.validate('test@example.com', 'wrongpassword');
        fail('Should have thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect(err.message).toContain('Invalid credentials');
      }
    });

    it('should call validateUser with correct parameters', async () => {
      const user = {
        id: '2',
        email: 'user@test.com',
        firstName: 'User',
        lastName: 'Test',
        role: UserRole.ADMIN,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      await strategy.validate('user@test.com', 'pass123');

      expect(authService.validateUser).toHaveBeenCalledWith('user@test.com', 'pass123');
      expect(authService.validateUser).toHaveBeenCalledTimes(1);
    });
  });
});
