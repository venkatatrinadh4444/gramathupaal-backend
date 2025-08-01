import { Test, TestingModule } from '@nestjs/testing';
import { FeedStockService } from './feed-stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { SelectedUnit } from '@prisma/client';
import { InternalServerErrorException } from '@nestjs/common';

const mockPrisma = {
  feedStock: {
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  feedStockHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('FeedStockService', () => {
  let service: FeedStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedStockService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FeedStockService>(FeedStockService);

    jest.spyOn(console, 'log').mockImplementation(() => {}); // prevent log noise
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const feedDto = {
    name: 'Green Fodder',
    date: new Date().toISOString(),
    unit: SelectedUnit.KG,
    quantity: '20',
    notes: 'Fresh stock',
  };

  describe('addNewStock', () => {
    it('should update existing feed stock', async () => {
      const existing = { id: 1, quantity: '50' };
      mockPrisma.feedStock.findFirst.mockResolvedValue(existing);
      mockPrisma.feedStock.update.mockResolvedValue({});
      mockPrisma.feedStockHistory.create.mockResolvedValue({});
      mockPrisma.feedStock.findMany.mockResolvedValue(['updated']);

      const result = await service.addNewStock(feedDto, 1);

      expect(result).toEqual({
        message: 'Feed stock updated successfully!',
        allFeedDetails: ['updated'],
      });
    });

    it('should create new feed stock if not existing', async () => {
      mockPrisma.feedStock.findFirst.mockResolvedValue(null);
      mockPrisma.feedStock.create.mockResolvedValue({ id: 2 });
      mockPrisma.feedStockHistory.create.mockResolvedValue({});
      mockPrisma.feedStock.findMany.mockResolvedValue(['created']);

      const result = await service.addNewStock(feedDto, 1);

      expect(result).toEqual({
        message: 'New feed stock added successfully!',
        allFeedDetails: ['created'],
      });
    });

    it('should handle error in addNewStock', async () => {
      mockPrisma.feedStock.findFirst.mockRejectedValue(new Error('fail'));

      await expect(service.addNewStock(feedDto, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('gettingAllFeedRecords', () => {
    it('should return default paginated records', async () => {
      mockPrisma.feedStock.count.mockResolvedValue(1);
      mockPrisma.feedStock.findMany.mockResolvedValue(['record']);

      const result = await service.gettingAllFeedRecords(
        1,
        '',
        [],
        '',
        '',
        '',
      );

      expect(result).toEqual({
        message: 'showing initial feed stock data',
        allStockData: {
          allRecords: ['record'],
          totalPages: 1,
          totalRecordsCount: 1,
        },
      });
    });

    it('should sort records by name ascending', async () => {
      mockPrisma.feedStock.count.mockResolvedValue(1);
      mockPrisma.feedStock.findMany.mockResolvedValue(['sorted']);

      const result = await service.gettingAllFeedRecords(1, 'name-asc', [], '', '', '');

      expect(result?.message).toContain('sorted');
    });

    it('should filter by unit and date', async () => {
      const from = '2025-07-01';
      const to = '2025-07-30';

      mockPrisma.feedStock.count.mockResolvedValue(1);
      mockPrisma.feedStock.findMany.mockResolvedValue(['filtered']);

      const result = await service.gettingAllFeedRecords(
        1,
        '',
        ['kg'],
        '',
        from,
        to,
      );

      expect(result?.allStockData.allRecords).toEqual(['filtered']);
    });

    it('should handle search by name', async () => {
      mockPrisma.feedStock.count.mockResolvedValue(1);
      mockPrisma.feedStock.findMany.mockResolvedValue(['search']);

      const result = await service.gettingAllFeedRecords(
        1,
        '',
        [],
        'green',
        '',
        '',
      );

      expect(result?.message).toContain('green');
      expect(result?.allStockData.allRecords).toEqual(['search']);
    });

    it('should handle error in gettingAllFeedRecords', async () => {
      mockPrisma.feedStock.count.mockRejectedValue(new Error('DB Fail'));

      await expect(
        service.gettingAllFeedRecords(1, '', [], '', '', ''),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('gettingParticularStockRecordHistory', () => {
    it('should return history for a feed item', async () => {
      mockPrisma.feedStockHistory.findMany.mockResolvedValue([
        {
          id: 1,
          feedId: 1,
          newQuantity: '10',
          type: 'Added',
          createdAt: new Date(),
          updatedAt: new Date(),
          feedStock: {
            name: 'Green Fodder',
            quantity: '100',
            unit: SelectedUnit.KG,
            notes: 'Test notes',
          },
        },
      ]);

      const result = await service.gettingParticularStockRecordHistory(1);
      expect(result?.message).toContain('Green Fodder');
    });

    it('should handle error in gettingParticularStockRecordHistory', async () => {
      mockPrisma.feedStockHistory.findMany.mockRejectedValue(
        new Error('fail'),
      );

      await expect(service.gettingParticularStockRecordHistory(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('gettingAllFeedStockNames', () => {
    it('should return names of all stocks with quantity > 0', async () => {
      mockPrisma.feedStock.findMany.mockResolvedValue([
        { name: 'Green Fodder' },
        { name: 'Dry Fodder' },
      ]);

      const result = await service.gettingAllFeedStockNames();
      expect(result?.allStockNames.length).toBe(2);
    });

    it('should handle error in gettingAllFeedStockNames', async () => {
      mockPrisma.feedStock.findMany.mockRejectedValue(new Error('fail'));

      await expect(service.gettingAllFeedStockNames()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
