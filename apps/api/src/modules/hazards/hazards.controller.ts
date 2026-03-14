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
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ServiceUnavailableException,
  StreamableFile,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { HazardsService } from './hazards.service';
import { CreateHazardDto } from './dto/create-hazard.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateHazardDto } from './dto/update-hazard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { ImageModerationService } from '../image-moderation/image-moderation.service';

@Controller('hazards')
export class HazardsController {
  constructor(
    private readonly hazardsService: HazardsService,
    private readonly storageService: StorageService,
    private readonly imageModerationService: ImageModerationService,
  ) {}

  /**
   * Create an incident with a photo. Photo is uploaded to S3, then the hazard is stored
   * with createdAt/updatedAt set by the database.
   */
  @UseGuards(JwtAuthGuard)
  @Post('incident')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
          return callback(null, true);
        }
        return callback(
          new BadRequestException('Only image uploads are allowed'),
          false,
        );
      },
    }),
  )
  async createIncident(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateIncidentDto,
    @Request() req: any,
  ) {
    const fileWithBuffer = file as Express.Multer.File & { buffer: Buffer };
    if (!fileWithBuffer?.buffer) {
      throw new BadRequestException('Photo is required');
    }

    const moderation = await this.imageModerationService.checkImage(
      fileWithBuffer.buffer,
      file.mimetype || 'image/jpeg',
    );
    if (!moderation.allowed) {
      throw new BadRequestException(
        moderation.message ?? "Cette image n'est pas autorisée.",
      );
    }

    const relevance = await this.imageModerationService.checkRelevance(
      fileWithBuffer.buffer,
      file.mimetype || 'image/jpeg',
      dto.type,
      dto.description,
    );
    if (!relevance.relevant) {
      throw new BadRequestException(
        relevance.message ?? "L'image ne correspond pas au signalement.",
      );
    }

    const mimeSubtype = (file.mimetype || 'image/jpeg').split('/')[1] || 'jpeg';
    const safeExtension = mimeSubtype.replace(/[^a-z0-9]+/gi, '').toLowerCase() || 'jpg';
    const key = `incidents/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExtension}`;
    let imageUrl: string;
    try {
      imageUrl = await this.storageService.upload(
        fileWithBuffer.buffer,
        key,
        file.mimetype || 'image/jpeg',
      );
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code ?? (err as { code?: string })?.code;
      if (code === 'ECONNREFUSED' || (err as Error)?.message?.includes('ECONNREFUSED')) {
        throw new ServiceUnavailableException(
          'Image storage (MinIO) is not available. Start it with: docker compose -f docker/docker-compose.yml up -d minio',
        );
      }
      throw err;
    }
    const { photo: _photo, ...hazardData } = dto;
    return this.hazardsService.create(
      { ...hazardData, imageUrl },
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createHazardDto: CreateHazardDto, @Request() req: any) {
    return this.hazardsService.create(createHazardDto, req.user.userId);
  }


  @Get()
  findAll() {
    return this.hazardsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.hazardsService.findActive();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') latitude: number,
    @Query('lon') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.hazardsService.findNearby(+latitude, +longitude, radius ? +radius : 10);
  }

  @Get('types')
  getTypes() {
    return this.hazardsService.getTypes();
  }

  @Get('image/:id')
  async getImage(@Param('id') hazardId: string, @Res() res: Response) {
    try {
      console.log(`[getImage] Fetching image for hazard: ${hazardId}`);
      // Get the raw hazard with the image key (without client formatting)
      const hazard = await this.hazardsService.findOneRaw(hazardId);
      if (!hazard || !hazard.imageUrl) {
        console.log(`[getImage] Hazard not found or no imageUrl: ${hazardId}`);
        throw new NotFoundException('Image not found');
      }

      console.log(`[getImage] Fetching from storage key: ${hazard.imageUrl}`);
      const buffer = await this.storageService.getImage(hazard.imageUrl);
      console.log(`[getImage] Successfully retrieved image, size: ${buffer.length} bytes`);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      });
      res.send(buffer);
    } catch (error) {
      console.error(`[getImage] Error fetching image:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ServiceUnavailableException('Could not retrieve image');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hazardsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHazardDto: UpdateHazardDto, @Request() req: any) {
    return this.hazardsService.update(id, updateHazardDto, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MUNICIPALITY, UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateHazardDto: UpdateHazardDto, @Request() req: any) {
    return this.hazardsService.updateStatus(id, updateHazardDto.status, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.hazardsService.remove(id, req.user.userId, req.user.role);
  }
}
