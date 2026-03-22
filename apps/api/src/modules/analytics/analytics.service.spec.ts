import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { Hazard, HazardStatus, HazardType } from '../hazards/entities/hazard.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let hazardsRepository: Repository<Hazard>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Hazard),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    hazardsRepository = module.get<Repository<Hazard>>(getRepositoryToken(Hazard));
  });

  describe('getCitiesHazardStats', () => {
    it('should retrieve hazard statistics by city', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(hazardsRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);

      const result = await service.getCitiesHazardStats();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no cities have hazards', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(hazardsRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);

      const result = await service.getCitiesHazardStats();

      expect(result).toEqual([]);
    });
  });
});
