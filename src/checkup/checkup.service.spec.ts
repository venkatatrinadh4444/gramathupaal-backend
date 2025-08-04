import { Test, TestingModule } from '@nestjs/testing';
import { CheckupService } from './checkup.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCheckupDto } from './dto/add-checkup.dto';
import { EditCheckupDto } from './dto/edit-checkup.dto';
import { CattleType } from '@prisma/client';

describe('CheckupService', () => {
  let service: CheckupService;
  let prisma: {
    cattle: { findFirst: jest.Mock; count: jest.Mock };
    checkup: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeAll(() => {
    // Silence console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore original console.log after tests finish
    (console.log as jest.Mock).mockRestore();
  });

  beforeEach(async () => {
    const mockPrisma = {
      cattle: { findFirst: jest.fn(), count: jest.fn() },
      checkup: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CheckupService>(CheckupService);
    prisma = module.get<PrismaService>(PrismaService) as any;
    jest.clearAllMocks();
  });

  describe('addNewCheckup', () => {
    const dto: CreateCheckupDto = {
      date: new Date().toISOString(),
      prescription: 'Amoxicillin 250mg',
      description: 'Routine check',
      type: CattleType.COW,
      doctorName: 'Dr. Raghav',
      doctorPhone: '+911234567890',
      cattleName: 'Kaveri-01',
    };

    it('should add new checkup successfully', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.checkup.create.mockResolvedValue({});
      prisma.checkup.findMany.mockResolvedValue(['record1', 'record2']);

      const result = await service.addNewCheckup(dto);

      expect(prisma.cattle.findFirst).toHaveBeenCalledWith({
        where: { AND: { type: dto.type, cattleName: dto.cattleName } },
      });
      expect(prisma.checkup.create).toHaveBeenCalled();
      expect(prisma.checkup.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'New doctor checkup added successfully!',
        allRecords: ['record1', 'record2'],
      });
    });

    it('should throw NotFoundException if cattle not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.addNewCheckup(dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('fetchingAllCheckups', () => {
    it('should fetch all checkups with default pagination and sorting', async () => {
      prisma.checkup.count.mockResolvedValue(10);
      prisma.checkup.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await service.fetchingAllCheckups(1, '', [], '', '', '');

      expect(prisma.checkup.count).toHaveBeenCalled();
      expect(prisma.checkup.findMany).toHaveBeenCalled();
      expect(result?.message).toContain('Showing');
      expect(result?.checkupOverview.totalRecordsCount).toBe(10);
      expect(result?.checkupOverview.allCheckups.length).toBe(2);
    });

    it('should throw BadRequestException for invalid sortBy', async () => {
      prisma.checkup.count.mockResolvedValue(0);
      prisma.checkup.findMany.mockResolvedValue([]);

      await expect(service.fetchingAllCheckups(1, 'invalid-sort', [], '', '', '')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should apply filter for cattle type correctly', async () => {
      prisma.checkup.count.mockResolvedValue(1);
      prisma.checkup.findMany.mockResolvedValue([{ id: 10 }]);

      const filter = [CattleType.COW];
      const result = await service.fetchingAllCheckups(1, '', filter, '', '', '');

      expect(prisma.checkup.count).toHaveBeenCalled();
      expect(prisma.checkup.findMany).toHaveBeenCalled();
      expect(result?.message).toMatch(/filtered/i);
      expect(result?.checkupOverview.totalRecordsCount).toBe(1);
    });

    it('should apply date range filter correctly', async () => {
      prisma.checkup.count.mockResolvedValue(2);
      prisma.checkup.findMany.mockResolvedValue([{ id: 20 }, { id: 21 }]);

      const fromDate = '2025-01-01';
      const toDate = '2025-01-05';

      const result = await service.fetchingAllCheckups(1, '', [], '', fromDate, toDate);

      expect(prisma.checkup.count).toHaveBeenCalled();
      expect(prisma.checkup.findMany).toHaveBeenCalled();
      expect(result?.message).toMatch(new RegExp(fromDate));
      expect(result?.checkupOverview.totalRecordsCount).toBe(2);
    });

    it('should apply search correctly', async () => {
      prisma.checkup.count.mockResolvedValue(3);
      prisma.checkup.findMany.mockResolvedValue([{ id: 30 }]);

      const search = 'cough';

      const result = await service.fetchingAllCheckups(1, '', [], search, '', '');

      expect(prisma.checkup.count).toHaveBeenCalled();
      expect(prisma.checkup.findMany).toHaveBeenCalled();
      expect(result?.message).toMatch(/searched/i);
      expect(result?.checkupOverview.totalRecordsCount).toBe(3);
    });
  });

  describe('gettingParticularAnimalCheckups', () => {
    it('should fetch specific animal checkup details', async () => {
      prisma.cattle.findFirst.mockResolvedValue({
        cattleName: 'Kaveri-01',
        type: CattleType.COW,
        image1: 'img1',
        image2: 'img2',
        active: true,
      });
      prisma.checkup.findMany.mockResolvedValue([{ id: 1, date: new Date() }]);

      const result = await service.gettingParticularAnimalCheckups('Kaveri-01');

      expect(prisma.cattle.findFirst).toHaveBeenCalledWith({ where: { cattleName: 'Kaveri-01' } });
      expect(prisma.checkup.findMany).toHaveBeenCalledWith({ where: { cattleName: 'Kaveri-01' }, orderBy: { date: 'desc' } });
      expect(result?.message).toContain('Kaveri-01');
      expect(result?.checkupDetails.checkupCount).toBe(1);
    });

    it('should throw NotFoundException if cattle not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.gettingParticularAnimalCheckups('Unknown')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('editParticularCheckupRecord', () => {
    const id = 100;
    const dto: EditCheckupDto = {
      date: new Date().toISOString(),
      prescription: 'New prescription',
      description: 'Updated description',
    };

    it('should update checkup record successfully', async () => {
      prisma.checkup.findFirst.mockResolvedValue({ id });
      prisma.checkup.update.mockResolvedValue({});
      prisma.checkup.findMany.mockResolvedValue([{ id }]);

      const result = await service.editParticularCheckupRecord(id, dto);

      expect(prisma.checkup.findFirst).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.checkup.update).toHaveBeenCalledWith({
        where: { id },
        data: { date: new Date(dto.date), prescription: dto.prescription, description: dto.description },
      });
      expect(result?.message).toBe('Checkup report updated successfully!');
      expect(result?.allRecords).toHaveLength(1);
    });

    it('should throw NotFoundException if record not found', async () => {
      prisma.checkup.findFirst.mockResolvedValue(null);
      await expect(service.editParticularCheckupRecord(id, dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteParticularCheckupRecord', () => {
    it('should delete checkup record and return updated list', async () => {
      prisma.checkup.findFirst.mockResolvedValue({ id: 50 });
      prisma.checkup.delete.mockResolvedValue({});
      prisma.checkup.findMany.mockResolvedValue([{ id: 50 }]);

      const result = await service.deleteParticularCheckupRecord(50);

      expect(prisma.checkup.findFirst).toHaveBeenCalledWith({ where: { id: 50 } });
      expect(prisma.checkup.delete).toHaveBeenCalledWith({ where: { id: 50 } });
      expect(result?.message).toBe('Checkup report deleted successfully!');
      expect(result?.allRecords).toHaveLength(1);
    });

    it('should throw NotFoundException if record not found for delete', async () => {
      prisma.checkup.findFirst.mockResolvedValue(null);
      await expect(service.deleteParticularCheckupRecord(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('checkupDashboard', () => {
    it('should return dashboard data for given date range', async () => {
      prisma.checkup.count
        .mockResolvedValueOnce(20)  // current totalCheckups
        .mockResolvedValueOnce(10); // previous totalCheckups
      prisma.cattle.count
        .mockResolvedValueOnce(4)   // current totalIllnessCases
        .mockResolvedValueOnce(2);  // previous totalIllnessCases

      const fromDate = '2025-01-01';
      const toDate = '2025-01-07';

      const result = await service.checkupDashboard(fromDate, toDate);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('cards');
      expect(result?.cards[0]).toHaveProperty('number');
      expect(result?.cards[1]).toHaveProperty('number');
    });

    it('should return dashboard data for last week when no dates provided', async () => {
      prisma.checkup.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(10);
      prisma.cattle.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(2);

      const result = await service.checkupDashboard('', '');

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('cards');
    });
  });

  describe('getCheckupRecordsForSpecificDate', () => {
    it('should fetch checkup records for the given date range', async () => {
      const cattleName = 'Kaveri-02';
      const fromDate = '2025-06-01';
      const toDate = '2025-06-07';

      prisma.checkup.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await service.getCheckupRecordsForSpecificDate(cattleName, fromDate, toDate);

      expect(prisma.checkup.findMany).toHaveBeenCalledWith({
        where: {
          cattleName,
          date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        },
        orderBy: { date: 'desc' },
      });
      expect(result?.message).toContain('Showing all milk records');
      expect(result?.allRecords.length).toBe(2);
    });
  });
});
