import { Test, TestingModule } from '@nestjs/testing';
import { FeedManagementService } from './feed-management.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConsumedFeedDto } from './dto/consumed-feed.dto';

// Enums from schema
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
enum SelectedUnit {
  KG = 'KG',
  PIECES = 'PIECES',
  PACKETS = 'PACKETS',
}

// Mock catchBlock to re-throw errors for testing
jest.mock('../common/catch-block', () => ({
  catchBlock: jest.fn((err) => { throw err; }),
}));

describe('FeedManagementService', () => {
  let service: FeedManagementService;
  let prisma: {
    cattle: { findFirst: jest.Mock };
    feedStock: { findFirst: jest.Mock; update: jest.Mock };
    feedConsumption: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    feedStockHistory: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedManagementService,
        {
          provide: PrismaService,
          useValue: {
            cattle: { findFirst: jest.fn() },
            feedStock: { findFirst: jest.fn(), update: jest.fn() },
            feedConsumption: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            feedStockHistory: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FeedManagementService>(FeedManagementService);
    const prismaService = module.get<PrismaService>(PrismaService);

    // Cast mocks for easier typing and to avoid TS errors
    prisma = {
      cattle: {
        findFirst: prismaService.cattle.findFirst as jest.Mock,
      },
      feedStock: {
        findFirst: prismaService.feedStock.findFirst as jest.Mock,
        update: prismaService.feedStock.update as jest.Mock,
      },
      feedConsumption: {
        create: prismaService.feedConsumption.create as jest.Mock,
        findMany: prismaService.feedConsumption.findMany as jest.Mock,
        count: prismaService.feedConsumption.count as jest.Mock,
        aggregate: prismaService.feedConsumption.aggregate as jest.Mock,
        findFirst: prismaService.feedConsumption.findFirst as jest.Mock,
        update: prismaService.feedConsumption.update as jest.Mock,
        delete: prismaService.feedConsumption.delete as jest.Mock,
      },
      feedStockHistory: {
        create: prismaService.feedStockHistory.create as jest.Mock,
        findFirst: prismaService.feedStockHistory.findFirst as jest.Mock,
        update: prismaService.feedStockHistory.update as jest.Mock,
        delete: prismaService.feedStockHistory.delete as jest.Mock,
      },
    };

    jest.clearAllMocks();
  });

  describe('addFeedRecord', () => {
    const userId = 1;
    const dto: ConsumedFeedDto = {
      type: CattleType.COW,
      cattleName: 'Kaveri-02',
      feedType: FeedType.FEED,
      feedName: 'Green Fodder',
      date: new Date().toISOString(),
      session: SelectedSession.MORNING,
      quantity: '10.00',
    };

    it('should add a feed record (non-water) successfully', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.feedStock.findFirst.mockResolvedValue({
        id: 1,
        name: dto.feedName,
        quantity: '100',
        unit: SelectedUnit.KG,
      });
      prisma.feedConsumption.create.mockResolvedValue({});
      prisma.feedStock.update.mockResolvedValue({});
      prisma.feedStockHistory.create.mockResolvedValue({});
      prisma.feedConsumption.findMany.mockResolvedValue(['mockFeed']);

      const result = await service.addFeedRecord(dto, userId);

      expect(result).toEqual({
        message: 'New feed consumption record added successfully!',
        allRecords: ['mockFeed'],
      });
      expect(prisma.cattle.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.feedStock.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.feedConsumption.create).toHaveBeenCalledTimes(1);
      expect(prisma.feedStock.update).toHaveBeenCalledTimes(1);
      expect(prisma.feedStockHistory.create).toHaveBeenCalledTimes(1);
    });

    it('should add a water consumption record successfully', async () => {
      const waterDto = { ...dto, feedType: FeedType.WATER, feedName: 'Water' };
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.feedConsumption.create.mockResolvedValue({});
      prisma.feedConsumption.findMany.mockResolvedValue(['mockWater']);

      const result = await service.addFeedRecord(waterDto, userId);

      expect(prisma.feedConsumption.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            feedName: 'Water',
            unit: 'Litres',
          }),
        }),
      );

      expect(result).toEqual({
        message: 'New water consumption record added successfully!',
        allRecords: ['mockWater'],
      });
    });

    it('should throw NotFoundException if cattle not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.addFeedRecord(dto, userId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException if feed stock not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.feedStock.findFirst.mockResolvedValue(null);
      await expect(service.addFeedRecord(dto, userId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if quantity exceeds feed stock', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.feedStock.findFirst.mockResolvedValue({
        id: 1,
        name: dto.feedName,
        quantity: '5',
        unit: SelectedUnit.KG,
      });
      await expect(service.addFeedRecord(dto, userId)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('gettingAllFeedRecords', () => {
    it('should retrieve feed records with default params', async () => {
      prisma.feedConsumption.count.mockResolvedValue(5);
      prisma.feedConsumption.findMany.mockResolvedValue([{ id: 1, feedName: 'Green Fodder', cattle: { cattleName: 'Kaveri-02', type: CattleType.COW, image1: '' }, quantity: 10, unit: SelectedUnit.KG, session: SelectedSession.MORNING, date: new Date() }]);

      const result = await service.gettingAllFeedRecords(1, '', [], '', '', '');

      expect(result).toBeDefined();
      expect(result?.message).toBe('Showing initial fetched data');
      expect(result?.feedManagementOverview.totalCount).toBe(5);
      expect(prisma.feedConsumption.count).toHaveBeenCalled();
      expect(prisma.feedConsumption.findMany).toHaveBeenCalled();
    });

    it('should handle search parameter correctly', async () => {
      prisma.feedConsumption.count.mockResolvedValue(3);
      prisma.feedConsumption.findMany.mockResolvedValue([{ id: 2, feedName: 'Food', cattle: { cattleName: 'Kaveri-02', type: CattleType.COW, image1: '' }, quantity: 5, unit: SelectedUnit.KG, session: SelectedSession.AFTERNOON, date: new Date() }]);

      const result = await service.gettingAllFeedRecords(1, '', [], 'morning', '', '');

      expect(result?.message.toLowerCase()).toContain('morning');
    });

    it('should handle filter parameters correctly', async () => {
      prisma.feedConsumption.count.mockResolvedValue(2);
      prisma.feedConsumption.findMany.mockResolvedValue([{ id: 3, feedName: 'Hay', cattle: { cattleName: 'Kaveri-03', type: CattleType.BUFFALO, image1: '' }, quantity: 3, unit: SelectedUnit.KG, session: SelectedSession.EVENING, date: new Date() }]);

      const filter = [SelectedSession.MORNING, SelectedUnit.KG, CattleType.COW, 'Hay'];
      const result = await service.gettingAllFeedRecords(1, '', filter, '', '', '');

      expect(result?.message.toLowerCase()).toContain('filtered');
    });

    it('should handle date range filter correctly', async () => {
      prisma.feedConsumption.count.mockResolvedValue(1);
      prisma.feedConsumption.findMany.mockResolvedValue([{ id: 4, feedName: 'Oats', cattle: { cattleName: 'Kaveri-04', type: CattleType.GOAT, image1: '' }, quantity: 8, unit: SelectedUnit.KG, session: SelectedSession.AFTERNOON, date: new Date() }]);

      const result = await service.gettingAllFeedRecords(1, '', [], '', '2023-01-01', '2023-01-10');

      expect(result?.message).toContain('2023-01-01 to 2023-01-10');
    });

    it('should sort records correctly', async () => {
      prisma.feedConsumption.count.mockResolvedValue(1);
      prisma.feedConsumption.findMany.mockResolvedValue([{ id: 5, feedName: 'Barley', cattle: { cattleName: 'Kaveri-05', type: CattleType.COW, image1: '' }, quantity: 6, unit: SelectedUnit.KG, session: SelectedSession.MORNING, date: new Date() }]);

      const result = await service.gettingAllFeedRecords(1, 'name-asc', [], '', '', '');

      expect(result?.message).toContain('name-asc');
    });

    it('should throw BadRequestException on invalid sortBy', async () => {
      await expect(service.gettingAllFeedRecords(1, 'invalid-sort', [], '', '', '')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('gettingParticularAnimalFeedRecords', () => {
    it('should return feed records and averages for cattle', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: 'Kaveri-02', type: CattleType.COW, image1: 'img1', image2: 'img2', active: true });
      prisma.feedConsumption.findMany.mockResolvedValue([{ id: 1, quantity: 10 }]);
      prisma.feedConsumption.aggregate.mockResolvedValueOnce({ _avg: { quantity: 5 } }); // avgWaterConsumption
      prisma.feedConsumption.aggregate.mockResolvedValueOnce({ _avg: { quantity: 8 } }); // avgFeedConsumption

      const result = await service.gettingParticularAnimalFeedRecords('Kaveri-02');

      expect(result).toBeDefined();
      expect(result?.message).toContain('Kaveri-02');
      expect(result?.specificCattleDetials.avgWaterConsumption).toBe(5);
      expect(result?.specificCattleDetials.avgFeedConsumption).toBe(8);
    });

    it('should throw NotFoundException if cattle not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.gettingParticularAnimalFeedRecords('Unknown')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('editParticularFeedRecord', () => {
    const id = 42;
    const dto: ConsumedFeedDto = {
      type: CattleType.COW,
      cattleName: 'Kaveri-02',
      feedType: FeedType.FEED,
      feedName: 'Green Fodder',
      date: new Date().toISOString(),
      session: SelectedSession.MORNING,
      quantity: '10.00',
    };

    it('should throw NotFoundException if record not found', async () => {
      prisma.feedConsumption.findFirst.mockResolvedValue(null);
      await expect(service.editParticularFeedRecord(id, dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if cattle name mismatch', async () => {
      prisma.feedConsumption.findFirst.mockResolvedValue({ cattleName: 'Other' });
      await expect(service.editParticularFeedRecord(id, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException if cattle to update not found', async () => {
      prisma.feedConsumption.findFirst.mockResolvedValue({ id, cattleName: dto.cattleName });
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.editParticularFeedRecord(id, dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should update water consumption record successfully', async () => {
      prisma.feedConsumption.findFirst.mockResolvedValue({ id, cattleName: dto.cattleName, feedName: 'Water', createdAt: new Date() });
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.feedConsumption.update.mockResolvedValue({});
      prisma.feedConsumption.findMany.mockResolvedValue([]);
      prisma.feedConsumption.aggregate.mockResolvedValueOnce({ _avg: { quantity: 8 } });
      prisma.feedConsumption.aggregate.mockResolvedValueOnce({ _avg: { quantity: 5 } });

      const waterDto = { ...dto, feedName: 'Water' };
      const result = await service.editParticularFeedRecord(id, waterDto);

      expect(result?.message).toContain('Water consumption record updated successfully!');
    });

    it('should throw NotFoundException if feed stock not found (non-water)', async () => {
      prisma.feedConsumption.findFirst.mockResolvedValue({ id, cattleName: dto.cattleName, feedName: 'Green Fodder', quantity: '5', createdAt: new Date() });
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.feedStock.findFirst.mockResolvedValue(null);

      await expect(service.editParticularFeedRecord(id, dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if quantity invalid (non-water)', async () => {
      prisma.feedConsumption.findFirst.mockResolvedValue({ id, cattleName: dto.cattleName, feedName: 'Green Fodder', quantity: '5', createdAt: new Date() });
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.feedStock.findFirst.mockResolvedValue({ id: 1, quantity: '0', unit: SelectedUnit.KG });

      const badQtyDto = { ...dto, quantity: '10' };
      await expect(service.editParticularFeedRecord(id, badQtyDto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should update non-water feed record successfully', async () => {
      prisma.feedConsumption.findFirst.mockResolvedValue({ id, cattleName: dto.cattleName, feedName: 'Green Fodder', quantity: '4', createdAt: new Date() });
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.feedStock.findFirst.mockResolvedValue({ id: 1, quantity: '20', unit: SelectedUnit.KG });
      prisma.feedConsumption.update.mockResolvedValue({});
      prisma.feedStock.update.mockResolvedValue({});
      prisma.feedStockHistory.findFirst.mockResolvedValue({ id: 444 });
      prisma.feedStockHistory.update.mockResolvedValue({});
      prisma.feedConsumption.findMany.mockResolvedValue([]);
      prisma.feedConsumption.aggregate.mockResolvedValueOnce({ _avg: { quantity: 5 } });
      prisma.feedConsumption.aggregate.mockResolvedValueOnce({ _avg: { quantity: 7 } });

      const result = await service.editParticularFeedRecord(id, dto);

      expect(result?.message).toContain('feed consumption record updated successfully!');
    });
  });

  describe('deleteParticularFeedRecord', () => {
    const id = 99;

    it('should throw NotFoundException if record not found', async () => {
      prisma.feedConsumption.findFirst.mockResolvedValue(null);
      await expect(service.deleteParticularFeedRecord(id)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should delete water feed record and return updated data', async () => {
      const record = { id, feedType: FeedType.WATER, cattleName: 'Kaveri-02' };
      prisma.feedConsumption.findFirst.mockResolvedValue(record);
      prisma.feedConsumption.delete.mockResolvedValue({});
      prisma.feedConsumption.findMany.mockResolvedValue(['rec1']);
      prisma.feedConsumption.aggregate.mockResolvedValue({ _avg: { quantity: 5 } });
      // We mock aggregate twice for water and feed averages
      prisma.feedConsumption.aggregate.mockResolvedValue({ _avg: { quantity: 3 } });

      const result = await service.deleteParticularFeedRecord(id);

      expect(result?.message).toContain('Water record deleted successfully');
      expect(prisma.feedConsumption.delete).toHaveBeenCalledTimes(1);
      expect(prisma.feedConsumption.findMany).toHaveBeenCalled();
    });

    it('should delete non-water feed record and update stock and history', async () => {
      const createdAt = new Date();
      const record = {
        id,
        feedType: FeedType.FEED,
        cattleName: 'Kaveri-02',
        feedName: 'Green Fodder',
        quantity: '5',
        createdAt,
      };
      prisma.feedConsumption.findFirst.mockResolvedValue(record);
      prisma.feedConsumption.delete.mockResolvedValue({});
      prisma.feedStock.findFirst.mockResolvedValue({ id: 7, quantity: '10' });
      prisma.feedStock.update.mockResolvedValue({});
      prisma.feedStockHistory.findFirst.mockResolvedValue({ id: 888 });
      prisma.feedStockHistory.delete.mockResolvedValue({});
      prisma.feedConsumption.findMany.mockResolvedValue(['rec2']);
      prisma.feedConsumption.aggregate.mockResolvedValue({ _avg: { quantity: 2 } });
      prisma.feedConsumption.aggregate.mockResolvedValue({ _avg: { quantity: 1 } });

      const result = await service.deleteParticularFeedRecord(id);

      expect(result?.message).toContain('Feed record deleted successfully!');
      expect(prisma.feedConsumption.delete).toHaveBeenCalledTimes(1);
      expect(prisma.feedStock.update).toHaveBeenCalledTimes(1);
      expect(prisma.feedStockHistory.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFeedRecordsForSpecificDate', () => {
    it('should return feed records for specific date range', async () => {
      prisma.feedConsumption.findMany.mockResolvedValue(['dateRec']);
      const result = await service.getFeedRecordsForSpecificDate('Kaveri-02', '2023-01-01', '2023-01-31');

      expect(result?.message).toContain('Showing all milk records');
      expect(result?.allRecords).toEqual(['dateRec']);
      expect(prisma.feedConsumption.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
