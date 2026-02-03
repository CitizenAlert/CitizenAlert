import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HazardsService } from './hazards.service';
import { HazardsController } from './hazards.controller';
import { Hazard } from './entities/hazard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hazard])],
  controllers: [HazardsController],
  providers: [HazardsService],
})
export class HazardsModule {}
