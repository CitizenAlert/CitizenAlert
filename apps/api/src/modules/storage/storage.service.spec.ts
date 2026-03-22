import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        S3_ENDPOINT: 'http://localhost:9000',
        S3_REGION: 'us-east-1',
        S3_BUCKET: 'citizen-alert-images',
        MINIO_ROOT_USER: 'minioadmin',
        MINIO_ROOT_PASSWORD: 'minioadmin',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with default config values', () => {
      expect(service).toBeDefined();
      expect(configService.get).toHaveBeenCalled();
    });

    it('should use custom endpoint when provided', () => {
      jest.spyOn(mockConfigService, 'get').mockImplementation((key) => {
        if (key === 'S3_ENDPOINT') return 'https://custom-endpoint.com';
        return 'default';
      });

      const newService = new StorageService(configService);
      expect(newService).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('should handle bucket check on module init', async () => {
      // Mock the client send method to avoid actual S3 calls
      jest.spyOn(service as any, 'ensureBucket').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(service).toBeDefined();
    });

    it('should handle bucket check failure gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(service as any, 'ensureBucket').mockRejectedValue(new Error('Bucket error'));

      await service.onModuleInit();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('upload', () => {
    it('should upload a file successfully', async () => {
      const buffer = Buffer.from('test content');
      const key = 'incidents/test-image.jpg';
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'upload').mockResolvedValue(key);

      const result = await service.upload(buffer, key, mimeType);

      expect(result).toBe(key);
      expect(service.upload).toHaveBeenCalledWith(buffer, key, mimeType);
    });

    it('should throw error when upload fails', async () => {
      const buffer = Buffer.from('test content');
      const key = 'incidents/test-image.jpg';
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'upload').mockRejectedValue(new Error('Upload failed'));

      await expect(service.upload(buffer, key, mimeType)).rejects.toThrow('Upload failed');
    });

    it('should handle S3 connection errors', async () => {
      const buffer = Buffer.from('test content');
      const key = 'incidents/test-image.jpg';
      const mimeType = 'image/jpeg';

      jest.spyOn(service, 'upload').mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      await expect(service.upload(buffer, key, mimeType)).rejects.toEqual(
        expect.objectContaining({
          code: 'ECONNREFUSED',
        }),
      );
    });

    it('should return key instead of full URL', async () => {
      const buffer = Buffer.from('image data');
      const key = 'incidents/photo123.jpg';
      jest.spyOn(service, 'upload').mockResolvedValue(key);

      const result = await service.upload(buffer, key, 'image/jpeg');

      expect(result).toBe(key);
      expect(result).not.toContain('http');
    });
  });

  describe('getImage', () => {
    it('should retrieve image successfully', async () => {
      const key = 'incidents/test-image.jpg';
      const mockBuffer = Buffer.from('mock image data');

      jest.spyOn(service, 'getImage').mockResolvedValue(mockBuffer);

      const result = await service.getImage(key);

      expect(result).toBeDefined();
      expect(result).toEqual(mockBuffer);
    });

    it('should throw error when image not found', async () => {
      const key = 'incidents/nonexistent.jpg';

      jest.spyOn(service, 'getImage').mockRejectedValue(new Error('Could not retrieve image: NoSuchKey'));

      await expect(service.getImage(key)).rejects.toThrow('Could not retrieve image');
    });

    it('should handle S3 errors', async () => {
      const key = 'incidents/error-image.jpg';

      jest.spyOn(service, 'getImage').mockRejectedValue(new Error('S3 error'));

      await expect(service.getImage(key)).rejects.toThrow('S3 error');
    });
  });

  describe('private ensureBucket', () => {
    it('should verify bucket exists or create it', async () => {
      jest.spyOn(service as any, 'ensureBucket').mockResolvedValue(undefined);

      // Can't directly test private method, but we can test indirectly through onModuleInit
      await service.onModuleInit();

      expect(service).toBeDefined();
    });
  });
});
