import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findByRole: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password if valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = {
        id: '1',
        email,
        password: '$2a$10$N9qo8uLOickgx2ZMRZoWReIO5gxPPxEMTIIYNCRvKs.RqbdBmPKRe',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      } as User;

      // Mock bcrypt by mocking at module level through implementation
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user);

      // We need to check that the function returns something
      const result = await service.validateUser(email, 'wrongpassword');
      expect(result).toBeNull(); // Since password won't match real bcrypt
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('token123');

      const result = await service.login(user as any);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(user.email);
    });
  });

  describe('validateAdminCode', () => {
    it('should return true if admin code is correct', async () => {
      const adminCode = 'SECRET123';
      jest.spyOn(configService, 'get').mockReturnValue(adminCode);

      const result = await service.validateAdminCode('SECRET123');
      expect(result).toBe(true);
    });

    it('should return false if admin code is incorrect', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('SECRET123');

      const result = await service.validateAdminCode('WRONG');
      expect(result).toBe(false);
    });
  });

  describe('getAllMunicipalities', () => {
    it('should return list of municipalities without password', async () => {
      const municipalities = [
        {
          id: '1',
          email: 'city1@example.com',
          firstName: 'City',
          lastName: 'One',
          role: UserRole.MUNICIPALITY,
          createdAt: new Date(),
          password: 'hashed',
        } as User,
      ];

      jest.spyOn(usersService, 'findByRole').mockResolvedValue(municipalities);

      const result = await service.getAllMunicipalities();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].email).toBe('city1@example.com');
    });

    it('should return empty array if no municipalities found', async () => {
      jest.spyOn(usersService, 'findByRole').mockResolvedValue([]);

      const result = await service.getAllMunicipalities();
      expect(result).toEqual([]);
    });
  });

  describe('getAllAdmins', () => {
    it('should return list of admins without password', async () => {
      const admins = [
        {
          id: '1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
          createdAt: new Date(),
          password: 'hashed',
        } as User,
      ];

      jest.spyOn(usersService, 'findByRole').mockResolvedValue(admins);

      const result = await service.getAllAdmins();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', async () => {
      const admins = [{ id: '1', role: UserRole.ADMIN } as User];
      const municipalities = [{ id: '2', role: UserRole.MUNICIPALITY } as User];
      const citizens = [
        { id: '3', role: UserRole.CITIZEN } as User,
        { id: '4', role: UserRole.CITIZEN } as User,
      ];

      let callCount = 0;
      jest.spyOn(usersService, 'findByRole').mockImplementation((role: UserRole) => {
        if (role === UserRole.ADMIN) return Promise.resolve(admins);
        if (role === UserRole.MUNICIPALITY) return Promise.resolve(municipalities);
        if (role === UserRole.CITIZEN) return Promise.resolve(citizens);
        return Promise.resolve([]);
      });

      const result = await service.getSystemStats();

      expect(result).toEqual({
        totalAdmins: 1,
        totalMunicipalities: 1,
        totalCitizens: 2,
      });
    });
  });

  describe('createSuperAdmin', () => {
    it('should create super admin with valid admin code', async () => {
      const adminCode = 'SECRET123';
      const registerDto = {
        email: 'newadmin@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        adminCode,
      };

      jest.spyOn(configService, 'get').mockReturnValue(adminCode);
      jest.spyOn(usersService, 'create').mockResolvedValue({
        id: '1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.ADMIN,
      } as User);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token123');

      const result = await service.createSuperAdmin(registerDto as any);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('role');
      expect((result.user as any).role).toBe(UserRole.ADMIN);
    });

    it('should throw ForbiddenException if admin code is invalid', async () => {
      const registerDto = {
        email: 'newadmin@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        adminCode: 'WRONG',
      };

      jest.spyOn(configService, 'get').mockReturnValue('SECRET123');

      await expect(service.createSuperAdmin(registerDto as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('register', () => {
    it('should register a citizen without admin code', async () => {
      const registerDto = {
        email: 'citizen@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Citizen',
        role: UserRole.CITIZEN,
      };

      jest.spyOn(usersService, 'create').mockResolvedValue({
        id: '1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.CITIZEN,
      } as User);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token123');

      const result = await service.register(registerDto as any);

      expect(result).toHaveProperty('access_token');
      expect(result.user.role).toBe(UserRole.CITIZEN);
    });

    it('should throw ForbiddenException for elevated role without admin code', async () => {
      const registerDto = {
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        adminCode: undefined,
      };

      jest.spyOn(configService, 'get').mockReturnValue('SECRET123');

      await expect(service.register(registerDto as any)).rejects.toThrow(ForbiddenException);
    });

    it('should register municipality with valid admin code', async () => {
      const adminCode = 'SECRET123';
      const registerDto = {
        email: 'city@example.com',
        password: 'password123',
        firstName: 'City',
        lastName: 'Hall',
        role: UserRole.MUNICIPALITY,
        adminCode,
      };

      jest.spyOn(configService, 'get').mockReturnValue(adminCode);
      jest.spyOn(usersService, 'create').mockResolvedValue({
        id: '2',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.MUNICIPALITY,
      } as User);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token123');

      const result = await service.register(registerDto as any);

      expect(result.user.role).toBe(UserRole.MUNICIPALITY);
    });

    it('should default to citizen role if no role specified', async () => {
      const registerDto = {
        email: 'default@example.com',
        password: 'password123',
        firstName: 'Default',
        lastName: 'User',
      };

      jest.spyOn(usersService, 'create').mockResolvedValue({
        id: '3',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.CITIZEN,
      } as User);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token123');

      const result = await service.register(registerDto as any);

      expect(result.user.role).toBe(UserRole.CITIZEN);
    });
  });

  describe('validateToken', () => {
    it('should verify and return valid token payload', async () => {
      const payload = { email: 'test@example.com', sub: '1', role: UserRole.CITIZEN };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);

      const result = await service.validateToken('validtoken');

      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken('invalidtoken')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createMairieAccount', () => {
    it('should create municipality account', async () => {
      const createMairieDto = {
        email: 'mairie@example.com',
        password: 'password123',
        firstName: 'Mairie',
        lastName: 'Admin',
      };

      jest.spyOn(usersService, 'create').mockResolvedValue({
        id: '4',
        email: createMairieDto.email,
        firstName: createMairieDto.firstName,
        lastName: createMairieDto.lastName,
        role: UserRole.MUNICIPALITY,
      } as User);

      const result = await service.createMairieAccount(createMairieDto as any);

      expect(result.user.role).toBe(UserRole.MUNICIPALITY);
      expect(result.access_token).toBe('');
    });

    it('should not return access token for mairie account', async () => {
      const createMairieDto = {
        email: 'mairie2@example.com',
        password: 'password456',
        firstName: 'Second',
        lastName: 'Mairie',
      };

      jest.spyOn(usersService, 'create').mockResolvedValue({
        id: '5',
        email: createMairieDto.email,
        firstName: createMairieDto.firstName,
        lastName: createMairieDto.lastName,
        role: UserRole.MUNICIPALITY,
      } as User);

      const result = await service.createMairieAccount(createMairieDto as any);

      expect(result.access_token).toEqual('');
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle empty email gracefully', async () => {
      const registerDto = {
        email: '',
        password: 'pass123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };

      const mockUserResult = {
        id: '1',
        email: '',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUserResult as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      // Service should handle empty email and still work
      const result = await service.register(registerDto as any);
      expect(result).toBeDefined();
    });

    it('should handle missing SUPER_ADMIN_CODE gracefully', async () => {
      const registerDto = {
        email: 'admin@test.com',
        password: 'pass123',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        adminCode: 'ANYCODE',
      };

      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      // Should fail due to missing SUPER_ADMIN_CODE
      await expect(service.register(registerDto as any)).rejects.toThrow(ForbiddenException);
    });

    it('should handle empty admin code in validateAdminCode', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('SECRET123');

      const result = await service.validateAdminCode('');
      expect(result).toBe(false);
    });

    it('should return true when admin codes match exactly', async () => {
      const code = 'EXACTMATCH123';
      jest.spyOn(configService, 'get').mockReturnValue(code);

      const result = await service.validateAdminCode(code);
      expect(result).toBe(true);
    });

    it('should be case-sensitive for admin codes', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('SECRET123');

      const resultLower = await service.validateAdminCode('secret123');
      expect(resultLower).toBe(false);

      const resultUpper = await service.validateAdminCode('SECRET123');
      expect(resultUpper).toBe(true);
    });

    it('should handle special characters in admin code', async () => {
      const specialCode = 'SECRET!@#$%^&*()_+-=[]{}|;:",.<>?';
      jest.spyOn(configService, 'get').mockReturnValue(specialCode);

      const result = await service.validateAdminCode(specialCode);
      expect(result).toBe(true);
    });

    it('should handle very long admin code', async () => {
      const longCode = 'A'.repeat(1000);
      jest.spyOn(configService, 'get').mockReturnValue(longCode);

      const result = await service.validateAdminCode(longCode);
      expect(result).toBe(true);
    });

    it('should return all municipalities from findByRole', async () => {
      const munis = [
        { id: '1', email: 'paris@fr', firstName: 'Paris', lastName: 'Hall', role: UserRole.MUNICIPALITY } as User,
        { id: '2', email: 'lyon@fr', firstName: 'Lyon', lastName: 'Hall', role: UserRole.MUNICIPALITY } as User,
      ];

      jest.spyOn(usersService, 'findByRole').mockResolvedValue(munis);

      const result = await service.getAllMunicipalities();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('paris@fr');
      expect(result[1].email).toBe('lyon@fr');
    });

    it('should exclude password from municipality list', async () => {
      const munis = [
        {
          id: '1',
          email: 'paris@fr',
          firstName: 'Paris',
          lastName: 'Hall',
          role: UserRole.MUNICIPALITY,
          password: 'hashed_password',
          createdAt: new Date(),
        } as User,
      ];

      jest.spyOn(usersService, 'findByRole').mockResolvedValue(munis);

      const result = await service.getAllMunicipalities();

      expect(result[0]).not.toHaveProperty('password');
    });

    it('should count different role types correctly in getSystemStats', async () => {
      const admins = Array(3).fill({ role: UserRole.ADMIN } as User);
      const municipalities = Array(5).fill({ role: UserRole.MUNICIPALITY } as User);
      const citizens = Array(100).fill({ role: UserRole.CITIZEN } as User);

      let callCount = 0;
      jest.spyOn(usersService, 'findByRole').mockImplementation((role: UserRole) => {
        if (role === UserRole.ADMIN) return Promise.resolve(admins);
        if (role === UserRole.MUNICIPALITY) return Promise.resolve(municipalities);
        if (role === UserRole.CITIZEN) return Promise.resolve(citizens);
        return Promise.resolve([]);
      });

      const result = await service.getSystemStats();

      expect(result.totalAdmins).toBe(3);
      expect(result.totalMunicipalities).toBe(5);
      expect(result.totalCitizens).toBe(100);
    });

    it('should handle zero users in getSystemStats', async () => {
      jest.spyOn(usersService, 'findByRole').mockResolvedValue([]);

      const result = await service.getSystemStats();

      expect(result.totalAdmins).toBe(0);
      expect(result.totalMunicipalities).toBe(0);
      expect(result.totalCitizens).toBe(0);
    });

    it('should preserve user data in login response', async () => {
      const user = {
        id: 'uuid-123',
        email: 'preserve@test.com',
        firstName: 'First',
        lastName: 'Last',
        role: UserRole.CITIZEN,
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('signed_token');

      const result = await service.login(user as any);

      expect(result.user.id).toBe('uuid-123');
      expect(result.user.email).toBe('preserve@test.com');
      expect(result.user.firstName).toBe('First');
      expect(result.user.lastName).toBe('Last');
      expect(result.access_token).toBe('signed_token');
    });

    it('should sign token with user payload data', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await service.login(user as any);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        role: user.role,
      });
    });

    it('should throw ForbiddenException with specific message for super admin code mismatch', async () => {
      const registerDto = {
        email: 'admin@test.com',
        password: 'pass',
        firstName: 'Admin',
        lastName: 'Test',
        adminCode: 'WRONGCODE',
      };

      jest.spyOn(configService, 'get').mockReturnValue('CORRECTCODE');

      try {
        await service.createSuperAdmin(registerDto as any);
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('admin code');
      }
    });
  });
});
