import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateHazardDto } from './create-hazard.dto';
import { HazardStatus } from '../entities/hazard.entity';

export class UpdateHazardDto extends PartialType(CreateHazardDto) {
  @IsOptional()
  @IsEnum(HazardStatus)
  status?: HazardStatus;
}
