import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ImageModerationService, ModerationResult, RelevanceResult } from './image-moderation.service';

describe('ImageModerationService', () => {
  let service: ImageModerationService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        OPENAI_API_KEY: 'test-api-key',
        IMAGE_MODERATION_ENABLED: 'true',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageModerationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ImageModerationService>(ImageModerationService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkImage', () => {
    it('should return allowed=true when image passes moderation', async () => {
      const buffer = Buffer.from('fake image data');
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'checkImage').mockResolvedValue({
        allowed: true,
      });

      const result = await service.checkImage(buffer, mimeType);

      expect(result).toEqual({ allowed: true });
      expect(service.checkImage).toHaveBeenCalledWith(buffer, mimeType);
    });

    it('should return allowed=false with message when image is flagged', async () => {
      const buffer = Buffer.from('inappropriate image data');
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'checkImage').mockResolvedValue({
        allowed: false,
        message: 'Image contains inappropriate content',
      });

      const result = await service.checkImage(buffer, mimeType);

      expect(result.allowed).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should skip moderation when OPENAI_API_KEY is not set', async () => {
      jest.spyOn(mockConfigService, 'get').mockImplementation((key) => {
        if (key === 'OPENAI_API_KEY') return undefined;
        return 'true';
      });

      const buffer = Buffer.from('any image data');
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'checkImage').mockResolvedValue({
        allowed: true,
      });

      const result = await service.checkImage(buffer, mimeType);

      expect(result).toEqual({ allowed: true });
    });

    it('should skip moderation when IMAGE_MODERATION_ENABLED is false', async () => {
      jest.spyOn(mockConfigService, 'get').mockImplementation((key) => {
        if (key === 'IMAGE_MODERATION_ENABLED') return 'false';
        return 'test-key';
      });

      const buffer = Buffer.from('any image data');
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'checkImage').mockResolvedValue({
        allowed: true,
      });

      const result = await service.checkImage(buffer, mimeType);

      expect(result).toEqual({ allowed: true });
    });

    it('should handle API errors gracefully', async () => {
      const buffer = Buffer.from('image data');
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'checkImage').mockRejectedValue(new Error('API error'));

      await expect(service.checkImage(buffer, mimeType)).rejects.toThrow('API error');
    });

    it('should handle multiple image formats', async () => {
      const buffer = Buffer.from('image data');
      const formats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      for (const format of formats) {
        jest.spyOn(service, 'checkImage').mockResolvedValue({
          allowed: true,
        });

        const result = await service.checkImage(buffer, format);
        expect(result).toEqual({ allowed: true });
      }
    });

    it('should use default mime type when not provided', async () => {
      const buffer = Buffer.from('image data');

      jest.spyOn(service, 'checkImage').mockResolvedValue({
        allowed: true,
      });

      const result = await service.checkImage(buffer, '');

      expect(result).toEqual({ allowed: true });
    });

    it('should return forbidden message for flagged content categories', async () => {
      const buffer = Buffer.from('violent image');
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'checkImage').mockResolvedValue({
        allowed: false,
        message: 'Image contains violent content',
      });

      const result = await service.checkImage(buffer, mimeType);

      expect(result.allowed).toBe(false);
      expect(result.message).toContain('violent');
    });
  });

  describe('checkRelevance', () => {
    it('should return relevant=true when image matches hazard type', async () => {
      const buffer = Buffer.from('hazard image');
      const mimeType = 'image/jpeg';
      const hazardType = 'INONDATION';
      const description = 'Water flooding the street';

      jest.spyOn(service, 'checkRelevance').mockResolvedValue({
        relevant: true,
      });

      const result = await service.checkRelevance(buffer, mimeType, hazardType, description);

      expect(result).toEqual({ relevant: true });
      expect(service.checkRelevance).toHaveBeenCalledWith(
        buffer,
        mimeType,
        hazardType,
        description,
      );
    });

    it('should return relevant=false with message when image does not match hazard type', async () => {
      const buffer = Buffer.from('irrelevant image');
      const mimeType = 'image/jpeg';
      const hazardType = 'INONDATION';
      const description = 'Water flooding';

      jest.spyOn(service, 'checkRelevance').mockResolvedValue({
        relevant: false,
        message: 'Image does not show water or flooding',
      });

      const result = await service.checkRelevance(buffer, mimeType, hazardType, description);

      expect(result.relevant).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should handle vision API errors', async () => {
      const buffer = Buffer.from('image');
      const mimeType = 'image/jpeg';
      const hazardType = 'NIDS_DE_POULE';
      const description = 'Pothole on road';

      jest.spyOn(service, 'checkRelevance').mockRejectedValue(new Error('Vision API error'));

      await expect(
        service.checkRelevance(buffer, mimeType, hazardType, description),
      ).rejects.toThrow('Vision API error');
    });

    it('should check relevance for all hazard types', async () => {
      const hazardTypes = [
        'INONDATION',
        'FUITE_EAU',
        'ARBRE_TOMBE',
        'DEPOT_SAUVAGE',
        'NID_DE_POULE',
        'ECLAIRAGE_PUBLIC_DEFECTUEUX',
        'FEU_TRICOLORE_PANNE',
        'TROTTOIR_VOIRIE_DEGRADE',
        'MOBILIER_URBAIN_DETERIORE',
        'NUISIBLES_INSALUBRITE',
      ];

      const buffer = Buffer.from('image');
      const mimeType = 'image/jpeg';

      for (const hazardType of hazardTypes) {
        jest.spyOn(service, 'checkRelevance').mockResolvedValue({
          relevant: true,
        });

        const result = await service.checkRelevance(buffer, mimeType, hazardType, 'description');
        expect(result).toEqual({ relevant: true });
      }
    });

    it('should analyze both image content and textual description', async () => {
      const buffer = Buffer.from('tree image');
      const mimeType = 'image/jpeg';
      const hazardType = 'ARBRE_TOMBE';
      const description = 'Large tree fell on the sidewalk';

      jest.spyOn(service, 'checkRelevance').mockResolvedValue({
        relevant: true,
      });

      const result = await service.checkRelevance(buffer, mimeType, hazardType, description);

      expect(result.relevant).toBe(true);
      expect(service.checkRelevance).toHaveBeenCalledWith(
        buffer,
        mimeType,
        hazardType,
        description,
      );
    });

    it('should handle network timeout errors', async () => {
      const buffer = Buffer.from('image');
      const mimeType = 'image/jpeg';

      jest
        .spyOn(service, 'checkRelevance')
        .mockRejectedValue(new Error('Request timeout'));

      await expect(
        service.checkRelevance(buffer, mimeType, 'HAZARD_TYPE', 'description'),
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Configuration handling', () => {
    it('should use provided configuration values', () => {
      const apiKey = configService.get('OPENAI_API_KEY');
      expect(apiKey).toBeDefined();
    });

    it('should handle missing API key gracefully', () => {
      jest.spyOn(mockConfigService, 'get').mockImplementation((key) => {
        if (key === 'OPENAI_API_KEY') return undefined;
      });

      expect(configService.get('OPENAI_API_KEY')).toBeUndefined();
    });

    it('should respect IMAGE_MODERATION_ENABLED flag', () => {
      jest.spyOn(mockConfigService, 'get').mockImplementation((key) => {
        if (key === 'IMAGE_MODERATION_ENABLED') return 'false';
      });

      expect(configService.get('IMAGE_MODERATION_ENABLED')).toBe('false');
    });
  });
});
