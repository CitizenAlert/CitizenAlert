import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HazardsService } from './hazards.service';
import { HazardsController } from './hazards.controller';
import { Hazard } from './entities/hazard.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hazard]),
    NotificationsModule,
  ],
  controllers: [HazardsController],
  providers: [HazardsService],
})
export class HazardsModule {}
