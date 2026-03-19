import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HazardsService } from './hazards.service';
import { HazardsController } from './hazards.controller';
import { Hazard } from './entities/hazard.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ImageModerationModule } from '../image-moderation/image-moderation.module';
import { GeolocationModule } from '../geolocation/geolocation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hazard]),
    NotificationsModule,
    ImageModerationModule,
    GeolocationModule,
  ],
  controllers: [HazardsController],
  providers: [HazardsService],
})
export class HazardsModule {}
