import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hazard, HazardStatus, HazardType } from './entities/hazard.entity';
import { CreateHazardDto } from './dto/create-hazard.dto';
import { UpdateHazardDto } from './dto/update-hazard.dto';
import { UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

const VALID_TYPE_IDS = Object.values(HazardType) as string[];

@Injectable()
export class HazardsService implements OnModuleInit {
  constructor(
    @InjectRepository(Hazard)
    private hazardsRepository: Repository<Hazard>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Transform imageUrl from storage key to API endpoint URL for client consumption.
   * If imageUrl is a key (contains image filename), converts to /api/hazards/image/{hazardId}
   */
  private formatHazardForClient(hazard: Hazard, hazardId?: string): Hazard {
    if (hazard.imageUrl) {
      const id = hazardId || hazard.id;
      hazard.imageUrl = `/hazards/image/${id}`;
    }
    return hazard;
  }

  async onModuleInit() {
    const invalidCount = await this.hazardsRepository
      .createQueryBuilder('hazard')
      .where('hazard.type NOT IN (:...validTypes)', { validTypes: VALID_TYPE_IDS })
      .getCount();

    if (invalidCount === 0) return;

    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
      const result = await this.hazardsRepository
        .createQueryBuilder()
        .delete()
        .from(Hazard)
        .where('type NOT IN (:...validTypes)', { validTypes: VALID_TYPE_IDS })
        .execute();
      const deleted = result.affected ?? 0;
      if (deleted > 0) {
        console.log(`[Hazards] Removed ${deleted} incident(s) with obsolete type at startup in development environment.`);
      }
    } else {
      console.warn(`[Hazards] Detected ${invalidCount} incident(s) with obsolete type at startup in '${env}' environment. No automatic deletion was performed.`);
    }
  }

  async create(createHazardDto: CreateHazardDto, userId: string): Promise<Hazard> {
    const hazard = this.hazardsRepository.create({
      ...createHazardDto,
      userId,
    });

    const savedHazard = await this.hazardsRepository.save(hazard);

    // Create notification for hazard creation
    try {
      const hazardType = HazardsService.INCIDENT_TYPES.find(t => t.id === savedHazard.type);
      await this.notificationsService.createForHazardCreation(
        savedHazard.id,
        hazardType?.label || savedHazard.type,
        userId,
        'User', // We don't have user name here, could be improved
      );
    } catch (error) {
      console.error('Failed to create notification for hazard creation:', error);
    }

    return this.formatHazardForClient(savedHazard);
  }

  async findAll(): Promise<Hazard[]> {
    const hazards = await this.hazardsRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return hazards.map(h => this.formatHazardForClient(h));
  }

  async findActive(): Promise<Hazard[]> {
    const hazards = await this.hazardsRepository.find({
      where: { status: HazardStatus.ACTIVE },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return hazards.map(h => this.formatHazardForClient(h));
  }

  async findByUserId(userId: string): Promise<Hazard[]> {
    const hazards = await this.hazardsRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return hazards.map(h => this.formatHazardForClient(h));
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<Hazard[]> {
    // Simple bounding box query for POC
    // For production, use PostGIS or more sophisticated geospatial queries
    const latDelta = radiusKm / 111; // 1 degree lat ~ 111km
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const hazards = await this.hazardsRepository
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
    
    return hazards.map(h => this.formatHazardForClient(h));
  }

  async findOne(id: string): Promise<Hazard> {
    const hazard = await this.hazardsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!hazard) {
      throw new NotFoundException(`Hazard with ID ${id} not found`);
    }

    return this.formatHazardForClient(hazard, id);
  }

  /**
   * Find one hazard without client formatting (returns raw S3 key in imageUrl).
   * Used internally for operations like image retrieval.
   */
  async findOneRaw(id: string): Promise<Hazard> {
    const hazard = await this.hazardsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!hazard) {
      throw new NotFoundException(`Hazard with ID ${id} not found`);
    }

    return hazard;
  }

  async update(id: string, updateHazardDto: UpdateHazardDto, userId: string, userRole?: UserRole): Promise<Hazard> {
    const hazard = await this.findOne(id);

    // Municipality and Admin can update any hazard, citizens can only update their own
    const canUpdate = 
      userRole === UserRole.MUNICIPALITY || 
      userRole === UserRole.ADMIN || 
      hazard.userId === userId;

    if (!canUpdate) {
      throw new ForbiddenException('You can only update your own hazards');
    }

    // Only municipality/admin can change status through regular update
    // Status changes should use updateStatus endpoint
    if (updateHazardDto.status && userRole !== UserRole.MUNICIPALITY && userRole !== UserRole.ADMIN) {
      delete updateHazardDto.status;
    }

    Object.assign(hazard, updateHazardDto);
    return this.hazardsRepository.save(hazard);
  }

  async updateStatus(id: string, status: HazardStatus | undefined, userId: string): Promise<Hazard> {
    const hazard = await this.findOne(id);

    if (!status) {
      throw new BadRequestException('Status is required');
    }

    const oldStatus = hazard.status;
    hazard.status = status;
    const updatedHazard = await this.hazardsRepository.save(hazard);

    // Create notification for status change
    if (oldStatus !== status && hazard.userId) {
      try {
        const hazardType = HazardsService.INCIDENT_TYPES.find(t => t.id === hazard.type);
        await this.notificationsService.createForStatusChange(
          hazard.id,
          hazardType?.label || hazard.type,
          hazard.userId,
          oldStatus,
          status,
        );
      } catch (error) {
        console.error('Failed to create notification for status change:', error);
      }
    }

    return updatedHazard;
  }

  async remove(id: string, userId: string, userRole?: UserRole): Promise<void> {
    const hazard = await this.findOne(id);

    // Municipality and Admin can delete any hazard, citizens can only delete their own
    const canDelete = 
      userRole === UserRole.MUNICIPALITY || 
      userRole === UserRole.ADMIN || 
      hazard.userId === userId;

    if (!canDelete) {
      throw new ForbiddenException('You can only delete your own hazards');
    }

    await this.hazardsRepository.remove(hazard);
  }

  private static readonly INCIDENT_TYPES: Array<{
    id: HazardType;
    label: string;
    icon: string;
    iconColor: string;
  }> = [
    { id: HazardType.INONDATION, label: 'Inondation', icon: 'weather-pouring', iconColor: '#0ea5e9' },
    { id: HazardType.FUITE_EAU, label: 'Fuite d\'eau', icon: 'water', iconColor: '#0284c7' },
    { id: HazardType.ARBRE_TOMBE, label: 'Arbre tombé', icon: 'tree', iconColor: '#15803d' },
    { id: HazardType.DEPOT_SAUVAGE, label: 'Dépôt sauvage', icon: 'trash-can', iconColor: '#78716c' },
    { id: HazardType.NID_DE_POULE, label: 'Nid de poule', icon: 'road-variant', iconColor: '#b45309' },
    { id: HazardType.ECLAIRAGE_PUBLIC_DEFECTUEUX, label: 'Éclairage public défectueux', icon: 'lightbulb-off', iconColor: '#eab308' },
    { id: HazardType.FEU_TRICOLORE_PANNE, label: 'Feu tricolore en panne', icon: 'traffic-light-outline', iconColor: '#dc2626' },
    { id: HazardType.TROTTOIR_VOIRIE_DEGRADE, label: 'Trottoir / voirie dégradé', icon: 'walk', iconColor: '#64748b' },
    { id: HazardType.MOBILIER_URBAIN_DETERIORE, label: 'Mobilier urbain détérioré', icon: 'bench', iconColor: '#a16207' },
    { id: HazardType.NUISIBLES_INSALUBRITE, label: 'Nuisibles / insalubrité', icon: 'bug', iconColor: '#713f12' },
  ];

  getTypes(): Array<{ id: string; name: string; iconShape: string; iconColor: string }> {
    return HazardsService.INCIDENT_TYPES.map((t) => ({
      id: t.id,
      name: t.label,
      iconShape: t.icon,
      iconColor: t.iconColor,
    }));
  }
}
