import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hazard } from '../hazards/entities/hazard.entity';

export interface CityHazardStats {
  city: string;
  total: number;
  active: number;
  resolved: number;
  archived: number;
  types: {
    [key: string]: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Hazard)
    private hazardsRepository: Repository<Hazard>,
  ) {}

  async getCitiesHazardStats(): Promise<CityHazardStats[]> {
    // Get hazards with city information grouped by city and status
    const hazardsWithCity = await this.hazardsRepository
      .createQueryBuilder('hazard')
      .select('hazard.city', 'city')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN hazard.status = 'active' THEN 1 ELSE 0 END)`,
        'active',
      )
      .addSelect(
        `SUM(CASE WHEN hazard.status = 'resolved' THEN 1 ELSE 0 END)`,
        'resolved',
      )
      .addSelect(
        `SUM(CASE WHEN hazard.status = 'archived' THEN 1 ELSE 0 END)`,
        'archived',
      )
      .where('hazard.city IS NOT NULL')
      .groupBy('hazard.city')
      .orderBy('total', 'DESC')
      .getRawMany();

    // Get hazard type distribution by city
    const typesByCity = await this.hazardsRepository
      .createQueryBuilder('hazard')
      .select('hazard.city', 'city')
      .addSelect('hazard.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('hazard.city IS NOT NULL')
      .groupBy('hazard.city')
      .addGroupBy('hazard.type')
      .getRawMany();

    // Combine the data
    const cityMap = new Map<string, CityHazardStats>();

    hazardsWithCity.forEach((row: any) => {
      if (row.city) {
        cityMap.set(row.city, {
          city: row.city,
          total: parseInt(row.total, 10) || 0,
          active: parseInt(row.active, 10) || 0,
          resolved: parseInt(row.resolved, 10) || 0,
          archived: parseInt(row.archived, 10) || 0,
          types: {},
        });
      }
    });

    typesByCity.forEach((row: any) => {
      if (row.city && cityMap.has(row.city)) {
        const stats = cityMap.get(row.city);
        if (!stats.types[row.type]) {
          stats.types[row.type] = 0;
        }
        stats.types[row.type] += parseInt(row.count, 10) || 0;
      }
    });

    return Array.from(cityMap.values()).sort((a, b) => b.total - a.total);
  }
}
