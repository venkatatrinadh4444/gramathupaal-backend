import { Test, TestingModule } from '@nestjs/testing';
import { AnimalController } from './animal.controller';
import { AnimalService } from './animal.service';
import { BadRequestException } from '@nestjs/common';
import {
  CattleBreed,
  CattleType,
  HealthStatus,
  InseminationType,
  ParentOrigin,
  SelectGender,
} from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifySuperAdmin } from '../common/guards/verify-super-admin.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';


describe('AnimalController', () => {
  let controller: AnimalController;
  let service: AnimalService;

  const validAddAnimalDto = {
    cattleName: 'Kaveri-001',
    healthStatus: HealthStatus.HEALTHY,
    type: CattleType.COW,
    weight: '150',
    snf: '8.5',
    images: {},
    fatherInsemination: InseminationType.NATURAL_SERVICE,
    parent: ParentOrigin.FARM_OWNED,
    breed: CattleBreed.KARAMPASU,
    birthDate: new Date().toISOString(),
    farmEntry: new Date().toISOString(),
    purchaseAmount: '1000',
    vendorName: 'VendorA',
  };

  const validEditAnimalDto = {
    cattleName: 'Kaveri-002',
    healthStatus: HealthStatus.INJURED,
    type: CattleType.BUFFALO,
    weight: '180',
    snf: '8.7',
    fatherInsemination: InseminationType.ARTIFICIAL_INSEMINATION,
    parent: ParentOrigin.FARM_BORN,
    breed: CattleBreed.KANGAYAM,
    birthDate: new Date().toISOString(),
    farmEntry: new Date().toISOString(),
    purchaseAmount: '1500',
    vendorName: 'VendorB',
  };

  const validAddNewCalfDto = {
    cattleName: 'Kaveri-001',
    calfId: 'C-101',
    birthDate: new Date().toISOString(),
    gender: SelectGender.FEMALE,
    healthStatus: HealthStatus.HEALTHY,
    weight: '30',
  };

  const mockImages = [
    { originalname: 'img1.jpg', buffer: Buffer.from('') },
    { originalname: 'img2.jpg', buffer: Buffer.from('') },
  ];

  const mockReq = { user: { id: 1 } };

  const mockService = {
    addAnimal: jest.fn(),
    gettingAllCattles: jest.fn(),
    showingParticularAnimal: jest.fn(),
    updateParticularAnimalDetails: jest.fn(),
    deleteParticularAnimal: jest.fn(),
    gettingAllCattleIds: jest.fn(),
    getFeedHistory: jest.fn(),
    milkProductionHistory: jest.fn(),
    getCheckupHistory: jest.fn(),
    getDataForDashboardTopSection: jest.fn(),
    getHealthRecordsForDashboard: jest.fn(),
    getHealthRecordsForDashboardGraph: jest.fn(),
    getDashboardFeedStockRecords: jest.fn(),
    addNewCalf: jest.fn(),
    allCalfDetails: jest.fn(),
    generateCattleId: jest.fn(),
    generateCalfId: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };
  const mockVerifySuperAdminGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnimalController],
      providers: [{ provide: AnimalService, useValue: mockService }, Reflector],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(VerifySuperAdmin)
      .useValue(mockVerifySuperAdminGuard)
      .compile();

    controller = module.get<AnimalController>(AnimalController);
    service = module.get<AnimalService>(AnimalService);
    jest.clearAllMocks();
  });

  describe('addAnimal', () => {
    it('calls addAnimal with valid data and images', async () => {
      mockService.addAnimal.mockResolvedValue('success');
      const result = await controller.addAnimal(validAddAnimalDto, mockImages as any, mockReq as any);
      expect(mockService.addAnimal).toHaveBeenCalledWith(validAddAnimalDto, mockImages[0], mockImages[1], mockReq.user.id);
      expect(result).toBe('success');
    });

    it('throws BadRequestException if less than 2 images', async () => {
      await expect(controller.addAnimal(validAddAnimalDto, [mockImages[0]] as any, mockReq as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('showAllCattles', () => {
    it('handles string filter by normalizing to array', async () => {
      mockService.gettingAllCattles.mockResolvedValue('data');
      const res = await controller.showAllCattles(1, 'newest', 'COW', '2023-01-01', '2023-01-31');
      expect(mockService.gettingAllCattles).toHaveBeenCalledWith(1, 'newest', ['COW'], '2023-01-01', '2023-01-31');
      expect(res).toBe('data');
    });

    it('passes array filter unchanged', async () => {
      mockService.gettingAllCattles.mockResolvedValue('data');
      const filters = ['COW', 'HEALTHY'];
      const res = await controller.showAllCattles(1, '', filters, '', '');
      expect(mockService.gettingAllCattles).toHaveBeenCalledWith(1, '', filters, '', '');
      expect(res).toBe('data');
    });
  });

  describe('showParticularCattleDetails', () => {
    it('calls service with valid cattleId', async () => {
      mockService.showingParticularAnimal.mockResolvedValue('data');
      const res = await controller.showParticularCattleDetails('Kaveri-001');
      expect(mockService.showingParticularAnimal).toHaveBeenCalledWith('Kaveri-001');
      expect(res).toBe('data');
    });

    it('throws BadRequestException for invalid cattleId', async () => {
      await expect(controller.showParticularCattleDetails('bad-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAnimal', () => {
    it('calls updateParticularAnimalDetails', async () => {
      mockService.updateParticularAnimalDetails.mockResolvedValue('updated');
      const res = await controller.updateAnimal(1, validEditAnimalDto);
      expect(mockService.updateParticularAnimalDetails).toHaveBeenCalledWith(1, validEditAnimalDto);
      expect(res).toBe('updated');
    });
  });

  describe('deleteAnimal', () => {
    it('calls deleteParticularAnimal', async () => {
      mockService.deleteParticularAnimal.mockResolvedValue('deleted');
      const res = await controller.deleteAnimal(1);
      expect(mockService.deleteParticularAnimal).toHaveBeenCalledWith(1);
      expect(res).toBe('deleted');
    });
  });

  describe('gettingAllCattleIds', () => {
    it('calls gettingAllCattleIds', async () => {
      mockService.gettingAllCattleIds.mockResolvedValue(['Kaveri-001']);
      const res = await controller.gettingAllCattleIds();
      expect(mockService.gettingAllCattleIds).toHaveBeenCalled();
      expect(res).toEqual(['Kaveri-001']);
    });
  });

  describe('getAllFeedHistory', () => {
    it('throws BadRequestException on invalid cattleName', async () => {
      await expect(controller.getAllFeedHistory('invalid', 1)).rejects.toThrow(BadRequestException);
    });

    it('calls getFeedHistory', async () => {
      mockService.getFeedHistory.mockResolvedValue('feedHistory');
      const res = await controller.getAllFeedHistory('Kaveri-01', 1);
      expect(mockService.getFeedHistory).toHaveBeenCalledWith('Kaveri-01', 1);
      expect(res).toBe('feedHistory');
    });
  });

  describe('getAllMilkHistory', () => {
    it('throws BadRequestException on invalid cattleName', async () => {
      await expect(controller.getAllMilkHistory('invalid', 1)).rejects.toThrow(BadRequestException);
    });

    it('calls milkProductionHistory', async () => {
      mockService.milkProductionHistory.mockResolvedValue('milkHistory');
      const res = await controller.getAllMilkHistory('Kaveri-01', 1);
      expect(mockService.milkProductionHistory).toHaveBeenCalledWith('Kaveri-01', 1);
      expect(res).toBe('milkHistory');
    });
  });

  describe('getAllCheckupHistory', () => {
    it('throws BadRequestException on invalid cattleName', async () => {
      await expect(controller.getAllCheckupHistory('invalid', 1)).rejects.toThrow(BadRequestException);
    });

    it('calls getCheckupHistory', async () => {
      mockService.getCheckupHistory.mockResolvedValue('checkupHistory');
      const res = await controller.getAllCheckupHistory('Kaveri-01', 1);
      expect(mockService.getCheckupHistory).toHaveBeenCalledWith('Kaveri-01', 1);
      expect(res).toBe('checkupHistory');
    });
  });

  describe('gettingDashboardTopSection', () => {
    it('throws BadRequestException if no query or dates provided', async () => {
      await expect(controller.gettingDashboardTopSection('', '', '')).rejects.toThrow(BadRequestException);
    });

    it('calls getDataForDashboardTopSection', async () => {
      mockService.getDataForDashboardTopSection.mockResolvedValue('dashboardData');
      const res = await controller.gettingDashboardTopSection('Week', '2022-01-01', '2022-01-31');
      expect(mockService.getDataForDashboardTopSection).toHaveBeenCalledWith('Week', '2022-01-01', '2022-01-31');
      expect(res).toBe('dashboardData');
    });
  });

  describe('getDashboardCheckupRecords', () => {
    it('calls getHealthRecordsForDashboard', async () => {
      mockService.getHealthRecordsForDashboard.mockResolvedValue('healthRecords');
      const res = await controller.getDashboardCheckupRecords();
      expect(mockService.getHealthRecordsForDashboard).toHaveBeenCalled();
      expect(res).toBe('healthRecords');
    });
  });

  describe('getDashboardGraphCheckupRecords', () => {
    it('calls getHealthRecordsForDashboardGraph', async () => {
      mockService.getHealthRecordsForDashboardGraph.mockResolvedValue('graphData');
      const res = await controller.getDashboardGraphCheckupRecords('Week');
      expect(mockService.getHealthRecordsForDashboardGraph).toHaveBeenCalledWith('Week');
      expect(res).toBe('graphData');
    });
  });

  describe('getDashboardFeedStockRecords', () => {
    it('calls getDashboardFeedStockRecords', async () => {
      mockService.getDashboardFeedStockRecords.mockResolvedValue('feedStock');
      const res = await controller.getDashboardFeedStockRecords('Week');
      expect(mockService.getDashboardFeedStockRecords).toHaveBeenCalledWith('Week');
      expect(res).toBe('feedStock');
    });
  });

  describe('addNewCalf', () => {
    it('calls addNewCalf', async () => {
      mockService.addNewCalf.mockResolvedValue('newCalf');
      const res = await controller.addNewCalf(validAddNewCalfDto);
      expect(mockService.addNewCalf).toHaveBeenCalledWith(validAddNewCalfDto);
      expect(res).toBe('newCalf');
    });
  });

  describe('getAllCalf', () => {
    it('throws BadRequestException on invalid cattleName', async () => {
      await expect(controller.getAllCalf('invalid')).rejects.toThrow(BadRequestException);
    });

    it('calls allCalfDetails', async () => {
      mockService.allCalfDetails.mockResolvedValue('calfs');
      const res = await controller.getAllCalf('Kaveri-01');
      expect(mockService.allCalfDetails).toHaveBeenCalledWith('Kaveri-01');
      expect(res).toBe('calfs');
    });
  });

  describe('generateCattleId', () => {
    it('calls generateCattleId', async () => {
      mockService.generateCattleId.mockResolvedValue('cattleId');
      const res = await controller.generateCattleId('COW');
      expect(mockService.generateCattleId).toHaveBeenCalledWith('COW');
      expect(res).toBe('cattleId');
    });
  });

  describe('generateCalfId', () => {
    it('calls generateCalfId', async () => {
      mockService.generateCalfId.mockResolvedValue('calfId');
      const res = await controller.generateCalfId('COW');
      expect(mockService.generateCalfId).toHaveBeenCalledWith('COW');
      expect(res).toBe('calfId');
    });
  });
});
