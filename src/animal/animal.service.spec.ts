import { Test, TestingModule } from '@nestjs/testing';
import { AnimalService } from './animal.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddAnimalDto } from './dto/add-animal.dto';
import { EditAnimalDto } from './dto/edit-animal.dto';
import { AddNewCalfDto } from './dto/add-calf.dto';
import * as blob from '@vercel/blob';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(() => Promise.resolve({ url: 'http://fakeurl.com/image.jpg' })),
}));

jest.mock('../common/send-credentails', () => ({
  sendCredentials: jest.fn(),
}));

describe('AnimalService', () => {
  let service: AnimalService;
  let prisma: any;
  let configService: any;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
  });

  beforeEach(async () => {
    const mockPrisma = {
      cattle: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      milk: {
        aggregate: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      vaccination: { findMany: jest.fn() },
      feedConsumption: {
        aggregate: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      calf: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      checkup: { findMany: jest.fn(), count: jest.fn() },
      feedStock: { findMany: jest.fn() },
      $transaction: jest.fn(),
      module: { findUnique: jest.fn() },
    };

    configService = { get: jest.fn().mockReturnValue('fake-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AnimalService>(AnimalService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  // 1. addAnimal
  describe('addAnimal', () => {
    const dto: AddAnimalDto = {
      cattleName: 'TestCattle',
      healthStatus: 'HEALTHY',
      type: 'COW',
      weight: '150',
      snf: '8.5',
      images: {},
      fatherInsemination: 'NATURAL_SERVICE',
      parent: 'FARM_OWNED',
      breed: 'KARAMPASU',
      birthDate: new Date().toISOString(),
      farmEntry: new Date().toISOString(),
      purchaseAmount: '1000',
      vendorName: 'VendorA',
    };
    const file = { originalname: 'img.jpg', buffer: Buffer.from('') } as any;

    it('should successfully add animal', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      prisma.cattle.create.mockResolvedValue({});
      const res = await service.addAnimal(dto, file, file, 1);
      expect(blob.put).toHaveBeenCalledTimes(2);
      expect(res).toEqual({ message: 'New animal added successfully!' });
    });

    it('should throw on duplicate cattleName', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ id: 1 });
      await expect(service.addAnimal(dto, file, file, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 2. gettingAllCattles
  describe('gettingAllCattles', () => {
    it('should retrieve cattle list with filters and pagination', async () => {
      prisma.cattle.count.mockResolvedValue(2);
      prisma.cattle.findMany.mockResolvedValue([
        { cattleName: 'A' },
        { cattleName: 'B' },
      ]);
      prisma.milk.aggregate.mockResolvedValue({
        _avg: { morningMilk: 1, afternoonMilk: 1, eveningMilk: 1 },
      });
      const res = await service.gettingAllCattles(
        1,
        'newest',
        ['COW', 'KARAMPASU'],
        '2023-01-01',
        '2023-01-31',
      );
      expect(res?.allCattles.length).toBe(2);
      expect(res?.message).toMatch(/data/i);
    });

    it('should throw on invalid sort option', async () => {
      await expect(
        service.gettingAllCattles(1, 'invalid-sort', [], '', ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // 3. showingParticularAnimal
  describe('showingParticularAnimal', () => {
    it('returns full animal details', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: 'TestCattle' });
      prisma.milk.aggregate.mockResolvedValue({
        _avg: { morningMilk: 5, afternoonMilk: 5, eveningMilk: 5 },
      });
      prisma.vaccination.findMany.mockResolvedValue([{ date: new Date() }]);
      prisma.feedConsumption.aggregate.mockResolvedValue({
        _avg: { quantity: 10 },
      });
      prisma.calf.count.mockResolvedValue(3);
      const res = await service.showingParticularAnimal('TestCattle');
      expect(res?.animalDetails.calfCount).toBe(3);
      expect(res?.message).toContain('TestCattle');
    });

    it('should throw if not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(
        service.showingParticularAnimal('Nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // 4. updateParticularAnimalDetails
  describe('updateParticularAnimalDetails', () => {
    const dto: EditAnimalDto = {
      cattleName: 'TestCattle',
      healthStatus: 'INJURED',
      type: 'BUFFALO',
      weight: '180',
      snf: '8',
      fatherInsemination: 'NATURAL_SERVICE',
      parent: 'FARM_OWNED',
      breed: 'KARAMPASU',
      birthDate: new Date().toISOString(),
      farmEntry: new Date().toISOString(),
      purchaseAmount: '2000',
      vendorName: 'VendorB',
    };

    it('updates the animal', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ id: 1 });
      prisma.cattle.update.mockResolvedValue({});
      prisma.cattle.findFirst.mockResolvedValue(dto);
      const res = await service.updateParticularAnimalDetails(1, dto);
      expect(res?.message).toContain('successfully');
      expect(res?.cattleDetails).toBeDefined();
    });

    it('throws if animal not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(
        service.updateParticularAnimalDetails(999, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // 5. deleteParticularAnimal
  describe('deleteParticularAnimal', () => {
    it('deletes existing animal', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ id: 1 });
      prisma.cattle.delete.mockResolvedValue({});
      const res = await service.deleteParticularAnimal(1);
      expect(res?.message).toContain('successfully');
    });

    it('throws if animal does not exist', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.deleteParticularAnimal(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 6. gettingAllCattleIds
  describe('gettingAllCattleIds', () => {
    it('returns list of active cattle IDs', async () => {
      prisma.cattle.findMany.mockResolvedValue([
        { cattleName: 'C1' },
        { cattleName: 'C2' },
      ]);
      const res = await service.gettingAllCattleIds();
      expect(res?.allCattlesIds.length).toBe(2);
    });
  });

  // 7. getFeedHistory
  describe('getFeedHistory', () => {
    it('returns feed history with pagination', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: 'FeedCattle' });
      prisma.feedConsumption.count.mockResolvedValue(5);
      prisma.feedConsumption.findMany.mockResolvedValue([{ id: 1 }]);
      const res = await service.getFeedHistory('FeedCattle', 1);
      expect(res?.feedHistoryOverview.totalCount).toBe(5);
    });

    it('throws if cattle not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.getFeedHistory('NoFeed', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 8. milkProductionHistory
  describe('milkProductionHistory', () => {
    it('returns milk production history', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: 'MilkCattle' });
      prisma.milk.count.mockResolvedValue(7);
      prisma.milk.findMany.mockResolvedValue([{ id: 1 }]);
      const res = await service.milkProductionHistory('MilkCattle', 1);
      expect(res?.milkHistoryOverview.totalCount).toBe(7);
    });

    it('throws when cattle not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.milkProductionHistory('NoMilk', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 9. getCheckupHistory
  describe('getCheckupHistory', () => {
    it('returns checkup history overview', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: 'CheckCattle' });
      prisma.checkup.count.mockResolvedValue(3);
      prisma.checkup.findMany.mockResolvedValue([{ id: 1 }]);
      const res = await service.getCheckupHistory('CheckCattle', 1);
      expect(res?.checkupHistoryOverview.totalCount).toBe(3);
    });

    it('throws if no such cattle', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.getCheckupHistory('NoCheck', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // 10. getDataForDashboardTopSection
  describe('getDataForDashboardTopSection', () => {
    it('returns dashboard data for valid queries including date range', async () => {
      prisma.milk.aggregate.mockResolvedValue({
        _sum: { morningMilk: 10, afternoonMilk: 10, eveningMilk: 10 },
      });
      prisma.cattle.count.mockResolvedValue(10);
      prisma.checkup.count.mockResolvedValue(5);
      prisma.feedStock.findMany.mockResolvedValue([{ id: 1 }]);

      // Queries with explicit date range (message contains dates)
      const fromDate = '2022-01-01';
      const toDate = '2022-01-31';

      for (const q of ['Week', 'Month', 'Quarter', 'Year']) {
        const res = await service.getDataForDashboardTopSection(
          q,
          fromDate,
          toDate,
        );
        expect(res?.cards.length).toBe(5);
        // For date range, message contains dates, not period string
        expect(res?.message).toContain(`${fromDate} to ${toDate}`);
      }

      // Without date range, message contains period like 'Week'
      for (const q of ['Week', 'Month', 'Quarter', 'Year']) {
        const res = await service.getDataForDashboardTopSection(q, '', '');
        expect(res?.cards.length).toBe(5);
        expect(res?.message).toContain(q);
      }
    });

    it('throws for invalid query', async () => {
      await expect(
        service.getDataForDashboardTopSection('Invalid', '', ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // 11. getHealthRecordsForDashboard
  describe('getHealthRecordsForDashboard', () => {
    it('returns health records', async () => {
      prisma.checkup.findMany.mockResolvedValue([{ id: 1 }]);
      const res = await service.getHealthRecordsForDashboard();
      expect(res?.healthRecords).toHaveLength(1);
    });
  });

  // 12. getHealthRecordsForDashboardGraph
  describe('getHealthRecordsForDashboardGraph', () => {
    it('returns counts for different queries', async () => {
      prisma.checkup.count.mockResolvedValue(5);
      const queries = ['Week', 'Month', 'Quarter', 'Year'];
      for (const q of queries) {
        const res = await service.getHealthRecordsForDashboardGraph(q);
        expect(res?.totalCheckupCounts).toBeDefined();
      }
    });

    it('throws on invalid query', async () => {
      await expect(
        service.getHealthRecordsForDashboardGraph('Invalid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // 13. getDashboardFeedStockRecords
  describe('getDashboardFeedStockRecords', () => {
    it('returns feed stock records', async () => {
      prisma.feedStock.findMany.mockResolvedValue([{ id: 1 }]);
      const queries = ['Week', 'Month', 'Quarter', 'Year'];
      for (const q of queries) {
        const res = await service.getDashboardFeedStockRecords(q);
        expect(res?.totalFeedRecords).toBeDefined();
      }
    });

    it('throws on invalid feed stock query', async () => {
      await expect(
        service.getDashboardFeedStockRecords('Invalid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // 14. addNewCalf
  describe('addNewCalf', () => {
    const calfDto: AddNewCalfDto = {
      cattleName: 'TestCattle',
      calfId: 'C-101',
      birthDate: new Date().toISOString(),
      gender: 'FEMALE',
      healthStatus: 'HEALTHY',
      weight: '30',
    };

    it('successfully adds calf', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: 'TestCattle' });
      prisma.calf.create.mockResolvedValue({});
      prisma.calf.findMany.mockResolvedValue([calfDto]);
      const result = await service.addNewCalf(calfDto as any);
      expect(result?.message).toMatch(/success/i);
    });

    it('returns undefined if cattle not found when adding calf', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      const result = await service.addNewCalf(calfDto as any);
      expect(result).toBeUndefined();
    });
  });

  // 15. allCalfDetails
  describe('allCalfDetails', () => {
    it('returns all calf details', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: 'TestCattle' });
      prisma.calf.findMany.mockResolvedValue([]);
      const res = await service.allCalfDetails('TestCattle');
      expect(res?.allCalfs).toBeDefined();
    });

    it('throws if bad cattle name', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.allCalfDetails('BadName')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // 16. generateCattleId
  // 16. generateCattleId
  describe('generateCattleId', () => {
    it('returns new cattle ID string based on last cattleName', async () => {
      prisma.cattle.findFirst.mockResolvedValue({
        cattleName: 'cow-41',
      });

      const res = await service.generateCattleId('Cow');
      expect(res?.cattleId).toBe('cow-42');
      expect(res?.message).toContain('generated');
    });

    it('returns cow-1 if no previous cattle is found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);

      const res = await service.generateCattleId('Cow');
      expect(res?.cattleId).toBe('cow-1');
      expect(res?.message).toContain('generated');
    });

    it('handles cattleName not having "-" gracefully', async () => {
      prisma.cattle.findFirst.mockResolvedValue({
        cattleName: 'cow',
      });

      const res = await service.generateCattleId('Cow');
      expect(res?.cattleId).toBe('cow-1');
      expect(res?.message).toContain('generated');
    });
  });

  // 17. generateCalfId
  describe('generateCalfId', () => {
    it('returns new calf ID string', async () => {
      prisma.calf.count.mockResolvedValue(15);
      const res = await service.generateCalfId('Cow');
      expect(res?.calfId).toBe('c-15');
      expect(res?.message).toContain('generated');
    });
  });
});
