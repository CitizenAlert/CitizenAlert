import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hazard, HazardStatus, HazardType } from './entities/hazard.entity';
import { CreateHazardDto } from './dto/create-hazard.dto';
import { UpdateHazardDto } from './dto/update-hazard.dto';

const VALID_TYPE_IDS = Object.values(HazardType) as string[];

@Injectable()
export class HazardsService implements OnModuleInit {
  constructor(
    @InjectRepository(Hazard)
    private hazardsRepository: Repository<Hazard>,
  ) {}

  async onModuleInit() {
    const result = await this.hazardsRepository
      .createQueryBuilder()
      .delete()
      .from(Hazard)
      .where('type NOT IN (:...validTypes)', { validTypes: VALID_TYPE_IDS })
      .execute();
    const deleted = result.affected ?? 0;
    if (deleted > 0) {
      console.log(`[Hazards] Removed ${deleted} incident(s) with obsolete type at startup.`);
    }
  }

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

  private static readonly INCIDENT_TYPES: Array<{
    id: HazardType;
    label: string;
    icon: string;
    iconColor: string;
  }> = [
    { id: HazardType.INONDATION, label: 'Inondation', icon: 'weather-pouring', iconColor: '#0ea5e9' },
    { id: HazardType.FUITE_EAU, label: "Fuite d'eau", icon: 'water', iconColor: '#0284c7' },
    { id: HazardType.ARBRE_TOMBE, label: 'Arbre tombé', icon: 'tree', iconColor: '#15803d' },
    { id: HazardType.DEPOT_SAUVAGE, label: 'Dépôt sauvage', icon: 'trash-can', iconColor: '#78716c' },
    { id: HazardType.NID_DE_POULE, label: 'Nid de poule', icon: 'road-variant', iconColor: '#b45309' },
    { id: HazardType.ECLAIRAGE_PUBLIC_DEFECTUEUX, label: 'Éclairage public défectueux', icon: 'lightbulb-off', iconColor: '#eab308' },
    { id: HazardType.FEU_TRICOLORE_PANNE, label: 'Feu tricolore en panne', icon: 'traffic-light-outline', iconColor: '#dc2626' },
    { id: HazardType.TROTTOIR_VOIRIE_DEGRADE, label: 'Trottoir / voirie dégradé', icon: 'sidewalk', iconColor: '#64748b' },
    { id: HazardType.MOBILIER_URBAIN_DETERIORE, label: 'Mobilier urbain détérioré', icon: 'bench', iconColor: '#a16207' },
    { id: HazardType.NUISIBLES_INSALUBRITE, label: 'Nuisibles / insalubrité', icon: 'rat', iconColor: '#713f12' },
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
