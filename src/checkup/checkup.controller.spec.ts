import { Test, TestingModule } from '@nestjs/testing';
import { CheckupController } from './checkup.controller';
import { CheckupService } from './checkup.service';
import { CreateCheckupDto } from './dto/add-checkup.dto';
import { EditCheckupDto } from './dto/edit-checkup.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

describe('CheckupController', () => {
  let controller: CheckupController;
  let service: CheckupService;

  const mockService = {
    addNewCheckup: jest.fn(),
    fetchingAllCheckups: jest.fn(),
    gettingParticularAnimalCheckups: jest.fn(),
    editParticularCheckupRecord: jest.fn(),
    deleteParticularCheckupRecord: jest.fn(),
    checkupDashboard: jest.fn(),
    getCheckupRecordsForSpecificDate: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(() => {
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckupController],
      providers: [{ provide: CheckupService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<CheckupController>(CheckupController);
    service = module.get<CheckupService>(CheckupService);
    jest.clearAllMocks();
  });

  describe('addNewDoctorCheckup', () => {
    it('should call service.addNewCheckup and return its result', async () => {
      const dto: CreateCheckupDto = {
        date: new Date().toISOString(),
        prescription: 'Prescription data',
        description: 'Description data',
        type: 'COW',
        doctorName: 'Dr. Smith',
        doctorPhone: '1234567890',
        cattleName: 'Kaveri-01',
      };
      const mockResult = { message: 'success' };
      mockService.addNewCheckup.mockResolvedValue(mockResult);

      const result = await controller.addNewDoctorCheckup(dto);

      expect(mockService.addNewCheckup).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingAllDoctorCheckupReports', () => {
    it('should normalize filter and call service.fetchingAllCheckups with correct params', async () => {
      const page = 1;
      const sortBy = 'newest';
      const filter = ['COW', 'BUFFALO'];
      const search = 'some search';
      const fromDate = '2025-06-01';
      const toDate = '2025-06-12';

      const mockResult = { message: 'records' };
      mockService.fetchingAllCheckups.mockResolvedValue(mockResult);

      const result = await controller.gettingAllDoctorCheckupReports(
        page,
        sortBy,
        filter,
        search,
        fromDate,
        toDate,
      );

      expect(mockService.fetchingAllCheckups).toHaveBeenCalledWith(
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

      const mockResult = { message: 'records' };
      mockService.fetchingAllCheckups.mockResolvedValue(mockResult);

      const result = await controller.gettingAllDoctorCheckupReports(
        page,
        sortBy,
        filter,
        search,
        fromDate,
        toDate,
      );

      expect(mockService.fetchingAllCheckups).toHaveBeenCalledWith(
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

  describe('gettingParticularAnimalCheckupReports', () => {
    it('should call service.gettingParticularAnimalCheckups and return result', async () => {
      const cattleName = 'Kaveri-02';
      const mockResult = { message: 'animal records' };
      mockService.gettingParticularAnimalCheckups.mockResolvedValue(mockResult);

      const result = await controller.gettingParticularAnimalCheckupReports(cattleName);

      expect(mockService.gettingParticularAnimalCheckups).toHaveBeenCalledWith(cattleName);
      expect(result).toBe(mockResult);
    });
  });

  describe('updateSpecificCheckupReport', () => {
    it('should call service.editParticularCheckupRecord and return result', async () => {
      const id = 5;
      const dto: EditCheckupDto = {
        date: new Date().toISOString(),
        prescription: 'Updated prescription',
        description: 'Updated description',
      };
      const mockResult = { message: 'updated' };
      mockService.editParticularCheckupRecord.mockResolvedValue(mockResult);

      const result = await controller.updateSpecificCheckupReport(id, dto);

      expect(mockService.editParticularCheckupRecord).toHaveBeenCalledWith(id, dto);
      expect(result).toBe(mockResult);
    });
  });

  describe('deleteSpecificRecord', () => {
    it('should call service.deleteParticularCheckupRecord and return result', async () => {
      const id = 10;
      const mockResult = { message: 'deleted' };
      mockService.deleteParticularCheckupRecord.mockResolvedValue(mockResult);

      const result = await controller.deleteSpecificRecord(id);

      expect(mockService.deleteParticularCheckupRecord).toHaveBeenCalledWith(id);
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingDateBasedMilkRecords', () => {
    it('should call service.checkupDashboard with fromDate and toDate and return result', async () => {
      const fromDate = '2025-06-12';
      const toDate = '2025-06-15';
      const mockResult = { message: 'dashboard data' };
      mockService.checkupDashboard.mockResolvedValue(mockResult);

      const result = await controller.gettingDateBasedMilkRecords(fromDate, toDate);

      expect(mockService.checkupDashboard).toHaveBeenCalledWith(fromDate, toDate);
      expect(result).toBe(mockResult);
    });
  });

  describe('gettingDateBasedCheckupRecords', () => {
    it('should call service.getCheckupRecordsForSpecificDate and return result', async () => {
      const cattleName = 'Kaveri-001';
      const fromDate = '2025-06-12';
      const toDate = '2025-06-15';
      const mockResult = { message: 'checkup records' };
      mockService.getCheckupRecordsForSpecificDate.mockResolvedValue(mockResult);

      const result = await controller.gettingDateBasedCheckupRecords(cattleName, fromDate, toDate);

      expect(mockService.getCheckupRecordsForSpecificDate).toHaveBeenCalledWith(
        cattleName,
        fromDate,
        toDate,
      );
      expect(result).toBe(mockResult);
    });
  });
});
