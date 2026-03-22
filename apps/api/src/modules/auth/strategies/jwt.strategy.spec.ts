import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret-key';
              return undefined;
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('constructor', () => {
    it('should throw error if JWT_SECRET is not configured', () => {
      const mockConfigService = {
        get: jest.fn(() => undefined),
      };

      expect(() => {
        new JwtStrategy(mockConfigService as any, {} as any);
      }).toThrow('JWT_SECRET is not configured');
    });

    it('should initialize with JWT_SECRET', () => {
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return user data for valid token payload', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(user as any);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '1',
        email: 'test@example.com',
        role: UserRole.CITIZEN,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: '999', email: 'nonexistent@example.com' };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(null as any);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should call findOne with user id from token', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(user as any);

      await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith('1');
    });

    it('should return user with ADMIN role from token', async () => {
      const payload = { sub: '2', email: 'admin@example.com' };
      const user = {
        id: '2',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(user as any);

      const result = await strategy.validate(payload);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.userId).toBe('2');
    });

    it('should include email in returned user object', async () => {
      const payload = { sub: '3', email: 'user@example.com' };
      const user = {
        id: '3',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Test',
        role: UserRole.CITIZEN,
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(user as any);

      const result = await strategy.validate(payload);

      expect(result.email).toBe('user@example.com');
    });
  });
});
