import { IsString, IsNumber, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { HazardType } from '../entities/hazard.entity';

export class CreateHazardDto {
  @IsEnum(HazardType)
  type: HazardType;

  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
