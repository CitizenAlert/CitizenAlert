// Mock expo-server-sdk before importing anything else
jest.mock('expo-server-sdk', () => ({
  Expo: class Expo {
    sendPushNotificationsAsync() {}
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotification = {
    id: '1',
    userId: 'user1',
    type: NotificationType.HAZARD_NEARBY,
    title: 'Test notification',
    message: 'Test message',
    read: false,
    hazardId: 'hazard1',
    data: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      userId: 'user1',
      email: 'user@test.com',
    },
  };

  const mockNotificationsService = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findUnreadByUserId: jest.fn(),
    countUnreadByUserId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    remove: jest.fn(),
    removeAllForUser: jest.fn(),
    broadcastToAllUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /notifications', () => {
    it('should create a notification', async () => {
      const createDto = {
        userId: 'user1',
        type: NotificationType.HAZARD_NEARBY,
        title: 'Alert',
        message: 'Hazard nearby',
      };

      mockNotificationsService.create.mockResolvedValue(mockNotification);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('GET /notifications', () => {
    it('should return all notifications for user', async () => {
      const notifications = [mockNotification];
      mockNotificationsService.findByUserId.mockResolvedValue(notifications);

      const result = await controller.findAll(mockRequest);

      expect(result).toBeDefined();
      expect(service.findByUserId).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('GET /notifications/unread', () => {
    it('should return unread notifications for user', async () => {
      const unreadNotifications = [{ ...mockNotification, read: false }];
      mockNotificationsService.findUnreadByUserId.mockResolvedValue(unreadNotifications);

      const result = await controller.findUnread(mockRequest);

      expect(result).toBeDefined();
      expect(service.findUnreadByUserId).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('GET /notifications/unread/count', () => {
    it('should return count of unread notifications', async () => {
      mockNotificationsService.countUnreadByUserId.mockResolvedValue(5);

      const result = await controller.countUnread(mockRequest);

      expect(result).toBeDefined();
      expect(service.countUnreadByUserId).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('GET /notifications/:id', () => {
    it('should return notification by id', async () => {
      mockNotificationsService.findOne.mockResolvedValue(mockNotification);

      const result = await controller.findOne('1');

      expect(result).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should handle errors when notification not found', async () => {
      mockNotificationsService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('nonexistent')).rejects.toThrow();
    });
  });

  describe('PATCH /notifications/:id', () => {
    it('should update notification', async () => {
      const updateDto = { read: true };
      const updatedNotification = { ...mockNotification, ...updateDto };
      mockNotificationsService.update.mockResolvedValue(updatedNotification);

      const result = await controller.update('1', updateDto);

      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const readNotification = { ...mockNotification, read: true };
      mockNotificationsService.markAsRead.mockResolvedValue(readNotification);

      const result = await controller.markAsRead('1');

      expect(result).toBeDefined();
      expect(result.read).toBe(true);
      expect(service.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  describe('POST /notifications/mark-all-read', () => {
    it('should mark all user notifications as read', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead(mockRequest);

      expect(service.markAllAsRead).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete notification', async () => {
      mockNotificationsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('DELETE /notifications', () => {
    it('should delete all user notifications', async () => {
      mockNotificationsService.removeAllForUser.mockResolvedValue(undefined);

      const result = await controller.removeAll(mockRequest);

      expect(service.removeAllForUser).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('POST /notifications/broadcast', () => {
    it('should broadcast notification to all users', async () => {
      const broadcastDto = {
        title: 'Breaking News',
        message: 'Important alert',
        type: 'hazard_nearby',
      };

      mockNotificationsService.broadcastToAllUsers.mockResolvedValue({ sent: 10 });

      const result = await controller.broadcastNotification(broadcastDto, mockRequest);

      expect(result).toBeDefined();
      expect(service.broadcastToAllUsers).toHaveBeenCalledWith(
        broadcastDto.title,
        broadcastDto.message,
        broadcastDto.type,
      );
    });

    it('should use default type when not provided', async () => {
      const broadcastDto = {
        title: 'News',
        message: 'Alert',
      };

      mockNotificationsService.broadcastToAllUsers.mockResolvedValue({ sent: 5 });

      await controller.broadcastNotification(broadcastDto, mockRequest);

      expect(service.broadcastToAllUsers).toHaveBeenCalledWith(
        broadcastDto.title,
        broadcastDto.message,
        'hazard_nearby',
      );
    });
  });
});
