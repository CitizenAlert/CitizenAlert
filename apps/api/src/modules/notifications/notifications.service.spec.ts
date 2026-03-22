// Mock expo-server-sdk before importing anything else
jest.mock('expo-server-sdk', () => ({
  Expo: class Expo {
    sendPushNotificationsAsync() {}
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { PushNotificationService } from './push-notification.service';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepository: Repository<Notification>;
  let usersRepository: Repository<User>;
  let pushNotificationService: PushNotificationService;
  let notificationsGateway: NotificationsGateway;

  const mockNotification = {
    id: '1',
    userId: 'user1',
    type: NotificationType.HAZARD_NEARBY,
    title: 'Hazard nearby',
    message: 'A hazard has been reported near you',
    read: false,
    hazardId: 'hazard1',
    data: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNotificationsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockUsersRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPushNotificationService = {
    sendPushNotification: jest.fn(),
  };

  const mockNotificationsGateway = {
    broadcastToCity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: PushNotificationService,
          useValue: mockPushNotificationService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationsRepository = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    pushNotificationService = module.get<PushNotificationService>(PushNotificationService);
    notificationsGateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const createDto = {
        userId: 'user1',
        type: NotificationType.HAZARD_NEARBY,
        title: 'Hazard nearby',
        message: 'A hazard has been reported',
      };

      mockNotificationsRepository.create.mockReturnValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue(mockNotification);
      mockUsersRepository.findOne.mockResolvedValue({ id: 'user1', pushToken: 'token123' });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(notificationsRepository.save).toHaveBeenCalled();
    });

    it('should send push notification if user has token', async () => {
      const createDto = {
        userId: 'user1',
        type: NotificationType.HAZARD_NEARBY,
        title: 'Alert',
        message: 'Hazard nearby',
      };

      mockNotificationsRepository.create.mockReturnValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue(mockNotification);
      mockUsersRepository.findOne.mockResolvedValue({ id: 'user1', pushToken: 'token123' });

      await service.create(createDto);

      expect(pushNotificationService.sendPushNotification).toHaveBeenCalled();
    });

    it('should handle push notification errors gracefully', async () => {
      const createDto = {
        userId: 'user1',
        type: NotificationType.HAZARD_NEARBY,
        title: 'Alert',
        message: 'Hazard nearby',
      };

      mockNotificationsRepository.create.mockReturnValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue(mockNotification);
      mockUsersRepository.findOne.mockResolvedValue({ id: 'user1', pushToken: 'token123' });
      mockPushNotificationService.sendPushNotification.mockRejectedValue(new Error('Push failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should skip push notification if user has no token', async () => {
      const createDto = {
        userId: 'user1',
        type: NotificationType.HAZARD_NEARBY,
        title: 'Alert',
        message: 'Hazard nearby',
      };

      mockNotificationsRepository.create.mockReturnValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue(mockNotification);
      mockUsersRepository.findOne.mockResolvedValue({ id: 'user1', pushToken: null });

      await service.create(createDto);

      expect(pushNotificationService.sendPushNotification).not.toHaveBeenCalled();
    });
  });

  describe('createForHazardCreation', () => {
    it('should create hazard creation notification', async () => {
      mockNotificationsRepository.create.mockReturnValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue(mockNotification);
      mockUsersRepository.findOne.mockResolvedValue({ id: 'user1', pushToken: null });

      const result = await service.createForHazardCreation(
        'hazard1',
        'Inondation',
        'user1',
        'John Doe',
      );

      expect(result).toBeDefined();
      expect(notificationsRepository.save).toHaveBeenCalled();
    });
  });

  describe('createForStatusChange', () => {
    it('should create status change notification', async () => {
      mockNotificationsRepository.create.mockReturnValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue(mockNotification);
      mockUsersRepository.findOne.mockResolvedValue({ id: 'user1', pushToken: null });

      const result = await service.createForStatusChange(
        'hazard1',
        'Inondation',
        'user1',
        'active',
        'resolved',
      );

      expect(result).toBeDefined();
      expect(notificationsRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all notifications', async () => {
      const notifications = [mockNotification];
      mockNotificationsRepository.find.mockResolvedValue(notifications);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('findByUserId', () => {
    it('should return notifications for user', async () => {
      const notifications = [mockNotification];
      mockNotificationsRepository.find.mockResolvedValue(notifications);

      const result = await service.findByUserId('user1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when user has no notifications', async () => {
      mockNotificationsRepository.find.mockResolvedValue([]);

      const result = await service.findByUserId('user-no-notifications');

      expect(result).toEqual([]);
    });
  });

  describe('findUnreadByUserId', () => {
    it('should return unread notifications for user', async () => {
      const unreadNotification = { ...mockNotification, read: false };
      mockNotificationsRepository.find.mockResolvedValue([unreadNotification]);

      const result = await service.findUnreadByUserId('user1');

      expect(result).toHaveLength(1);
    });
  });

  describe('countUnreadByUserId', () => {
    it('should count unread notifications', async () => {
      mockNotificationsRepository.count.mockResolvedValue(3);

      const result = await service.countUnreadByUserId('user1');

      expect(result).toBe(3);
    });

    it('should return 0 when no unread notifications', async () => {
      mockNotificationsRepository.count.mockResolvedValue(0);

      const result = await service.countUnreadByUserId('user1');

      expect(result).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return notification by id', async () => {
      mockNotificationsRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update notification', async () => {
      const updateDto = { read: true };
      mockNotificationsRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue({ ...mockNotification, ...updateDto });

      const result = await service.update('1', updateDto);

      expect(result).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockNotificationsRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue({ ...mockNotification, read: true });

      const result = await service.markAsRead('1');

      expect(result).toBeDefined();
      expect(result.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      mockNotificationsRepository.update.mockResolvedValue({ affected: 5 });

      await service.markAllAsRead('user1');

      expect(notificationsRepository.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete notification', async () => {
      mockNotificationsRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationsRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('1')).resolves.toBeUndefined();
      expect(notificationsRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockNotificationsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAllForUser', () => {
    it('should delete all user notifications', async () => {
      mockNotificationsRepository.delete.mockResolvedValue({ affected: 10 });

      await service.removeAllForUser('user1');

      expect(notificationsRepository.delete).toHaveBeenCalledWith({ userId: 'user1' });
    });
  });

  describe('broadcastToAllUsers', () => {
    it('should broadcast notification to users', async () => {
      const users = [
        { id: 'user1', pushToken: 'token1' },
        { id: 'user2', pushToken: 'token2' },
      ];
      mockUsersRepository.find.mockResolvedValue(users);
      mockNotificationsRepository.create.mockReturnValue(mockNotification);
      mockNotificationsRepository.save.mockResolvedValue(mockNotification);

      const result = await service.broadcastToAllUsers('Breaking News', 'Important alert');

      expect(result).toBeDefined();
      expect(notificationsRepository.create).toHaveBeenCalled();
    });

    it('should handle broadcast errors gracefully', async () => {
      mockUsersRepository.find.mockResolvedValue([{ id: 'user1', pushToken: 'token1' }]);
      mockNotificationsRepository.create.mockReturnValue(mockNotification);
      mockNotificationsRepository.save.mockRejectedValue(new Error('Save failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.broadcastToAllUsers('News', 'Alert');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('broadcastHazardToCity', () => {
    it('should broadcast hazard to city WebSocket room', () => {
      service.broadcastHazardToCity('hazard1', 'INONDATION', 'Paris', 48.8566, 2.3522, 'Water');

      expect(notificationsGateway.broadcastToCity).toHaveBeenCalledWith(
        'Paris',
        expect.any(Object),
      );
    });
  });
});
