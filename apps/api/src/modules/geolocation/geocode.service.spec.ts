import { Test, TestingModule } from '@nestjs/testing';
import { GeocodeService } from './geocode.service';

describe('GeocodeService', () => {
  let service: GeocodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeocodeService],
    }).compile();

    service = module.get<GeocodeService>(GeocodeService);
  });

  describe('getCityFromCoordinates', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service.getCityFromCoordinates).toBeDefined();
    });

    it('should return city for valid coordinates', async () => {
      const mockResponse = {
        address: {
          city: 'Paris',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.getCityFromCoordinates(48.8566, 2.3522);

      expect(result).toBe('Paris');
    });

    it('should return undefined for failed API response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await service.getCityFromCoordinates(48.8566, 2.3522);

      expect(result).toBeUndefined();
    });

    it('should handle API error gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.getCityFromCoordinates(48.8566, 2.3522);

      expect(result).toBeUndefined();
    });

    it('should try alternative city fields if city is missing', async () => {
      const mockResponse = {
        address: {
          town: 'Lyon',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.getCityFromCoordinates(45.7640, 4.8357);

      expect(result).toBe('Lyon');
    });

    it('should use county as fallback', async () => {
      const mockResponse = {
        address: {
          county: 'Île-de-France',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.getCityFromCoordinates(48.5, 2.5);

      expect(result).toBe('Île-de-France');
    });

    it('should use province as last fallback', async () => {
      const mockResponse = {
        address: {
          province: 'South Island',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.getCityFromCoordinates(-46, 168);

      expect(result).toBe('South Island');
    });

    it('should return undefined if no address found', async () => {
      const mockResponse = {};

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.getCityFromCoordinates(50, 10);

      expect(result).toBeUndefined();
    });

    it('should return undefined if no city name in address', async () => {
      const mockResponse = {
        address: {
          state: 'Some State',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.getCityFromCoordinates(40, -100);

      expect(result).toBeUndefined();
    });

    it('should include User-Agent header in request', async () => {
      const mockResponse = {
        address: { city: 'Test' },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.getCityFromCoordinates(0, 0);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://nominatim.openstreetmap.org/reverse'),
        expect.objectContaining({
          headers: {
            'User-Agent': 'CitizenAlert/1.0',
          },
        }),
      );
    });
  });
});
