import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getCitiesHazardStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getCitiesStats', () => {
    it('should return hazard statistics by city', async () => {
      const mockStats = [
        {
          city: 'Paris',
          total: 10,
          active: 5,
          resolved: 3,
          archived: 2,
          types: { inondation: 5, nid_de_poule: 5 },
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(result).toEqual(mockStats);
      expect(service.getCitiesHazardStats).toHaveBeenCalled();
    });

    it('should return empty array when no cities have hazards', async () => {
      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue([]);

      const result = await controller.getCitiesStats();

      expect(result).toEqual([]);
    });
  });

  describe('city statistics comprehensive', () => {
    it('should return stats for multiple cities', async () => {
      const mockStats = [
        {
          city: 'Paris',
          total: 50,
          active: 20,
          resolved: 25,
          archived: 5,
          types: { inondation: 15, nid_de_poule: 25, autre: 10 },
        },
        {
          city: 'Lyon',
          total: 30,
          active: 10,
          resolved: 15,
          archived: 5,
          types: { nid_de_poule: 20, inondation: 0, autre: 10 },
        },
        {
          city: 'Marseille',
          total: 25,
          active: 8,
          resolved: 15,
          archived: 2,
          types: { inondation: 10, nid_de_poule: 15, autre: 0 },
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(result).toHaveLength(3);
      expect(result.map(s => s.city)).toContain('Paris');
      expect(result.map(s => s.city)).toContain('Lyon');
      expect(result.map(s => s.city)).toContain('Marseille');
    });

    it('should correctly calculate hazard distribution by type', async () => {
      const mockStats = [
        {
          city: 'Paris',
          total: 100,
          active: 40,
          resolved: 50,
          archived: 10,
          types: {
            inondation: 25,
            nid_de_poule: 50,
            autre: 25,
          },
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(result[0].types.nid_de_poule).toBe(50);
      expect(result[0].types.inondation).toBe(25);
      expect(Object.values(result[0].types).reduce((a, b) => a + b, 0)).toBe(100);
    });

    it('should track resolution rates by city', async () => {
      const mockStats = [
        {
          city: 'HighResolution',
          total: 100,
          active: 10,
          resolved: 85,
          archived: 5,
          types: {},
        },
        {
          city: 'LowResolution',
          total: 100,
          active: 60,
          resolved: 35,
          archived: 5,
          types: {},
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      const highRate = result[0].resolved / result[0].total;
      const lowRate = result[1].resolved / result[1].total;

      expect(highRate).toBeGreaterThan(lowRate);
    });

    it('should handle cities with single hazard type', async () => {
      const mockStats = [
        {
          city: 'SingleType',
          total: 20,
          active: 5,
          resolved: 15,
          archived: 0,
          types: { nid_de_poule: 20 },
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(Object.keys(result[0].types)).toHaveLength(1);
    });

    it('should handle cities with many hazard types', async () => {
      const mockStats = [
        {
          city: 'ManyTypes',
          total: 100,
          active: 30,
          resolved: 60,
          archived: 10,
          types: {
            inondation: 25,
            nid_de_poule: 30,
            autre: 20,
            tranchee: 15,
            feu: 10,
          },
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(Object.keys(result[0].types).length).toBeGreaterThan(3);
    });

    it('should verify totals match sum of statuses', async () => {
      const mockStats = [
        {
          city: 'ConsistentCity',
          total: 100,
          active: 25,
          resolved: 60,
          archived: 15,
          types: {},
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      const sumStatuses = result[0].active + result[0].resolved + result[0].archived;
      expect(sumStatuses).toBe(result[0].total);
    });

    it('should handle city with zero hazards', async () => {
      const mockStats = [
        {
          city: 'ZeroCity',
          total: 0,
          active: 0,
          resolved: 0,
          archived: 0,
          types: {},
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(result[0].total).toBe(0);
    });

    it('should handle large scale city statistics', async () => {
      const mockStats = Array.from({ length: 50 }, (_, i) => ({
        city: `City${i + 1}`,
        total: Math.floor(Math.random() * 1000),
        active: Math.floor(Math.random() * 500),
        resolved: Math.floor(Math.random() * 500),
        archived: Math.floor(Math.random() * 100),
        types: {},
      }));

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(result).toHaveLength(50);
    });

    it('should preserve city names correctly', async () => {
      const cityNames = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'];
      const mockStats = cityNames.map(city => ({
        city,
        total: 10,
        active: 3,
        resolved: 5,
        archived: 2,
        types: {},
      }));

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      const returnedCities = result.map(s => s.city);
      expect(returnedCities).toEqual(expect.arrayContaining(cityNames));
    });

    it('should handle hazard type names with special characters', async () => {
      const mockStats = [
        {
          city: 'SpecialCity',
          total: 20,
          active: 5,
          resolved: 10,
          archived: 5,
          types: {
            'nid-de-poule': 10,
            "l'inondation": 5,
            'autre (divers)': 5,
          },
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(Object.keys(result[0].types)).toContain('nid-de-poule');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle service errors gracefully', async () => {
      jest.spyOn(service, 'getCitiesHazardStats').mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.getCitiesStats()).rejects.toThrow();
    });

    it('should handle undefined response from service', async () => {
      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(undefined as any);

      const result = await controller.getCitiesStats();

      expect(result).toBeUndefined();
    });

    it('should handle null values in statistics', async () => {
      const mockStats = [
        {
          city: 'NullCity',
          total: 10,
          active: null,
          resolved: null,
          archived: null,
          types: null,
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats as any);

      const result = await controller.getCitiesStats();

      expect(result[0].active).toBeNull();
    });

    it('should handle missing type fields', async () => {
      const mockStats = [
        {
          city: 'MissingTypes',
          total: 10,
          active: 5,
          resolved: 3,
          archived: 2,
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats as any);

      const result = await controller.getCitiesStats();

      expect(result[0]).not.toHaveProperty('types');
    });

    it('should handle very long city names', async () => {
      const mockStats = [
        {
          city: 'Saint-Jean-de-Monts-Nouvelle-Aquitaine-Region-France',
          total: 10,
          active: 3,
          resolved: 5,
          archived: 2,
          types: {},
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(result[0].city).toBe('Saint-Jean-de-Monts-Nouvelle-Aquitaine-Region-France');
    });

    it('should handle negative numbers in statistics', async () => {
      const mockStats = [
        {
          city: 'NegativeCity',
          total: 10,
          active: -5,
          resolved: 10,
          archived: 5,
          types: {},
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(result[0].active).toBe(-5);
    });
  });

  describe('performance considerations', () => {
    it('should handle rapid consecutive requests', async () => {
      const mockStats = [
        {
          city: 'Paris',
          total: 10,
          active: 5,
          resolved: 3,
          archived: 2,
          types: {},
        },
      ];

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const promises = Array.from({ length: 10 }, () =>
        controller.getCitiesStats(),
      );
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
    });

    it('should handle very large datasets', async () => {
      const mockStats = Array.from({ length: 1000 }, (_, i) => ({
        city: `City${i}`,
        total: 100,
        active: 30,
        resolved: 60,
        archived: 10,
        types: { hazard1: 50, hazard2: 50 },
      }));

      jest.spyOn(service, 'getCitiesHazardStats').mockResolvedValue(mockStats);

      const result = await controller.getCitiesStats();

      expect(result).toHaveLength(1000);
    });
  });
});
