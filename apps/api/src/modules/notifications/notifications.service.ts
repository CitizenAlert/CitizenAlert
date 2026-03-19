import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PushNotificationService } from './push-notification.service';
import { NotificationsGateway } from './notifications.gateway';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private pushNotificationService: PushNotificationService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(createNotificationDto);
    const savedNotification = await this.notificationsRepository.save(notification);

    // Send push notification if user has a push token
    try {
      const user = await this.usersRepository.findOne({
        where: { id: createNotificationDto.userId },
      });

      if (user?.pushToken) {
        await this.pushNotificationService.sendPushNotification(
          user.pushToken,
          createNotificationDto.title,
          createNotificationDto.message,
          {
            notificationId: savedNotification.id,
            hazardId: createNotificationDto.hazardId,
            type: createNotificationDto.type,
            ...createNotificationDto.data,
          },
        );
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }

    return savedNotification;
  }

  async createForHazardCreation(
    hazardId: string,
    hazardType: string,
    creatorId: string,
    creatorName: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.HAZARD_CREATED,
      title: 'Nouveau signalement créé',
      message: `Votre signalement "${hazardType}" a été créé avec succès.`,
      userId: creatorId,
      hazardId,
      data: {
        hazardType,
        creatorName,
      },
    });
  }

  async createForStatusChange(
    hazardId: string,
    hazardType: string,
    userId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<Notification> {
    const statusLabels: Record<string, string> = {
      active: 'Actif',
      resolved: 'Résolu',
      archived: 'Archivé',
    };

    return this.create({
      type: NotificationType.HAZARD_STATUS_CHANGED,
      title: 'Changement de statut',
      message: `Le statut de votre signalement "${hazardType}" est passé de "${statusLabels[oldStatus] || oldStatus}" à "${statusLabels[newStatus] || newStatus}".`,
      userId,
      hazardId,
      data: {
        hazardType,
        oldStatus,
        newStatus,
      },
    });
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      relations: ['user', 'hazard'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      relations: ['hazard'],
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId, read: false },
      relations: ['hazard'],
      order: { createdAt: 'DESC' },
    });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, read: false },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: ['user', 'hazard'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }

    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return this.notificationsRepository.save(notification);
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, read: false },
      { read: true },
    );
  }

  async remove(id: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationsRepository.remove(notification);
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.notificationsRepository.delete({ userId });
  }

  async broadcastToAllUsers(
    title: string,
    message: string,
    type: string = 'hazard_nearby',
  ): Promise<{ sent: number; failed: number }> {
    // Get all users
    const users = await this.usersRepository.find({
      select: ['id', 'pushToken'],
    });

    let sent = 0;
    let failed = 0;

    // Create notifications for all users
    const notificationPromises = users.map(async (user) => {
      try {
        // Create notification directly without using create() to avoid DTO validation
        const notification = this.notificationsRepository.create({
          userId: user.id,
          type: type as NotificationType,
          title,
          message,
          data: { broadcast: true },
        });
        const savedNotification = await this.notificationsRepository.save(notification);

        // Send push notification if user has a push token
        if (user.pushToken) {
          try {
            await this.pushNotificationService.sendPushNotification(
              user.pushToken,
              title,
              message,
              {
                notificationId: savedNotification.id,
                type: savedNotification.type,
                broadcast: true,
              },
            );
          } catch (pushError) {
            console.error(`Failed to send push to user ${user.id}:`, pushError);
          }
        }

        sent++;
      } catch (error) {
        console.error(`Failed to create notification for user ${user.id}:`, error);
        failed++;
      }
    });

    await Promise.allSettled(notificationPromises);

    return { sent, failed };
  }

  /**
   * Broadcast a hazard creation to a city's WebSocket room
   * All users subscribed to that city will receive the notification in real-time
   */
  broadcastHazardToCity(
    hazardId: string,
    hazardType: string,
    city: string,
    latitude: number,
    longitude: number,
    description: string,
  ): void {
    try {
      this.notificationsGateway.broadcastToCity(city, {
        hazardId,
        type: hazardType,
        description,
        city,
        location: {
          latitude,
          longitude,
        },
      });
    } catch (error) {
      console.error(`Failed to broadcast hazard to city ${city}:`, error);
    }
  }
}
