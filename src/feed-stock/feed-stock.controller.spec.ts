import { Test, TestingModule } from '@nestjs/testing';
import { FeedStockController } from './feed-stock.controller';
import { FeedStockService } from './feed-stock.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('FeedStockController', () => {
  let controller: FeedStockController;
  let service: FeedStockService;

  const mockFeedStockService = {
    addNewStock: jest.fn(),
    gettingAllFeedRecords: jest.fn(),
    gettingParticularStockRecordHistory: jest.fn(),
    gettingAllFeedStockNames: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: (context: ExecutionContext) => true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedStockController],
      providers: [
        {
          provide: FeedStockService,
          useValue: mockFeedStockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<FeedStockController>(FeedStockController);
    service = module.get<FeedStockService>(FeedStockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addFeedStock', () => {
    it('should call service.addNewStock with correct params', async () => {
      const dto = {
        name: 'Corn',
        date: new Date().toISOString(),
        quantity: '100',
        unit: 'KG',
        notes: 'Fresh',
      };
      const mockReq = { user: { id: 42 } };

      mockFeedStockService.addNewStock.mockResolvedValue('added');

      const result = await controller.addFeedStock(dto as any, mockReq);

      expect(service.addNewStock).toHaveBeenCalledWith(dto, 42);
      expect(result).toBe('added');
    });
  });

  describe('gettingAllFeedStockRecords', () => {
    it('should call service.gettingAllFeedRecords with array filter', async () => {
      const mockResponse = {
        message: 'data',
        allStockData: [],
      };

      mockFeedStockService.gettingAllFeedRecords.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.gettingAllFeedStockRecords(
        1,
        'newest',
        ['KG', 'PIECES'],
        'corn',
        '2025-06-01',
        '2025-06-30',
      );

      expect(service.gettingAllFeedRecords).toHaveBeenCalledWith(
        1,
        'newest',
        ['KG', 'PIECES'],
        'corn',
        '2025-06-01',
        '2025-06-30',
      );
      expect(result).toEqual(mockResponse);
    });

    it('should normalize single string filter to array', async () => {
      mockFeedStockService.gettingAllFeedRecords.mockResolvedValue('ok');

      const result = await controller.gettingAllFeedStockRecords(
        2,
        '',
        'KG' as any,
        '',
        '',
        '',
      );

      expect(service.gettingAllFeedRecords).toHaveBeenCalledWith(
        2,
        '',
        ['KG'],
        '',
        '',
        '',
      );
      expect(result).toBe('ok');
    });

    it('should fallback to empty filter array if none provided', async () => {
      mockFeedStockService.gettingAllFeedRecords.mockResolvedValue('empty');

      const result = await controller.gettingAllFeedStockRecords(
        3,
        '',
        undefined as any,
        '',
        '',
        '',
      );

      expect(service.gettingAllFeedRecords).toHaveBeenCalledWith(
        3,
        '',
        [],
        '',
        '',
        '',
      );
      expect(result).toBe('empty');
    });
  });

  describe('gettingSpecificRecordHistory', () => {
    it('should call service.gettingParticularStockRecordHistory with ID', async () => {
      mockFeedStockService.gettingParticularStockRecordHistory.mockResolvedValue(
        'history',
      );

      const result = await controller.gettingSpecificRecordHistory(3);

      expect(service.gettingParticularStockRecordHistory).toHaveBeenCalledWith(
        3,
      );
      expect(result).toBe('history');
    });
  });

  describe('gettingAllStockNames', () => {
    it('should return all stock names', async () => {
      mockFeedStockService.gettingAllFeedStockNames.mockResolvedValue([
        'Corn',
        'Wheat',
      ]);

      const result = await controller.gettingAllStockNames();

      expect(service.gettingAllFeedStockNames).toHaveBeenCalled();
      expect(result).toEqual(['Corn', 'Wheat']);
    });
  });
});
