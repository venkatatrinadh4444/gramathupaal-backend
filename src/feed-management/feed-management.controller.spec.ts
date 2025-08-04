import { Test, TestingModule } from '@nestjs/testing';
import { FeedManagementController } from './feed-management.controller';
import { FeedManagementService } from './feed-management.service';
import { ConsumedFeedDto } from './dto/consumed-feed.dto';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// Mock enums (if needed)
enum CattleType {
  BUFFALO = 'BUFFALO',
  COW = 'COW',
  GOAT = 'GOAT',
}
enum FeedType {
  WATER = 'WATER',
  FEED = 'FEED',
}
enum SelectedSession {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

describe('FeedManagementController', () => {
  let controller: FeedManagementController;
  let service: FeedManagementService;

  const mockService = {
    addFeedRecord: jest.fn(),
    gettingParticularAnimalFeedRecords: jest.fn(),
    gettingAllFeedRecords: jest.fn(),
    editParticularFeedRecord: jest.fn(),
    deleteParticularFeedRecord: jest.fn(),
    getFeedRecordsForSpecificDate: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedManagementController],
      providers: [{ provide: FeedManagementService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<FeedManagementController>(FeedManagementController);
    service = module.get<FeedManagementService>(FeedManagementService);

    jest.clearAllMocks();
  });

  describe('addNewFeedConsumptionRecord', () => {
    it('should call service.addFeedRecord and return its result', async () => {
      const dto: ConsumedFeedDto = {
        type: CattleType.COW,
        cattleName: 'Kaveri-02',
        feedType: FeedType.FEED,
        feedName: 'Hay',
        date: new Date().toISOString(),
        session: SelectedSession.MORNING,
        quantity: '10',
      };
      const mockUserId = 1;
      const mockResult = { message: 'success' };
      (service.addFeedRecord as jest.Mock).mockResolvedValue(mockResult);

      const req = { user: { id: mockUserId } };
      const result = await controller.addNewFeedConsumptionRecord(dto, req);

      expect(service.addFeedRecord).toHaveBeenCalledWith(dto, mockUserId);
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingSpecificAnimalRecords', () => {
    it('should throw BadRequestException for invalid cattleName format', async () => {
      await expect(controller.gettingSpecificAnimalRecords('invalidName')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should call service.gettingParticularAnimalFeedRecords and return result for valid cattleName', async () => {
      const cattleName = 'Kaveri-02';
      const mockResult = { message: 'data' };
      (service.gettingParticularAnimalFeedRecords as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.gettingSpecificAnimalRecords(cattleName);

      expect(service.gettingParticularAnimalFeedRecords).toHaveBeenCalledWith(cattleName);
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingAllFeedRecords', () => {
    it('should normalize filter and call service.gettingAllFeedRecords with correct params', async () => {
      const page = 1;
      const sortBy = 'newest';
      const filter = ['COW', 'Morning'];
      const search = 'Hay';
      const fromDate = '2025-06-01';
      const toDate = '2025-06-10';

      const mockResult = { message: 'all records' };
      (service.gettingAllFeedRecords as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.gettingAllFeedRecords(page, sortBy, filter, search, fromDate, toDate);

      expect(service.gettingAllFeedRecords).toHaveBeenCalledWith(page, sortBy, filter, search, fromDate, toDate);
      expect(result).toBe(mockResult);
    });

    it('should convert single string filter to array', async () => {
      const page = 2;
      const sortBy = '';
      const filter = 'COW';
      const search = '';
      const fromDate = '';
      const toDate = '';

      const mockResult = { message: 'all records' };
      (service.gettingAllFeedRecords as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.gettingAllFeedRecords(page, sortBy, filter as any, search, fromDate, toDate);

      expect(service.gettingAllFeedRecords).toHaveBeenCalledWith(page, sortBy, [filter], search, fromDate, toDate);
      expect(result).toBe(mockResult);
    });

    it('should handle undefined filter as empty array', async () => {
      const page = 1;
      const sortBy = '';
      const filter = undefined;
      const search = '';
      const fromDate = '';
      const toDate = '';

      const mockResult = { message: 'all records' };
      (service.gettingAllFeedRecords as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.gettingAllFeedRecords(page, sortBy, filter as any, search, fromDate, toDate);

      expect(service.gettingAllFeedRecords).toHaveBeenCalledWith(page, sortBy, [], search, fromDate, toDate);
      expect(result).toBe(mockResult);
    });
  });

  describe('editParticularFeedRecord', () => {
    it('should call service.editParticularFeedRecord and return result', async () => {
      const id = 10;
      const dto: ConsumedFeedDto = {
        type: CattleType.COW,
        cattleName: 'Kaveri-02',
        feedType: FeedType.FEED,
        feedName: 'Hay',
        date: new Date().toISOString(),
        session: SelectedSession.MORNING,
        quantity: '8',
      };

      const mockResult = { message: 'updated' };
      (service.editParticularFeedRecord as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.editParticularFeedRecord(id, dto);

      expect(service.editParticularFeedRecord).toHaveBeenCalledWith(id, dto);
      expect(result).toBe(mockResult);
    });
  });

  describe('deleteParticularFeedRecord', () => {
    it('should call service.deleteParticularFeedRecord and return result', async () => {
      const id = 5;
      const mockResult = { message: 'deleted' };
      (service.deleteParticularFeedRecord as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.deleteParticularFeedRecord(id);

      expect(service.deleteParticularFeedRecord).toHaveBeenCalledWith(id);
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingDateBasedMilkRecords', () => {
    it('should call service.getFeedRecordsForSpecificDate and return result', async () => {
      const cattleName = 'Kaveri-001';
      const fromDate = '2025-06-12';
      const toDate = '2025-06-12';
      const mockResult = { message: 'date based milk records' };
      (service.getFeedRecordsForSpecificDate as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.gettingDateBasedMilkRecords(cattleName, fromDate, toDate);

      expect(service.getFeedRecordsForSpecificDate).toHaveBeenCalledWith(cattleName, fromDate, toDate);
      expect(result).toBe(mockResult);
    });
  });
});
