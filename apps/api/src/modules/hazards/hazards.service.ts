import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hazard, HazardStatus, HazardType } from './entities/hazard.entity';
import { CreateHazardDto } from './dto/create-hazard.dto';
import { UpdateHazardDto } from './dto/update-hazard.dto';

@Injectable()
export class HazardsService {
  constructor(
    @InjectRepository(Hazard)
    private hazardsRepository: Repository<Hazard>,
  ) {}

  async create(createHazardDto: CreateHazardDto, userId: string): Promise<Hazard> {
    const hazard = this.hazardsRepository.create({
      ...createHazardDto,
      userId,
    });

    return this.hazardsRepository.save(hazard);
  }

  async findAll(): Promise<Hazard[]> {
    return this.hazardsRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Hazard[]> {
    return this.hazardsRepository.find({
      where: { status: HazardStatus.ACTIVE },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<Hazard[]> {
    // Simple bounding box query for POC
    // For production, use PostGIS or more sophisticated geospatial queries
    const latDelta = radiusKm / 111; // 1 degree lat ~ 111km
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    return this.hazardsRepository
      .createQueryBuilder('hazard')
      .where('hazard.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latDelta,
        maxLat: latitude + latDelta,
      })
      .andWhere('hazard.longitude BETWEEN :minLon AND :maxLon', {
        minLon: longitude - lonDelta,
        maxLon: longitude + lonDelta,
      })
      .andWhere('hazard.status = :status', { status: HazardStatus.ACTIVE })
      .leftJoinAndSelect('hazard.user', 'user')
      .orderBy('hazard.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Hazard> {
    const hazard = await this.hazardsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!hazard) {
      throw new NotFoundException(`Hazard with ID ${id} not found`);
    }

    return hazard;
  }

  async update(id: string, updateHazardDto: UpdateHazardDto, userId: string): Promise<Hazard> {
    const hazard = await this.findOne(id);

    if (hazard.userId !== userId) {
      throw new ForbiddenException('You can only update your own hazards');
    }

    Object.assign(hazard, updateHazardDto);
    return this.hazardsRepository.save(hazard);
  }

  async remove(id: string, userId: string): Promise<void> {
    const hazard = await this.findOne(id);

    if (hazard.userId !== userId) {
      throw new ForbiddenException('You can only delete your own hazards');
    }

    await this.hazardsRepository.remove(hazard);
  }

  getTypes(): Array<{ id: string; name: string; iconShape: string; iconColor: string }> {
    return Object.values(HazardType).map((type) => ({
      id: type,
      name: this.getTypeDisplayName(type),
      iconShape: this.getTypeIconShape(type),
      iconColor: this.getTypeIconColor(type),
    }));
  }

  private getTypeDisplayName(type: HazardType): string {
    const displayNames: Record<HazardType, string> = {
      [HazardType.ACCIDENT]: 'Accident',
      [HazardType.ROAD_ISSUE]: 'Road Issue',
      [HazardType.WARNING]: 'Warning',
      [HazardType.POLICE]: 'Police',
      [HazardType.OTHER]: 'Other',
    };
    return displayNames[type] || type;
  }

  /** Icon shape key for the client (e.g. Ionicons name or shape identifier). */
  private getTypeIconShape(type: HazardType): string {
    const shapes: Record<HazardType, string> = {
      [HazardType.ACCIDENT]: 'car-sport',
      [HazardType.ROAD_ISSUE]: 'construct',
      [HazardType.WARNING]: 'warning',
      [HazardType.POLICE]: 'shield-checkmark',
      [HazardType.OTHER]: 'ellipse',
    };
    return shapes[type] || 'ellipse';
  }

  /** Hex color for the icon/marker. */
  private getTypeIconColor(type: HazardType): string {
    const colors: Record<HazardType, string> = {
      [HazardType.ACCIDENT]: '#e74c3c',
      [HazardType.ROAD_ISSUE]: '#f39c12',
      [HazardType.WARNING]: '#e67e22',
      [HazardType.POLICE]: '#3498db',
      [HazardType.OTHER]: '#95a5a6',
    };
    return colors[type] || '#95a5a6';
  }
}
