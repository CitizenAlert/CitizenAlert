import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { HazardType } from '../entities/hazard.entity';

/**
 * DTO for POST /hazards/incident (multipart).
 * Same as CreateHazardDto but allows the "photo" field from the form (the actual file
 * is in @UploadedFile(); this avoids ValidationPipe "property photo should not exist").
 */
export class CreateIncidentDto {
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

  /** Present in multipart body; ignored (file is from @UploadedFile()). */
  @IsOptional()
  photo?: unknown;
}
