import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  password: 'hashed',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '',
  pushToken: '',
  role: UserRole.CITIZEN,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            updateProfile: jest.fn(),
            changePassword: jest.fn(),
            updatePushToken: jest.fn(),
            remove: jest.fn(),
            deleteUserDataByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      jest.spyOn(service, 'create').mockResolvedValue(mockUser);

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: '2' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateDto = { firstName: 'Updated' };
      const updatedUser = { ...mockUser, ...updateDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateDto as any, { userId: '1' });

      expect(result.firstName).toBe('Updated');
      expect(service.update).toHaveBeenCalledWith('1', updateDto, '1');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { firstName: 'Updated', phoneNumber: '123456789' };
      const updatedUser = { ...mockUser, ...updateDto };
      jest.spyOn(service, 'updateProfile').mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(updateDto as any, { user: { userId: '1' } });

      expect(result.firstName).toBe('Updated');
      expect(service.updateProfile).toHaveBeenCalledWith('1', updateDto);
    });

    it('should throw ConflictException if email already taken', async () => {
      const updateDto = { email: 'taken@example.com' };
      jest.spyOn(service, 'updateProfile').mockRejectedValue(new ConflictException());

      await expect(controller.updateProfile(updateDto as any, { user: { userId: '1' } })).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const changePasswordDto = {
        oldPassword: 'oldpass',
        newPassword: 'newpass',
      };
      jest.spyOn(service, 'changePassword').mockResolvedValue(undefined);

      await expect(controller.changePassword(changePasswordDto as any, { user: { userId: '1' } })).resolves.toBeUndefined();
      expect(service.changePassword).toHaveBeenCalledWith('1', changePasswordDto);
    });

    it('should throw UnauthorizedException when old password is wrong', async () => {
      const changePasswordDto = {
        oldPassword: 'wrongpass',
        newPassword: 'newpass',
      };
      jest.spyOn(service, 'changePassword').mockRejectedValue(new UnauthorizedException());

      await expect(controller.changePassword(changePasswordDto as any, { user: { userId: '1' } })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registerPushToken', () => {
    it('should register push token for user', async () => {
      const pushToken = 'fb_token_123';
      const updatedUser = { ...mockUser, pushToken };
      jest.spyOn(service, 'updatePushToken').mockResolvedValue(updatedUser);

      const result = await controller.registerPushToken(pushToken, { user: { userId: '1' } });

      expect(result.pushToken).toBe(pushToken);
      expect(service.updatePushToken).toHaveBeenCalledWith('1', pushToken);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue({ message: 'Account deleted' } as any);

      const result = await controller.deleteAccount({ user: { userId: '1' } });

      expect(service.remove).toHaveBeenCalledWith('1', '1');
    });
  });

  describe('deleteData', () => {
    it('should delete user data by email', async () => {
      const deleteDataDto = {
        email: 'test@example.com',
        code: '123456',
      };
      jest.spyOn(service, 'deleteUserDataByEmail').mockResolvedValue({ message: 'Data deleted' } as any);

      const result = await controller.deleteData(deleteDataDto as any);

      expect(service.deleteUserDataByEmail).toHaveBeenCalledWith(deleteDataDto);
    });
  });

  describe('remove', () => {
    it('should remove user by id', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue({ message: 'User removed' } as any);

      const result = await controller.remove('1', { userId: '1' });

      expect(service.remove).toHaveBeenCalledWith('1', '1');
    });
  });

  describe('edge cases and comprehensive scenarios', () => {
    it('should handle user creation with all optional fields', async () => {
      const createDto = {
        email: 'complete@example.com',
        password: 'pass123',
        firstName: 'Complete',
        lastName: 'User',
        phoneNumber: '+33600000000',
        role: UserRole.MUNICIPALITY,
      };
      const createdUser = { ...mockUser, ...createDto, id: '2' };
      jest.spyOn(service, 'create').mockResolvedValue(createdUser);

      const result = await controller.create(createDto as any);

      expect(result.phoneNumber).toBe('+33600000000');
      expect(result.role).toBe(UserRole.MUNICIPALITY);
    });

    it('should handle inactive users', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(service, 'findOne').mockResolvedValue(inactiveUser);

      const result = await controller.findOne('1');

      expect(result.isActive).toBe(false);
    });

    it('should handle user updates with multiple fields', async () => {
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+33700000000',
      };
      const updated = { ...mockUser, ...updateDto };
      jest.spyOn(service, 'update').mockResolvedValue(updated);

      const result = await controller.update('1', updateDto as any, { userId: '1' });

      expect(result.firstName).toBe('Updated');
      expect(result.phoneNumber).toBe('+33700000000');
    });

    it('should preserve user id during update', async () => {
      const updateDto = { firstName: 'NewName' };
      const updated = { ...mockUser, ...updateDto };
      jest.spyOn(service, 'update').mockResolvedValue(updated);

      const result = await controller.update('1', updateDto as any, { userId: '1' });

      expect(result.id).toBe(mockUser.id);
    });

    it('should handle profile update with email change', async () => {
      const updateDto = { email: 'newemail@example.com' };
      const updated = { ...mockUser, ...updateDto };
      jest.spyOn(service, 'updateProfile').mockResolvedValue(updated);

      const result = await controller.updateProfile(updateDto as any, { user: { userId: '1' } });

      expect(result.email).toBe('newemail@example.com');
    });

    it('should handle push token registration multiple times', async () => {
      const pushToken1 = 'token_first';
      const pushToken2 = 'token_second';
      const user1 = { ...mockUser, pushToken: pushToken1 };
      const user2 = { ...mockUser, pushToken: pushToken2 };

      jest.spyOn(service, 'updatePushToken')
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      const result1 = await controller.registerPushToken(pushToken1, { user: { userId: '1' } });
      const result2 = await controller.registerPushToken(pushToken2, { user: { userId: '1' } });

      expect(result1.pushToken).toBe(pushToken1);
      expect(result2.pushToken).toBe(pushToken2);
    });

    it('should handle empty push token', async () => {
      const emptyToken = '';
      const userWithEmpty = { ...mockUser, pushToken: emptyToken };
      jest.spyOn(service, 'updatePushToken').mockResolvedValue(userWithEmpty);

      const result = await controller.registerPushToken(emptyToken, { user: { userId: '1' } });

      expect(result.pushToken).toBe('');
    });

    it('should reject duplicate email during profile update', async () => {
      const updateDto = { email: 'existing@example.com' };
      jest.spyOn(service, 'updateProfile').mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.updateProfile(updateDto as any, { user: { userId: '1' } })).rejects.toThrow(ConflictException);
    });

    it('should handle password change with validation', async () => {
      const changePasswordDto = { oldPassword: 'oldpass', newPassword: 'newpass' };
      jest.spyOn(service, 'changePassword').mockResolvedValue(undefined);

      await expect(controller.changePassword(changePasswordDto as any, { user: { userId: '1' } })).resolves.toBeUndefined();
    });

    it('should handle password change rejection', async () => {
      const changePasswordDto = { oldPassword: 'wrong', newPassword: 'newpass' };
      jest.spyOn(service, 'changePassword').mockRejectedValue(new UnauthorizedException('Wrong password'));

      await expect(controller.changePassword(changePasswordDto as any, { user: { userId: '1' } })).rejects.toThrow(UnauthorizedException);
    });

    it('should find users with ADMIN role', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN, id: '2' };
      jest.spyOn(service, 'findOne').mockResolvedValue(adminUser);

      const result = await controller.findOne('2');

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should find users with MUNICIPALITY role', async () => {
      const municUser = { ...mockUser, role: UserRole.MUNICIPALITY, id: '3' };
      jest.spyOn(service, 'findOne').mockResolvedValue(municUser);

      const result = await controller.findOne('3');

      expect(result.role).toBe(UserRole.MUNICIPALITY);
    });

    it('should handle deletion with all user data', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue({ message: 'All data deleted' } as any);

      const result = await controller.deleteAccount({ user: { userId: '1' } });

      expect(service.remove).toHaveBeenCalled();
    });

    it('should handle deletion by email', async () => {
      const deleteDto = { email: 'test@example.com', code: '123456' };
      jest.spyOn(service, 'deleteUserDataByEmail').mockResolvedValue({ message: 'User data deleted' } as any);

      const result = await controller.deleteData(deleteDto as any);

      expect(service.deleteUserDataByEmail).toHaveBeenCalledWith(deleteDto);
    });

    it('should return all user fields in list', async () => {
      const users = [
        { ...mockUser, id: '1' },
        { ...mockUser, id: '2', email: 'user2@example.com' },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe(mockUser.email);
      expect(result[1].email).toBe('user2@example.com');
    });

    it('should return user with timestamps', async () => {
      const now = new Date();
      const userWithTimestamps = { ...mockUser, createdAt: now, updatedAt: now };
      jest.spyOn(service, 'findOne').mockResolvedValue(userWithTimestamps);

      const result = await controller.findOne('1');

      expect(result.createdAt).toBe(now);
      expect(result.updatedAt).toBe(now);
    });

    it('should handle user creation with CITIZEN role default', async () => {
      const createDto = {
        email: 'citizen@example.com',
        password: 'pass123',
        firstName: 'Citizen',
        lastName: 'User',
      };
      const citizenUser = { ...mockUser, ...createDto, role: UserRole.CITIZEN };
      jest.spyOn(service, 'create').mockResolvedValue(citizenUser);

      const result = await controller.create(createDto as any);

      expect(result.role).toBe(UserRole.CITIZEN);
    });

    it('should preserve phone number across updates', async () => {
      const updateDto = { firstName: 'Updated' };
      const original = { ...mockUser, phoneNumber: '+33600000000' };
      const updated = { ...original, ...updateDto };
      jest.spyOn(service, 'update').mockResolvedValue(updated);

      const result = await controller.update('1', updateDto as any, { userId: '1' });

      expect(result.phoneNumber).toBe('+33600000000');
      expect(result.firstName).toBe('Updated');
    });

    it('should preserve push token across profile updates', async () => {
      const updateDto = { firstName: 'Updated' };
      const original = { ...mockUser, pushToken: 'preserved_token' };
      const updated = { ...original, ...updateDto };
      jest.spyOn(service, 'updateProfile').mockResolvedValue(updated);

      const result = await controller.updateProfile(updateDto as any, { user: { userId: '1' } });

      expect(result.pushToken).toBe('preserved_token');
    });

    it('should handle concurrent push token updates', async () => {
      const token1 = 'concurrent_1';
      const token2 = 'concurrent_2';
      const user1 = { ...mockUser, pushToken: token1 };
      const user2 = { ...mockUser, pushToken: token2 };

      jest.spyOn(service, 'updatePushToken').mockResolvedValueOnce(user1);
      jest.spyOn(service, 'updatePushToken').mockResolvedValueOnce(user2);

      const result1 = await controller.registerPushToken(token1, { user: { userId: '1' } });
      const result2 = await controller.registerPushToken(token2, { user: { userId: '2' } });

      expect(result1.pushToken).toBe(token1);
      expect(result2.pushToken).toBe(token2);
    });
  });

  describe('error handling', () => {
    it('should handle service errors in create', async () => {
      jest.spyOn(service, 'create').mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create({ email: 'test@example.com', password: 'pass' } as any)).rejects.toThrow();
    });

    it('should handle service errors in update', async () => {
      jest.spyOn(service, 'update').mockRejectedValue(new Error('Update failed'));

      await expect(controller.update('1', {}, { userId: '1' })).rejects.toThrow();
    });

    it('should handle service errors in delete', async () => {
      jest.spyOn(service, 'remove').mockRejectedValue(new Error('Delete failed'));

      await expect(controller.deleteAccount({ user: { userId: '1' } })).rejects.toThrow();
    });

    it('should handle service errors in findAll', async () => {
      jest.spyOn(service, 'findAll').mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow();
    });
  });

  describe('data validation', () => {
    it('should accept various email formats', async () => {
      const emails = [
        'simple@example.com',
        'user+tag@example.co.uk',
        'firstname.lastname@example.com',
      ];

      for (const email of emails) {
        const createDto = {
          email,
          password: 'pass123',
          firstName: 'Test',
          lastName: 'User',
        };
        const user = { ...mockUser, email };
        jest.spyOn(service, 'create').mockResolvedValue(user);

        const result = await controller.create(createDto as any);
        expect(result.email).toBe(email);
      }
    });

    it('should accept various name formats', async () => {
      const names = ['Test', 'Test-Name', "O'Brien", 'José'];

      for (const name of names) {
        const createDto = {
          email: 'test@example.com',
          password: 'pass123',
          firstName: name,
          lastName: 'User',
        };
        const user = { ...mockUser, firstName: name };
        jest.spyOn(service, 'create').mockResolvedValue(user);

        const result = await controller.create(createDto as any);
        expect(result.firstName).toBe(name);
      }
    });
  });
});
