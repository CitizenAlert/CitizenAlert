import { IsEnum, IsString, IsOptional, IsObject, IsUUID } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  hazardId?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
