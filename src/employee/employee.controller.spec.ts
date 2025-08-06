import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RegisterEmployeeDto } from './dto/EmployeeDto';
import { AssignMultiplePermissionsDto } from './dto/AssignMultiplePermissionsDto';
import { BadRequestException } from '@nestjs/common';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  const mockService = {
    createEmployee: jest.fn(),
    createAccessForModules: jest.fn(),
    fetchingAllEmployeesBasedOnRole: jest.fn(),
    editEmployeeDetails: jest.fn(),
    deleteEmployee: jest.fn(),
    getAllRoles: jest.fn(),
    deleteRole: jest.fn(),
    fetchAllEmployees: jest.fn(),
  };

  const mockAuthGuard = { canActivate: jest.fn(() => true) };
  const mockSuperAdminGuard = { canActivate: jest.fn(() => true) };

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [{ provide: EmployeeService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockAuthGuard)
      .compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
    jest.clearAllMocks();
  });

  describe('createNewEmployee', () => {
    it('should register a new employee', async () => {
      const dto: RegisterEmployeeDto = {
        name: 'John',
        mobile: '9876543210',
        email: 'john@a.com',
        roleName: 'Manager',
        address: 'somewhere',
      };
      const mockResult = { message: 'New employee created successfully' };
      mockService.createEmployee.mockResolvedValue(mockResult);
      const res = await controller.createNewEmployee(dto);
      expect(mockService.createEmployee).toHaveBeenCalledWith(dto);
      expect(res).toBe(mockResult);
    });
  });

  describe('addPermissions', () => {
    it('should assign/update access permissions for role', async () => {
      const dto: AssignMultiplePermissionsDto = {
        roleName: 'Manager',
        permissions: [
          { moduleName: 'Feed Management', canView: true, canEdit: false, canDelete: false },
          { moduleName: 'Milk Management', canView: true, canEdit: true, canDelete: false },
        ],
      };
      const mockResult = { message: 'Permissions assigned' };
      mockService.createAccessForModules.mockResolvedValue(mockResult);

      const res = await controller.addPermissions(dto);
      expect(mockService.createAccessForModules).toHaveBeenCalledWith(dto);
      expect(res).toBe(mockResult);
    });
  });

  describe('getAllEmployees', () => {
    it('should fetch employees for a role & page', async () => {
      const role = 'Manager';
      const page = 2;
      const mockResult = { message: 'Showing all details for the role Manager' };
      mockService.fetchingAllEmployeesBasedOnRole.mockResolvedValue(mockResult);

      const res = await controller.getAllEmployees(role, page);
      expect(mockService.fetchingAllEmployeesBasedOnRole).toHaveBeenCalledWith(role, page);
      expect(res).toBe(mockResult);
    });
  });

  describe('editEmployee', () => {
    it('should edit employee details', async () => {
      const dto: RegisterEmployeeDto = {
        name: 'Jane',
        mobile: '9876543210',
        email: 'jane@c.com',
        roleName: 'Visitor',
        address: 'Delhi',
      };
      const id = 'EMP009';
      const mockResult = { message: 'Employee details updated successfully' };
      mockService.editEmployeeDetails.mockResolvedValue(mockResult);
      const res = await controller.editEmployee(id, dto);
      expect(mockService.editEmployeeDetails).toHaveBeenCalledWith(id, dto);
      expect(res).toBe(mockResult);
    });
  });

  describe('deleteEmployee', () => {
    it('should delete employee', async () => {
      const id = 'EMP011';
      const mockResult = { message: 'Employee deleted successfully!' };
      mockService.deleteEmployee.mockResolvedValue(mockResult);
      const res = await controller.deleteEmployee(id);
      expect(mockService.deleteEmployee).toHaveBeenCalledWith(id);
      expect(res).toBe(mockResult);
    });
  });

  describe('fetchAllRoles', () => {
    it('should pass normalized filters and parameters to service', async () => {
      const page = 1, search = 'Man', sortBy = 'newest', filter = ['Manager'], fromDate = '', toDate = '';
      const mockResult = { message: 'List of roles' };
      mockService.getAllRoles.mockResolvedValue(mockResult);

      const res = await controller.fetchAllRoles(page, search, sortBy, filter, fromDate, toDate);
      expect(mockService.getAllRoles).toHaveBeenCalledWith(page, search, sortBy, filter, fromDate, toDate);
      expect(res).toBe(mockResult);
    });
    it('should convert string filter to array', async () => {
      const page = 1, search = '', sortBy = '', filter = 'Manager' as any, fromDate = '', toDate = '';
      const mockResult = { message: 'List of roles' };
      mockService.getAllRoles.mockResolvedValue(mockResult);

      const res = await controller.fetchAllRoles(page, search, sortBy, filter, fromDate, toDate);
      expect(mockService.getAllRoles).toHaveBeenCalledWith(page, search, sortBy, [filter], fromDate, toDate);
      expect(res).toBe(mockResult);
    });
  });

  describe('deleteEmployeeRole', () => {
    it('should delete employee role', async () => {
      const id = 9;
      const mockResult = { message: 'Employee role record deleted successfully!' };
      mockService.deleteRole.mockResolvedValue(mockResult);
      const res = await controller.deleteEmployeeRole(id);
      expect(mockService.deleteRole).toHaveBeenCalledWith(id);
      expect(res).toBe(mockResult);
    });
  });

  describe('fetchAllEmployees', () => {
    it('should pass normalized filters and params to service', async () => {
      const page = 1, search = '', sortBy = '', filter = ['Manager', 'John Doe'], fromDate = '', toDate = '';
      const mockResult = { message: 'All employees fetched!' };
      mockService.fetchAllEmployees.mockResolvedValue(mockResult);

      const res = await controller.fetchAllEmployees(page, search, sortBy, filter, fromDate, toDate);
      expect(mockService.fetchAllEmployees).toHaveBeenCalledWith(page, search, sortBy, filter, fromDate, toDate);
      expect(res).toBe(mockResult);
    });
    it('should convert string filter to array for employee fetch', async () => {
      const page = 1, search = '', sortBy = '', filter = 'Manager' as any, fromDate = '', toDate = '';
      const mockResult = { message: 'All employees fetched!' };
      mockService.fetchAllEmployees.mockResolvedValue(mockResult);

      const res = await controller.fetchAllEmployees(page, search, sortBy, filter, fromDate, toDate);
      expect(mockService.fetchAllEmployees).toHaveBeenCalledWith(page, search, sortBy, [filter], fromDate, toDate);
      expect(res).toBe(mockResult);
    });
  });

  // You can easily add any more route if/when you uncomment or extend your controller.
});
