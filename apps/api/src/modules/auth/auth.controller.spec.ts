import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            validateUser: jest.fn(),
            login: jest.fn(),
            validateAdminCode: jest.fn(),
            getAllMunicipalities: jest.fn(),
            getAllAdmins: jest.fn(),
            getSystemStats: jest.fn(),
            createSuperAdmin: jest.fn(),
            createMairieAccount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      jest.spyOn(authService, 'register').mockResolvedValue({
        access_token: 'token123',
        user: {
          id: '1',
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: UserRole.CITIZEN,
        },
      } as any);

      const result = await controller.register(registerDto as any);

      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe(registerDto.email);
    });
  });

  describe('POST /auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: loginDto.email,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(user as any);
      jest.spyOn(authService, 'login').mockReturnValue({
        access_token: 'token123',
        user,
      } as any);

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };

      const req = { user };

      const result = controller.getProfile(req);

      expect(result).toEqual(user);
    });
  });

  describe('POST /auth/create-mairie', () => {
    it('should create mairie account if user is admin', async () => {
      const createMairieDto = {
        email: 'city@example.com',
        password: 'password123',
        firstName: 'City',
        lastName: 'Hall',
      };

      const adminUser = {
        id: '1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const req = { user: adminUser };

      jest.spyOn(authService, 'createMairieAccount').mockResolvedValue({
        access_token: '',
        user: {
          id: '2',
          email: createMairieDto.email,
          firstName: createMairieDto.firstName,
          lastName: createMairieDto.lastName,
          role: UserRole.MUNICIPALITY,
        },
      } as any);

      const result = await controller.createMairie(createMairieDto as any, req);

      expect(result).toHaveProperty('user');
      expect(result.user.role).toBe(UserRole.MUNICIPALITY);
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const createMairieDto = {
        email: 'city@example.com',
        password: 'password123',
        firstName: 'City',
        lastName: 'Hall',
      };

      const citizenUser = {
        id: '1',
        email: 'citizen@example.com',
        role: UserRole.CITIZEN,
      };

      const req = { user: citizenUser };

      await expect(controller.createMairie(createMairieDto as any, req)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('POST /auth/validate-admin-code', () => {
    it('should return true for valid admin code', async () => {
      const dto = { adminCode: 'SECRET123' };

      jest.spyOn(authService, 'validateAdminCode').mockResolvedValue(true);

      const result = await controller.validateAdminCode(dto);

      expect(result.valid).toBe(true);
    });

    it('should return false for invalid admin code', async () => {
      const dto = { adminCode: 'WRONG' };

      jest.spyOn(authService, 'validateAdminCode').mockResolvedValue(false);

      const result = await controller.validateAdminCode(dto);

      expect(result.valid).toBe(false);
    });
  });

  describe('GET /auth/municipalities', () => {
    it('should return list of municipalities', async () => {
      const municipalities = [
        {
          id: '1',
          email: 'city1@example.com',
          firstName: 'City',
          lastName: 'One',
          role: UserRole.MUNICIPALITY,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(authService, 'getAllMunicipalities').mockResolvedValue(municipalities);

      const result = await controller.getMunicipalities();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('city1@example.com');
    });
  });

  describe('GET /auth/admins', () => {
    it('should return list of admins', async () => {
      const admins = [
        {
          id: '1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(authService, 'getAllAdmins').mockResolvedValue(admins);

      const result = await controller.getAdmins();

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(UserRole.ADMIN);
    });
  });

  describe('GET /auth/system-stats', () => {
    it('should return system statistics', async () => {
      const stats = {
        totalAdmins: 1,
        totalMunicipalities: 5,
        totalCitizens: 100,
      };

      jest.spyOn(authService, 'getSystemStats').mockResolvedValue(stats);

      const result = await controller.getSystemStats();

      expect(result.totalAdmins).toBe(1);
      expect(result.totalMunicipalities).toBe(5);
      expect(result.totalCitizens).toBe(100);
    });
  });

  describe('POST /auth/create-super-admin', () => {
    it('should create super admin with valid code', async () => {
      const registerDto = {
        email: 'newadmin@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        adminCode: 'SECRET123',
      };

      jest.spyOn(authService, 'createSuperAdmin').mockResolvedValue({
        access_token: 'token123',
        user: {
          id: '1',
          email: registerDto.email,
          role: UserRole.ADMIN,
        },
      } as any);

      const result = await controller.createSuperAdmin(registerDto as any);

      expect(result).toHaveProperty('access_token');
      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('registration validation', () => {
    it('should accept email with various formats', async () => {
      const emails = [
        'test@example.com',
        'user+tag@example.co.uk',
        'firstname.lastname@example.com',
      ];

      for (const email of emails) {
        jest.spyOn(authService, 'register').mockResolvedValue({
          access_token: 'token123',
          user: { id: '1', email, role: UserRole.CITIZEN },
        } as any);

        const result = await controller.register({
          email,
          password: 'pass123',
          firstName: 'Test',
          lastName: 'User',
        } as any);

        expect(result).toHaveProperty('access_token');
      }
    });

    it('should reject duplicate email registration', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      jest.spyOn(authService, 'register').mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(controller.register(registerDto as any)).rejects.toThrow();
    });

    it('should accept various password formats', async () => {
      const passwords = ['Pass123!@#', 'Complex$Pass2024', 'Simple1Pass'];

      for (const password of passwords) {
        jest.spyOn(authService, 'register').mockResolvedValue({
          access_token: 'token123',
          user: { id: '1', email: 'test@example.com', role: UserRole.CITIZEN },
        } as any);

        const result = await controller.register({
          email: 'test@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
        } as any);

        expect(result).toHaveProperty('access_token');
      }
    });

    it('should accept all three user roles', async () => {
      const roles = [UserRole.CITIZEN, UserRole.MUNICIPALITY, UserRole.ADMIN];

      for (const role of roles) {
        jest.spyOn(authService, 'register').mockResolvedValue({
          access_token: 'token123',
          user: { id: '1', email: 'test@example.com', role },
        } as any);

        const result = await controller.register({
          email: 'test@example.com',
          password: 'pass123',
          firstName: 'Test',
          lastName: 'User',
          role,
          adminCode: role === UserRole.ADMIN ? 'SECRET123' : undefined,
        } as any);

        expect(result.user.role).toBe(role);
      }
    });
  });

  describe('login edge cases', () => {
    it('should handle multiple login attempts', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: loginDto.email,
        role: UserRole.CITIZEN,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(user as any);
      jest.spyOn(authService, 'login').mockReturnValue({
        access_token: 'token123',
        user,
      } as any);

      // First login
      const result1 = await controller.login(loginDto);
      expect(result1).toHaveProperty('access_token');

      // Second login with same credentials
      const result2 = await controller.login(loginDto);
      expect(result2).toHaveProperty('access_token');
    });

    it('should handle case-sensitive email login', async () => {
      const loginDto = {
        email: 'Test@Example.COM',
        password: 'password123',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: UserRole.CITIZEN,
      } as any);

      jest.spyOn(authService, 'login').mockReturnValue({
        access_token: 'token123',
        user: { id: '1', email: 'test@example.com', role: UserRole.CITIZEN },
      } as any);

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('access_token');
    });

    it('should reject null user from validation', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('municipality operations', () => {
    it('should list multiple municipalities', async () => {
      const municipalities = [
        { id: '1', email: 'paris@example.com', firstName: 'Paris', role: UserRole.MUNICIPALITY },
        { id: '2', email: 'lyon@example.com', firstName: 'Lyon', role: UserRole.MUNICIPALITY },
        { id: '3', email: 'marseille@example.com', firstName: 'Marseille', role: UserRole.MUNICIPALITY },
      ];

      jest.spyOn(authService, 'getAllMunicipalities').mockResolvedValue(municipalities as any);

      const result = await controller.getMunicipalities();

      expect(result).toHaveLength(3);
      expect(result.every(m => m.role === UserRole.MUNICIPALITY)).toBe(true);
    });

    it('should handle empty municipalities list', async () => {
      jest.spyOn(authService, 'getAllMunicipalities').mockResolvedValue([]);

      const result = await controller.getMunicipalities();

      expect(result).toHaveLength(0);
    });

    it('should only return municipality role users', async () => {
      const users = [
        { id: '1', email: 'paris@example.com', role: UserRole.MUNICIPALITY },
        { id: '2', email: 'citizen@example.com', role: UserRole.CITIZEN },
        { id: '3', email: 'admin@example.com', role: UserRole.ADMIN },
      ];

      jest.spyOn(authService, 'getAllMunicipalities').mockResolvedValue([users[0]] as any);

      const result = await controller.getMunicipalities();

      expect(result.every(m => m.role === UserRole.MUNICIPALITY)).toBe(true);
    });

    it('should create mairie account with all required fields', async () => {
      const createMairieDto = {
        email: 'newcity@example.com',
        password: 'municipal123',
        firstName: 'New',
        lastName: 'City',
      };

      const adminUser = {
        id: '1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      jest.spyOn(authService, 'createMairieAccount').mockResolvedValue({
        access_token: 'token123',
        user: {
          id: '2',
          email: createMairieDto.email,
          firstName: createMairieDto.firstName,
          lastName: createMairieDto.lastName,
          role: UserRole.MUNICIPALITY,
        },
      } as any);

      const result = await controller.createMairie(createMairieDto as any, { user: adminUser } as any);

      expect(result.user.role).toBe(UserRole.MUNICIPALITY);
      expect(result.user.email).toBe(createMairieDto.email);
    });
  });

  describe('admin operations', () => {
    it('should list all admins', async () => {
      const admins = [
        { id: '1', email: 'admin1@example.com', role: UserRole.ADMIN },
        { id: '2', email: 'admin2@example.com', role: UserRole.ADMIN },
      ];

      jest.spyOn(authService, 'getAllAdmins').mockResolvedValue(admins as any);

      const result = await controller.getAdmins();

      expect(result).toHaveLength(2);
      expect(result.every(a => a.role === UserRole.ADMIN)).toBe(true);
    });

    it('should handle empty admin list', async () => {
      jest.spyOn(authService, 'getAllAdmins').mockResolvedValue([]);

      const result = await controller.getAdmins();

      expect(result).toHaveLength(0);
    });

    it('should create super admin with valid code', async () => {
      const registerDto = {
        email: 'super@example.com',
        password: 'superpass123',
        firstName: 'Super',
        lastName: 'Admin',
        adminCode: 'SUPER_SECRET',
      };

      jest.spyOn(authService, 'createSuperAdmin').mockResolvedValue({
        access_token: 'token123',
        user: {
          id: '1',
          email: registerDto.email,
          role: UserRole.ADMIN,
        },
      } as any);

      const result = await controller.createSuperAdmin(registerDto as any);

      expect(result.user.role).toBe(UserRole.ADMIN);
    });

    it('should reject super admin creation with invalid code', async () => {
      const registerDto = {
        email: 'hacker@example.com',
        password: 'pass123',
        firstName: 'Hacker',
        lastName: 'User',
        adminCode: 'WRONG_CODE',
      };

      jest.spyOn(authService, 'createSuperAdmin').mockRejectedValue(
        new ForbiddenException('Invalid admin code'),
      );

      await expect(controller.createSuperAdmin(registerDto as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('system statistics', () => {
    it('should return complete system statistics', async () => {
      const stats = {
        totalAdmins: 3,
        totalMunicipalities: 15,
        totalCitizens: 2500,
      };

      jest.spyOn(authService, 'getSystemStats').mockResolvedValue(stats);

      const result = await controller.getSystemStats();

      expect(result.totalAdmins).toBe(3);
      expect(result.totalMunicipalities).toBe(15);
      expect(result.totalCitizens).toBe(2500);
    });

    it('should return zero stats for empty system', async () => {
      const stats = {
        totalAdmins: 0,
        totalMunicipalities: 0,
        totalCitizens: 0,
      };

      jest.spyOn(authService, 'getSystemStats').mockResolvedValue(stats);

      const result = await controller.getSystemStats();

      expect(result.totalAdmins).toBe(0);
      expect(result.totalMunicipalities).toBe(0);
      expect(result.totalCitizens).toBe(0);
    });

    it('should verify role distribution adds up to total', async () => {
      const stats = {
        totalAdmins: 5,
        totalMunicipalities: 25,
        totalCitizens: 970,
      };

      jest.spyOn(authService, 'getSystemStats').mockResolvedValue(stats);

      const result = await controller.getSystemStats();

      const total = result.totalAdmins + result.totalMunicipalities + result.totalCitizens;
      expect(total).toBe(1000);
    });
  });

  describe('user profile', () => {
    it('should return complete user profile', () => {
      const user = {
        id: '1',
        email: 'user@example.com',
        firstName: 'first',
        lastName: 'last',
        role: UserRole.CITIZEN,
        phoneNumber: '+33600000000',
        pushToken: 'token123',
        createdAt: new Date(),
      };

      const req = { user };

      const result = controller.getProfile(req);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.role).toBe(UserRole.CITIZEN);
      expect(result.phoneNumber).toBe('+33600000000');
    });

    it('should return minimal user profile', () => {
      const user = {
        id: '2',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      const req = { user };

      const result = controller.getProfile(req);

      expect(result.email).toBe(user.email);
      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('admin code validation edge cases', () => {
    it('should accept various admin code formats', async () => {
      const codes = ['SECRET123', 'ADMIN_CODE_2024', 'Code!@#$'];

      for (const code of codes) {
        jest.spyOn(authService, 'validateAdminCode').mockResolvedValue(true);

        const result = await controller.validateAdminCode({ adminCode: code });

        expect(result.valid).toBe(true);
      }
    });

    it('should reject empty admin code', async () => {
      jest.spyOn(authService, 'validateAdminCode').mockResolvedValue(false);

      const result = await controller.validateAdminCode({ adminCode: '' });

      expect(result.valid).toBe(false);
    });

    it('should reject null admin code as invalid', async () => {
      jest.spyOn(authService, 'validateAdminCode').mockResolvedValue(false);

      const result = await controller.validateAdminCode({ adminCode: null as any });

      expect(result.valid).toBe(false);
    });

    it('should be case-sensitive with admin codes', async () => {
      jest.spyOn(authService, 'validateAdminCode')
        .mockResolvedValueOnce(true) // Correct case
        .mockResolvedValueOnce(false); // Wrong case

      const result1 = await controller.validateAdminCode({ adminCode: 'CORRECT' });
      const result2 = await controller.validateAdminCode({ adminCode: 'correct' });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle service errors during registration', async () => {
      jest.spyOn(authService, 'register').mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.register({
          email: 'test@example.com',
          password: 'pass123',
          firstName: 'Test',
          lastName: 'User',
        } as any),
      ).rejects.toThrow();
    });

    it('should handle service errors during login', async () => {
      jest.spyOn(authService, 'validateUser').mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.login({
          email: 'test@example.com',
          password: 'pass123',
        }),
      ).rejects.toThrow();
    });

    it('should handle service errors during mairie creation', async () => {
      jest.spyOn(authService, 'createMairieAccount').mockRejectedValue(
        new Error('Service unavailable'),
      );

      const adminUser = { id: '1', role: UserRole.ADMIN };

      await expect(
        controller.createMairie(
          {
            email: 'city@example.com',
            password: 'pass123',
            firstName: 'City',
            lastName: 'Hall',
          } as any,
          { user: adminUser } as any,
        ),
      ).rejects.toThrow();
    });
  });
});
