import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushNotificationService } from './push-notification.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { GeolocationModule } from '../geolocation/geolocation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    GeolocationModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushNotificationService, NotificationsGateway],
  exports: [NotificationsService, PushNotificationService, NotificationsGateway],
})
export class NotificationsModule {}
