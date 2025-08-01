import { Test, TestingModule } from '@nestjs/testing';
import { MilkController } from './milk.controller';
import { MilkService } from './milk.service';
import { AddMilkRecordDto } from './dto/add-milk-record.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';

describe('MilkController', () => {
  let controller: MilkController;
  let milkService: jest.Mocked<MilkService>;

  const mockMilkService = {
    addNewMilkRecord: jest.fn(),
    gettingAllMilkRecords: jest.fn(),
    gettingParticularAnimalMilkRecords: jest.fn(),
    updateParticularMilkRecord: jest.fn(),
    deleteParticularAnimalMilkRecords: jest.fn(),
    dashboardData: jest.fn(),
    getMilkRecordsForSpecificDate: jest.fn(),
    getMonthlyMilkProductionTable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilkController],
      providers: [
        {
          provide: MilkService,
          useValue: mockMilkService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MilkController>(MilkController);
    milkService = module.get(MilkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addNewMilkRecord', () => {
    it('should call milkService.addNewMilkRecord with correct args', async () => {
      const dto: AddMilkRecordDto = {
        cattleId: 'Kaveri-003',
        date: '2025-08-01',
        morningMilk: '10',
        afternoonMilk: '5',
        eveningMilk: '3',
        milkGrade: 'A1',
      };
      const req = { user: { id: 1 } };

      await controller.addNewMilkRecord(dto, req);

      expect(milkService.addNewMilkRecord).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('gettingAllMilkRecords', () => {
    it('should normalize filter and call milkService.gettingAllMilkRecords', async () => {
      await controller.gettingAllMilkRecords(
        1,
        'newest',
        'COW',
        'Kaveri',
        '2025-08-01',
        '2025-08-02'
      );
      expect(milkService.gettingAllMilkRecords).toHaveBeenCalledWith(
        1,
        'newest',
        ['COW'],
        'Kaveri',
        '2025-08-01',
        '2025-08-02'
      );
    });
  });

  describe('gettingSpecificAnimalRecords', () => {
    it('should call service for valid cattle name', async () => {
      await controller.gettingSpecificAnimalRecords('Kaveri-01');
      expect(
        milkService.gettingParticularAnimalMilkRecords
      ).toHaveBeenCalledWith('Kaveri-01');
    });

    it('should throw BadRequestException for invalid cattle name', async () => {
      await expect(
        controller.gettingSpecificAnimalRecords('invalidName')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateMilkRecord', () => {
    it('should call milkService.updateParticularMilkRecord', async () => {
      const dto: AddMilkRecordDto = {
        cattleId: 'Kaveri-003',
        date: '2025-08-01',
        morningMilk: '10',
        afternoonMilk: '5',
        eveningMilk: '3',
        milkGrade: 'A2',
      };

      await controller.updateMilkRecord(1, dto);
      expect(milkService.updateParticularMilkRecord).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('delete', () => {
    it('should call milkService.deleteParticularAnimalMilkRecords', async () => {
      await controller.delete(5);
      expect(milkService.deleteParticularAnimalMilkRecords).toHaveBeenCalledWith(5);
    });
  });

  describe('gettingMilkDashboardData', () => {
    it('should call dashboardData with query params', async () => {
      await controller.gettingMilkDashboardData('Morning', '2025-07-01', '2025-07-31');
      expect(milkService.dashboardData).toHaveBeenCalledWith('Morning', '2025-07-01', '2025-07-31');
    });
  });

  describe('gettingDateBasedMilkRecords', () => {
    it('should call getMilkRecordsForSpecificDate', async () => {
      await controller.gettingDateBasedMilkRecords('Kaveri-002', '2025-07-01', '2025-07-31');
      expect(milkService.getMilkRecordsForSpecificDate).toHaveBeenCalledWith(
        'Kaveri-002',
        '2025-07-01',
        '2025-07-31'
      );
    });
  });

  describe('getAllRecordsBasedOnMonth', () => {
    it('should call getMonthlyMilkProductionTable with session', async () => {
      await controller.getAllRecordsBasedOnMonth('Overall');
      expect(milkService.getMonthlyMilkProductionTable).toHaveBeenCalledWith('Overall');
    });
  });
});
