import { IsString, IsNumber, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { HazardType } from '../entities/hazard.entity';

export class CreateHazardDto {
  @IsEnum(HazardType)
  type: HazardType;

  @IsString()
  description: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
