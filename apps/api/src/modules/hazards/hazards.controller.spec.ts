// Mock expo-server-sdk before importing anything else
jest.mock('expo-server-sdk', () => ({
  Expo: class Expo {
    sendPushNotificationsAsync() {}
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { HazardsController } from './hazards.controller';
import { HazardsService } from './hazards.service';
import { StorageService } from '../storage/storage.service';
import { ImageModerationService } from '../image-moderation/image-moderation.service';
import { HazardStatus, HazardType } from './entities/hazard.entity';

describe('HazardsController', () => {
  let controller: HazardsController;
  let hazardsService: HazardsService;
  let storageService: StorageService;
  let imageModerationService: ImageModerationService;

  const mockHazard = {
    id: '1',
    type: HazardType.INONDATION,
    latitude: 48.8566,
    longitude: 2.3522,
    description: 'Water flooding',
    status: HazardStatus.ACTIVE,
    imageUrl: 'incidents/image.jpg',
    city: 'Paris',
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      userId: 'user1',
      email: 'user@test.com',
      role: 'citizen',
    },
  };

  const mockFile = {
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    size: 100000,
    buffer: Buffer.from('fake image data'),
  } as Express.Multer.File;

  const mockHazardsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findActive: jest.fn(),
    findByUserId: jest.fn(),
    findNearby: jest.fn(),
    findOne: jest.fn(),
    findOneRaw: jest.fn(),
    getTypes: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  const mockStorageService = {
    upload: jest.fn(),
    getImage: jest.fn(),
  };

  const mockImageModerationService = {
    checkImage: jest.fn(),
    checkRelevance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HazardsController],
      providers: [
        {
          provide: HazardsService,
          useValue: mockHazardsService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ImageModerationService,
          useValue: mockImageModerationService,
        },
      ],
    }).compile();

    controller = module.get<HazardsController>(HazardsController);
    hazardsService = module.get<HazardsService>(HazardsService);
    storageService = module.get<StorageService>(StorageService);
    imageModerationService = module.get<ImageModerationService>(ImageModerationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /hazards/incident', () => {
    it('should create incident with valid image', async () => {
      mockImageModerationService.checkImage.mockResolvedValue({ allowed: true });
      mockImageModerationService.checkRelevance.mockResolvedValue({ relevant: true });
      mockStorageService.upload.mockResolvedValue('incidents/image.jpg');
      mockHazardsService.create.mockResolvedValue(mockHazard);

      const dto = {
        type: HazardType.INONDATION,
        latitude: 48.8566,
        longitude: 2.3522,
        description: 'Water flooding',
      };

      const result = await controller.createIncident(mockFile, dto, mockRequest);

      expect(result).toBeDefined();
      expect(imageModerationService.checkImage).toHaveBeenCalled();
      expect(imageModerationService.checkRelevance).toHaveBeenCalled();
      expect(storageService.upload).toHaveBeenCalled();
      expect(hazardsService.create).toHaveBeenCalled();
    });

    it('should reject inappropriate image', async () => {
      mockImageModerationService.checkImage.mockResolvedValue({
        allowed: false,
        message: 'Image not allowed',
      });

      const dto = {
        type: HazardType.INONDATION,
        latitude: 48.8566,
        longitude: 2.3522,
        description: 'Water flooding',
      };

      await expect(
        controller.createIncident(mockFile, dto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject irrelevant image', async () => {
      mockImageModerationService.checkImage.mockResolvedValue({ allowed: true });
      mockImageModerationService.checkRelevance.mockResolvedValue({
        relevant: false,
        message: 'Image not relevant',
      });

      const dto = {
        type: HazardType.INONDATION,
        latitude: 48.8566,
        longitude: 2.3522,
        description: 'Water flooding',
      };

      await expect(
        controller.createIncident(mockFile, dto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle storage unavailable error', async () => {
      mockImageModerationService.checkImage.mockResolvedValue({ allowed: true });
      mockImageModerationService.checkRelevance.mockResolvedValue({ relevant: true });
      const error = new Error('ECONNREFUSED');
      mockStorageService.upload.mockRejectedValue(error);

      const dto = {
        type: HazardType.INONDATION,
        latitude: 48.8566,
        longitude: 2.3522,
        description: 'Water flooding',
      };

      await expect(
        controller.createIncident(mockFile, dto, mockRequest),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should reject when no file provided', async () => {
      const dto = {
        type: HazardType.INONDATION,
        latitude: 48.8566,
        longitude: 2.3522,
        description: 'Water flooding',
      };

      await expect(
        controller.createIncident(undefined as any, dto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /hazards', () => {
    it('should create hazard without image', async () => {
      const createDto = {
        type: HazardType.ARBRE_TOMBE,
        latitude: 48.8566,
        longitude: 2.3522,
        description: 'Fallen tree',
        imageUrl: undefined,
      };

      mockHazardsService.create.mockResolvedValue(mockHazard);

      const result = await controller.create(createDto, mockRequest);

      expect(result).toBeDefined();
      expect(hazardsService.create).toHaveBeenCalledWith(createDto, mockRequest.user.userId);
    });
  });

  describe('GET /hazards', () => {
    it('should return all hazards', async () => {
      const hazards = [mockHazard];
      mockHazardsService.findAll.mockResolvedValue(hazards);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(hazardsService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /hazards/active', () => {
    it('should return active hazards', async () => {
      const hazards = [mockHazard];
      mockHazardsService.findActive.mockResolvedValue(hazards);

      const result = await controller.findActive();

      expect(result).toHaveLength(1);
      expect(hazardsService.findActive).toHaveBeenCalled();
    });
  });

  describe('GET /hazards/my', () => {
    it('should return user hazards', async () => {
      const hazards = [mockHazard];
      mockHazardsService.findByUserId.mockResolvedValue(hazards);

      const result = await controller.findMyHazards(mockRequest);

      expect(result).toHaveLength(1);
      expect(hazardsService.findByUserId).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('GET /hazards/nearby', () => {
    it('should return nearby hazards', async () => {
      const hazards = [mockHazard];
      mockHazardsService.findNearby.mockResolvedValue(hazards);

      const result = await controller.findNearby(48.8566, 2.3522, 10);

      expect(result).toHaveLength(1);
      expect(hazardsService.findNearby).toHaveBeenCalledWith(48.8566, 2.3522, 10);
    });
  });

  describe('GET /hazards/types', () => {
    it('should return hazard types', async () => {
      const types = Object.values(HazardType);
      mockHazardsService.getTypes.mockReturnValue(types);

      const result = await controller.getTypes();

      expect(result).toBeDefined();
      expect(hazardsService.getTypes).toHaveBeenCalled();
    });
  });

  describe('GET /hazards/:id', () => {
    it('should return hazard by id', async () => {
      mockHazardsService.findOne.mockResolvedValue(mockHazard);

      const result = await controller.findOne('1');

      expect(result).toBeDefined();
      expect(hazardsService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when hazard not found', async () => {
      mockHazardsService.findOne.mockRejectedValue(
        new NotFoundException('Hazard not found'),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /hazards/:id', () => {
    it('should update hazard', async () => {
      const updateDto = { description: 'Updated description' };
      mockHazardsService.update.mockResolvedValue({ ...mockHazard, ...updateDto });

      const result = await controller.update('1', updateDto, mockRequest);

      expect(result).toBeDefined();
      expect(hazardsService.update).toHaveBeenCalledWith(
        '1',
        updateDto,
        mockRequest.user.userId,
        mockRequest.user.role,
      );
    });
  });

  describe('PATCH /hazards/:id/status', () => {
    it('should update hazard status', async () => {
      const updateDto = { status: HazardStatus.RESOLVED };
      mockHazardsService.updateStatus.mockResolvedValue({
        ...mockHazard,
        status: HazardStatus.RESOLVED,
      });

      const result = await controller.updateStatus('1', updateDto, mockRequest);

      expect(result).toBeDefined();
      expect(hazardsService.updateStatus).toHaveBeenCalledWith(
        '1',
        HazardStatus.RESOLVED,
        mockRequest.user.userId,
      );
    });
  });

  describe('DELETE /hazards/:id', () => {
    it('should delete hazard', async () => {
      mockHazardsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', mockRequest);

      expect(hazardsService.remove).toHaveBeenCalledWith(
        '1',
        mockRequest.user.userId,
        mockRequest.user.role,
      );
    });
  });
});
