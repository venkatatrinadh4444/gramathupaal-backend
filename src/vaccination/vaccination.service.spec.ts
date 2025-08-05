import { Test, TestingModule } from '@nestjs/testing';
import { VaccinationService } from './vaccination.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateVaccinationDto } from './dto/add-vaccination.dto';
import { EditVaccinationDto } from './dto/edit-vaccination.dto';
import { CattleType } from '@prisma/client';

describe('VaccinationService', () => {
  let service: VaccinationService;
  let prisma: {
    cattle: { findFirst: jest.Mock };
    vaccination: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    checkup: { count: jest.Mock };
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
      cattle: { findFirst: jest.fn() },
      vaccination: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      checkup: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaccinationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VaccinationService>(VaccinationService);
    prisma = module.get<PrismaService>(PrismaService) as any;
    jest.clearAllMocks();
  });

  describe('addNewVaccination', () => {
    const dto: CreateVaccinationDto = {
      date: new Date().toISOString(),
      name: 'Brucellosis',
      notes: 'Some notes about vaccination',
      type: CattleType.COW,
      doctorName: 'Dr. Raghav',
      doctorPhone: '+911234567890',
      cattleName: 'Kaveri-02',
    };

    it('should add new vaccination record successfully', async () => {
      prisma.cattle.findFirst.mockResolvedValue({ cattleName: dto.cattleName, type: dto.type });
      prisma.vaccination.create.mockResolvedValue({});
      prisma.vaccination.findMany.mockResolvedValue(['record1', 'record2']);

      const result = await service.addNewVaccination(dto);

      expect(prisma.cattle.findFirst).toHaveBeenCalledWith({
        where: { AND: { type: dto.type, cattleName: dto.cattleName } },
      });
      expect(prisma.vaccination.create).toHaveBeenCalled();
      expect(prisma.vaccination.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'New doctor vaccination record added successfully!',
        allReports: ['record1', 'record2'],
      });
    });

    it('should throw NotFoundException if cattle not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.addNewVaccination(dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('fetchingAllVaccinationRecords', () => {
    it('should fetch all vaccination records with default paging', async () => {
      prisma.vaccination.count.mockResolvedValue(10);
      prisma.vaccination.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prisma.checkup.count.mockResolvedValue(5);

      const result = await service.fetchingAllVaccinationRecords(1, '', [], '', '', '');

      expect(prisma.vaccination.count).toHaveBeenCalled();
      expect(prisma.vaccination.findMany).toHaveBeenCalled();
      expect(prisma.checkup.count).toHaveBeenCalled();
      expect(result?.message).toMatch(/showing/i);
      expect(result?.checkupDashboard.totalRecordCount).toBe(10);
      expect(result?.checkupDashboard.allReports.length).toBe(2);
      expect(result?.checkupDashboard.totalIllnessCount).toBe(5);
    });

    it('should sort by name ascending', async () => {
      prisma.vaccination.count.mockResolvedValue(3);
      prisma.vaccination.findMany.mockResolvedValue([{ id: 3 }, { id: 4 }]);
      prisma.checkup.count.mockResolvedValue(1);

      const result = await service.fetchingAllVaccinationRecords(1, 'name-asc', [], '', '', '');

      expect(prisma.vaccination.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { cattle: { cattleName: 'asc' } } }),
      );      
      expect(result?.checkupDashboard.totalRecordCount).toBe(3);
    });

    it('should handle search parameter correctly', async () => {
      prisma.vaccination.count.mockResolvedValue(2);
      prisma.vaccination.findMany.mockResolvedValue([{ id: 10 }]);
      prisma.checkup.count.mockResolvedValue(0);

      const search = 'brucellosis';
      const result = await service.fetchingAllVaccinationRecords(1, '', [], search, '', '');

      expect(prisma.vaccination.count).toHaveBeenCalled();
      expect(prisma.vaccination.findMany).toHaveBeenCalled();
      expect(result?.message).toBe('Showing filtered vaccination records');
      expect(result?.checkupDashboard.totalRecordCount).toBe(2);
    });

    it('should filter by cattle type', async () => {
      prisma.vaccination.count.mockResolvedValue(1);
      prisma.vaccination.findMany.mockResolvedValue([{ id: 20 }]);
      prisma.checkup.count.mockResolvedValue(3);

      const filter = [CattleType.BUFFALO];
      const result = await service.fetchingAllVaccinationRecords(1, '', filter, '', '', '');

      expect(prisma.vaccination.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cattle: expect.objectContaining({ type: { in: filter } }),
          }),
        }),
      );
      expect(result?.message).toMatch(/filtered/i);
      expect(result?.checkupDashboard.totalRecordCount).toBe(1);
    });

    it('should filter by date range', async () => {
      prisma.vaccination.count.mockResolvedValue(4);
      prisma.vaccination.findMany.mockResolvedValue([{ id: 30 }, { id: 31 }]);
      prisma.checkup.count.mockResolvedValue(2);

      const fromDate = '2025-01-01';
      const toDate = '2025-01-07';
      const result = await service.fetchingAllVaccinationRecords(1, '', [], '', fromDate, toDate);

      expect(prisma.vaccination.count).toHaveBeenCalled();
      expect(prisma.vaccination.findMany).toHaveBeenCalled();
      expect(result?.message).toMatch(new RegExp(fromDate));
      expect(result?.checkupDashboard.totalRecordCount).toBe(4);
    });
  });

  describe('gettingParticularAnimalVaccinationRecords', () => {
    it('should return vaccination details for specific cattle', async () => {
      prisma.cattle.findFirst.mockResolvedValue({
        cattleName: 'Kaveri-02',
        type: CattleType.COW,
        image1: 'img1',
        image2: 'img2',
        active: true,
      });
      prisma.vaccination.findMany.mockResolvedValue([{ id: 100, date: new Date() }]);

      const result = await service.gettingParticularAnimalVaccinationRecords('Kaveri-02');

      expect(prisma.cattle.findFirst).toHaveBeenCalledWith({ where: { cattleName: 'Kaveri-02' } });
      expect(prisma.vaccination.findMany).toHaveBeenCalledWith({ where: { cattleName: 'Kaveri-02' }, orderBy: { date: 'desc' } });
      expect(result?.message).toContain('Kaveri-02');
      expect(result?.vaccinationDetails.vaccinationCount).toBe(1);
    });

    it('should throw NotFoundException if cattle not found', async () => {
      prisma.cattle.findFirst.mockResolvedValue(null);
      await expect(service.gettingParticularAnimalVaccinationRecords('Unknown')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('editParticularVaccinationRecord', () => {
    const id = 200;
    const dto: EditVaccinationDto = {
      date: new Date().toISOString(),
      name: 'Updated Name',
      notes: 'Updated notes',
    };

    it('should update vaccination record successfully', async () => {
      prisma.vaccination.findFirst.mockResolvedValue({ id });
      prisma.vaccination.update.mockResolvedValue({});
      prisma.vaccination.findMany.mockResolvedValue([{ id }]);

      const result = await service.editParticularVaccinationRecord(id, dto);

      expect(prisma.vaccination.findFirst).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.vaccination.update).toHaveBeenCalledWith({
        where: { id },
        data: { date: new Date(dto.date), name: dto.name, notes: dto.notes },
      });
      expect(result?.message).toBe('Vaccination report updated successfully!');
      expect(result?.allRecords).toHaveLength(1);
    });

    it('should throw NotFoundException if record to update not found', async () => {
      prisma.vaccination.findFirst.mockResolvedValue(null);
      await expect(service.editParticularVaccinationRecord(id, dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteParticularVaccinationRecord', () => {
    it('should delete vaccination record and return updated list', async () => {
      prisma.vaccination.findFirst.mockResolvedValue({ id: 300 });
      prisma.vaccination.delete.mockResolvedValue({});
      prisma.vaccination.findMany.mockResolvedValue([{ id: 300 }]);

      const result = await service.deleteParticularVaccinationRecord(300);

      expect(prisma.vaccination.findFirst).toHaveBeenCalledWith({ where: { id: 300 } });
      expect(prisma.vaccination.delete).toHaveBeenCalledWith({ where: { id: 300 } });
      expect(result?.message).toBe('Vaccination report deleted successfully!');
      expect(result?.allRecords).toHaveLength(1);
    });

    it('should throw NotFoundException if record to delete not found', async () => {
      prisma.vaccination.findFirst.mockResolvedValue(null);
      await expect(service.deleteParticularVaccinationRecord(9999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getVaccinationRecordsForSpecificDate', () => {
    it('should fetch vaccination records for given cattle and date range', async () => {
      const cattleName = 'Kaveri-02';
      const fromDate = '2025-06-01';
      const toDate = '2025-06-07';
      prisma.vaccination.findMany.mockResolvedValue([{ id: 400 }, { id: 401 }]);

      const result = await service.getVaccinationRecordsForSpecificDate(cattleName, fromDate, toDate);

      expect(prisma.vaccination.findMany).toHaveBeenCalledWith({
        where: {
          cattleName,
          date: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
        },
        orderBy: { date: 'desc' },
      });
      expect(result?.message).toContain('Showing all milk records');
      expect(result?.allRecords.length).toBe(2);
    });
  });
});
