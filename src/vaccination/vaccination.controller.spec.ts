import { Test, TestingModule } from '@nestjs/testing';
import { VaccinationController } from './vaccination.controller';
import { VaccinationService } from './vaccination.service';
import { CreateVaccinationDto } from './dto/add-vaccination.dto';
import { EditVaccinationDto } from './dto/edit-vaccination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';

describe('VaccinationController', () => {
  let controller: VaccinationController;
  let service: VaccinationService;

  const mockService = {
    addNewVaccination: jest.fn(),
    fetchingAllVaccinationRecords: jest.fn(),
    gettingParticularAnimalVaccinationRecords: jest.fn(),
    editParticularVaccinationRecord: jest.fn(),
    deleteParticularVaccinationRecord: jest.fn(),
    getVaccinationRecordsForSpecificDate: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(() => {
    // Suppress console.log for all tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VaccinationController],
      providers: [{ provide: VaccinationService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<VaccinationController>(VaccinationController);
    service = module.get<VaccinationService>(VaccinationService);
    jest.clearAllMocks();
  });

  describe('addNewVaccinationRecord', () => {
    it('should call service.addNewVaccination and return result', async () => {
      const dto: CreateVaccinationDto = {
        date: new Date().toISOString(),
        name: 'Brucellosis',
        notes: 'Important vaccination notes',
        type: 'COW',
        doctorName: 'Dr. Raghav',
        doctorPhone: '+911234567890',
        cattleName: 'Kaveri-02',
      };
      const mockResult = { message: 'success' };
      mockService.addNewVaccination.mockResolvedValue(mockResult);

      const result = await controller.addNewVaccinationRecord(dto);

      expect(mockService.addNewVaccination).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingAllVaccinationRecords', () => {
    it('should normalize filter to array and call fetchingAllVaccinationRecords', async () => {
      const page = 1;
      const sortBy = 'newest';
      const filter = ['COW', 'BUFFALO'];
      const search = 'kaveri';
      const fromDate = '2025-06-01';
      const toDate = '2025-06-12';

      const mockResult = { message: 'list' };
      mockService.fetchingAllVaccinationRecords.mockResolvedValue(mockResult);

      const result = await controller.gettingAllVaccinationRecords(
        page,
        sortBy,
        filter,
        search,
        fromDate,
        toDate,
      );

      expect(mockService.fetchingAllVaccinationRecords).toHaveBeenCalledWith(
        page,
        sortBy,
        filter,
        search,
        fromDate,
        toDate,
      );
      expect(result).toBe(mockResult);
    });

    it('should convert single string filter to array', async () => {
      const page = 1;
      const sortBy = '';
      const filter = 'COW' as any;
      const search = '';
      const fromDate = '';
      const toDate = '';

      const mockResult = { message: 'list' };
      mockService.fetchingAllVaccinationRecords.mockResolvedValue(mockResult);

      const result = await controller.gettingAllVaccinationRecords(
        page,
        sortBy,
        filter,
        search,
        fromDate,
        toDate,
      );

      expect(mockService.fetchingAllVaccinationRecords).toHaveBeenCalledWith(
        page,
        sortBy,
        [filter],
        search,
        fromDate,
        toDate,
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingSpecificAnimalVaccinationRecords', () => {
    it('should throw BadRequestException for invalid cattleName', async () => {
      await expect(controller.gettingSpecificAnimalVaccinationRecords('invalidName')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should call service.gettingParticularAnimalVaccinationRecords and return result', async () => {
      const cattleName = 'Kaveri-03';
      const mockResult = { message: 'animal records' };
      mockService.gettingParticularAnimalVaccinationRecords.mockResolvedValue(mockResult);

      const result = await controller.gettingSpecificAnimalVaccinationRecords(cattleName);

      expect(mockService.gettingParticularAnimalVaccinationRecords).toHaveBeenCalledWith(cattleName);
      expect(result).toBe(mockResult);
    });
  });

  describe('updateVaccinationRecord', () => {
    it('should call service.editParticularVaccinationRecord and return result', async () => {
      const id = 1;
      const dto: EditVaccinationDto = {
        date: new Date().toISOString(),
        name: 'Updated vaccine name',
        notes: 'Updated notes',
      };
      const mockResult = { message: 'updated' };
      mockService.editParticularVaccinationRecord.mockResolvedValue(mockResult);

      const result = await controller.updateVaccinationRecord(id, dto);

      expect(mockService.editParticularVaccinationRecord).toHaveBeenCalledWith(id, dto);
      expect(result).toBe(mockResult);
    });
  });

  describe('deleteVaccinationRecord', () => {
    it('should call service.deleteParticularVaccinationRecord and return result', async () => {
      const id = 2;
      const mockResult = { message: 'deleted' };
      mockService.deleteParticularVaccinationRecord.mockResolvedValue(mockResult);

      const result = await controller.deleteVaccinationRecord(id);

      expect(mockService.deleteParticularVaccinationRecord).toHaveBeenCalledWith(id);
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingDateBasedCheckupRecords', () => {
    it('should call service.getVaccinationRecordsForSpecificDate and return result', async () => {
      const cattleName = 'Kaveri-001';
      const fromDate = '2025-06-12';
      const toDate = '2025-06-12';
      const mockResult = { message: 'date based records' };
      mockService.getVaccinationRecordsForSpecificDate.mockResolvedValue(mockResult);

      const result = await controller.gettingDateBasedCheckupRecords(cattleName, fromDate, toDate);

      expect(mockService.getVaccinationRecordsForSpecificDate).toHaveBeenCalledWith(
        cattleName,
        fromDate,
        toDate,
      );
      expect(result).toBe(mockResult);
    });
  });
});
