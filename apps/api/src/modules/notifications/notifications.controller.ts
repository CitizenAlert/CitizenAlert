import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(@Request() req: any) {
    // Return all notifications for the current user
    return this.notificationsService.findByUserId(req.user.userId);
  }

  @Get('unread')
  findUnread(@Request() req: any) {
    return this.notificationsService.findUnreadByUserId(req.user.userId);
  }

  @Get('unread/count')
  countUnread(@Request() req: any) {
    return this.notificationsService.countUnreadByUserId(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('mark-all-read')
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Delete()
  removeAll(@Request() req: any) {
    return this.notificationsService.removeAllForUser(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('broadcast')
  async broadcastNotification(
    @Body() body: { title: string; message: string; type?: string },
    @Request() req: any,
  ) {
    console.log('📢 Broadcast notification request from:', req.user.email);
    console.log('📢 Payload:', body);
    
    const result = await this.notificationsService.broadcastToAllUsers(
      body.title,
      body.message,
      body.type || 'hazard_nearby',
    );
    
    console.log('📢 Broadcast result:', result);
    return result;
  }
}
