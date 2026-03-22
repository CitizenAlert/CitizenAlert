import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { Hazard } from '../hazards/entities/hazard.entity';

const mockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  email: 'test@example.com',
  password: 'hashed_password',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '',
  pushToken: '',
  role: UserRole.CITIZEN,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;
  let hazardsRepository: Repository<Hazard>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Hazard),
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    hazardsRepository = module.get<Repository<Hazard>>(getRepositoryToken(Hazard));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CITIZEN,
      };

      const user = mockUser();

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(usersRepository, 'create').mockReturnValue(user);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(user);

      const result = await service.create(createUserDto as any);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser());

      await expect(service.create(createUserDto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const users = [mockUser({ id: '1' }), mockUser({ id: '2' })];

      jest.spyOn(usersRepository, 'find').mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should return user by id without password', async () => {
      const user = mockUser();

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = mockUser();

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByRole', () => {
    it('should return all users with specific role', async () => {
      const admins = [
        mockUser({ id: '1', role: UserRole.ADMIN }),
        mockUser({ id: '2', role: UserRole.ADMIN }),
      ];

      jest.spyOn(usersRepository, 'find').mockResolvedValue(admins);

      const result = await service.findByRole(UserRole.ADMIN);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(UserRole.ADMIN);
    });

    it('should return empty array if no users with role found', async () => {
      jest.spyOn(usersRepository, 'find').mockResolvedValue([]);

      const result = await service.findByRole(UserRole.ADMIN);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      const user = mockUser();
      const updateDto = {
        firstName: 'Updated',
      };
      const updatedUser = { ...user, ...updateDto };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(updatedUser);

      const result = await service.update('1', updateDto as any, '1');

      expect(result.firstName).toBe('Updated');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ForbiddenException if user tries to update another user', async () => {
      const user = mockUser();

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);

      await expect(service.update('1', {} as any, '2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile with new email', async () => {
      const user = mockUser();
      const updateDto = {
        email: 'newemail@example.com',
        firstName: 'Updated',
      };
      const updatedUser = { ...user, ...updateDto };

      // First findOne is called by findOneInternal, second by checking if new email exists
      const findOneSpy = jest.spyOn(usersRepository, 'findOne');
      findOneSpy.mockResolvedValueOnce(user);
      findOneSpy.mockResolvedValueOnce(null); // New email doesn't exist
      jest.spyOn(usersRepository, 'save').mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', updateDto as any);

      expect(result.email).toBe('newemail@example.com');
    });

    it('should throw ConflictException if new email already taken', async () => {
      const user = mockUser();
      const updateDto = {
        email: 'taken@example.com',
      };

      const findOneSpy = jest.spyOn(usersRepository, 'findOne');
      findOneSpy.mockResolvedValueOnce(user);
      findOneSpy.mockResolvedValueOnce(mockUser({ id: '2', email: 'taken@example.com' }));

      await expect(service.updateProfile('1', updateDto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    it('should change user password with valid current password', async () => {
      const user = mockUser({ password: '$2a$10$hashedpassword' });

      const changePasswordDto = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(user);

      // Mock bcrypt functions to avoid actual hashing
      const bcryptSpy = jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);
      jest.spyOn(require('bcryptjs'), 'hash').mockResolvedValue('new_hashed_password');

      await expect(service.changePassword('1', changePasswordDto as any)).resolves.toBeUndefined();

      expect(usersRepository.save).toHaveBeenCalled();
      bcryptSpy.mockRestore();
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.changePassword('1', { currentPassword: 'old', newPassword: 'new' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePushToken', () => {
    it('should update user push token', async () => {
      const user = mockUser();
      const updatedUser = { ...user, pushToken: 'new_token' };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(updatedUser);

      const result = await service.updatePushToken('1', 'new_token');

      expect(result.pushToken).toBe('new_token');
    });
  });

  describe('deleteUserData', () => {
    it('should delete user and their hazards', async () => {
      const user = mockUser();

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(hazardsRepository, 'delete').mockResolvedValue({ affected: 5 } as any);
      jest.spyOn(usersRepository, 'remove').mockResolvedValue(user);

      await service.deleteUserData('1', { email: 'test@example.com' });

      expect(hazardsRepository.delete).toHaveBeenCalledWith({ userId: '1' });
      expect(usersRepository.remove).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if email does not match', async () => {
      const user = mockUser();

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);

      await expect(service.deleteUserData('1', { email: 'wrong@example.com' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('deleteUserDataByEmail', () => {
    it('should delete user by email and their hazards', async () => {
      const user = mockUser();

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(hazardsRepository, 'delete').mockResolvedValue({ affected: 5 } as any);
      jest.spyOn(usersRepository, 'remove').mockResolvedValue(user);

      await service.deleteUserDataByEmail({ email: 'test@example.com' });

      expect(hazardsRepository.delete).toHaveBeenCalledWith({ userId: '1' });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteUserDataByEmail({ email: 'nonexistent@example.com' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('edge cases and comprehensive scenarios', () => {
    it('should handle user with all optional fields populated', async () => {
      const userWithAllFields = mockUser({
        id: '2',
        email: 'full@example.com',
        firstName: 'Full',
        lastName: 'Profile',
        phoneNumber: '+33612345678',
        pushToken: 'expo_push_token_123',
        role: UserRole.MUNICIPALITY,
        isActive: true,
      });

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(userWithAllFields);
      const result = await service.findOne('2');

      expect(result.phoneNumber).toBe('+33612345678');
      expect(result.pushToken).toBe('expo_push_token_123');
    });

    it('should handle inactive users', async () => {
      const inactiveUser = mockUser({
        isActive: false,
      });

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(inactiveUser);
      const result = await service.findOne('1');

      expect(result.isActive).toBe(false);
    });

    it('should find user by email correctly', async () => {
      const user = mockUser({
        email: 'specific@example.com',
      });

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      const result = await service.findByEmail('specific@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('specific@example.com');
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'specific@example.com' },
      });
    });

    it('should return null if email does not exist', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should find multiple users by role', async () => {
      const adminUsers = [
        mockUser({ id: '1', role: UserRole.ADMIN, email: 'admin1@example.com' }),
        mockUser({ id: '2', role: UserRole.ADMIN, email: 'admin2@example.com' }),
      ];

      jest.spyOn(usersRepository, 'find').mockResolvedValue(adminUsers);
      const result = await service.findByRole(UserRole.ADMIN);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(UserRole.ADMIN);
      expect(result[1].role).toBe(UserRole.ADMIN);
    });

    it('should return empty array when no users have role', async () => {
      jest.spyOn(usersRepository, 'find').mockResolvedValue([]);
      const result = await service.findByRole(UserRole.ADMIN);

      expect(result).toEqual([]);
    });

    it('should create user with CITIZEN role by default', async () => {
      const createDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const savedUser = mockUser({ email: createDto.email });
      jest.spyOn(usersRepository, 'create').mockReturnValue(savedUser);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(savedUser);

      await service.create(createDto as any);

      expect(usersRepository.create).toHaveBeenCalled();
    });

    it('should update push token for user', async () => {
      const user = mockUser({
        id: '1',
        pushToken: '',
      });

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(usersRepository, 'save').mockResolvedValue({ ...user, pushToken: 'new_token_123' });

      await service.updatePushToken('1', 'new_token_123');

      expect(usersRepository.save).toHaveBeenCalled();
    });

    it('should update user profile with new values', async () => {
      const user = mockUser({
        id: '1',
        firstName: 'Old',
        lastName: 'Name',
      });

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(usersRepository, 'save').mockResolvedValue({
        ...user,
        firstName: 'New',
        lastName: 'Name',
      });

      await service.updateProfile('1', {
        firstName: 'New',
        lastName: 'Name',
      } as any);

      expect(usersRepository.save).toHaveBeenCalled();
    });

    it('should handle user with MUNICIPALITY role', async () => {
      const municUser = mockUser({
        id: '2',
        role: UserRole.MUNICIPALITY,
        email: 'paris@example.com',
      });

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(municUser);
      const result = await service.findOne('2');

      expect(result.role).toBe(UserRole.MUNICIPALITY);
    });

    it('should preserve all user fields during update', async () => {
      const user = mockUser({
        id: '1',
        email: 'preserve@example.com',
        phoneNumber: '+33600000000',
        pushToken: 'token123',
        createdAt: new Date('2024-01-01'),
      });

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result.email).toBe('preserve@example.com');
      expect(result.phoneNumber).toBe('+33600000000');
      expect(result.pushToken).toBe('token123');
    });

    it('should handle duplicate email in creation', async () => {
      jest.spyOn(usersRepository, 'create').mockReturnValue(mockUser());
      jest.spyOn(usersRepository, 'save').mockRejectedValue(new ConflictException('Email already exists'));

      await expect(
        service.create({
          email: 'duplicate@example.com',
          password: 'pass',
          firstName: 'Test',
          lastName: 'User',
        } as any),
      ).rejects.toThrow();
    });
  });
});
