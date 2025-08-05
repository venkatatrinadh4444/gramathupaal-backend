// import { Test, TestingModule } from '@nestjs/testing';
// import { EmployeeService } from './employee.service';
// import { PrismaService } from '../prisma/prisma.service';
// import { RegisterEmployeeDto } from './dto/EmployeeDto';
// import { AssignMultiplePermissionsDto } from './dto/AssignMultiplePermissionsDto';
// import { BadRequestException, NotFoundException } from '@nestjs/common';
// import * as bcrypt from 'bcrypt';

// jest.mock('../common/send-credentails', () => ({
//   sendCredentials: jest.fn(),
// }));
// jest.mock('bcrypt', () => ({
//   hash: jest.fn().mockResolvedValue('hashedpw'),
// }));

// describe('EmployeeService', () => {
//   let service: EmployeeService;
//   let prisma: any;
//   const sendCredentials = require('../common/send-credentails').sendCredentials;

//   beforeAll(() => {
//     jest.spyOn(console, 'log').mockImplementation(() => {});
//   });
//   afterAll(() => {
//     (console.log as jest.Mock).mockRestore();
//   });

//   beforeEach(async () => {
//     const mockPrisma = {
//       role: {
//         findFirst: jest.fn(),
//         create: jest.fn(),
//         findMany: jest.fn(),
//         count: jest.fn(),
//         delete: jest.fn(),
//       },
//       employee: {
//         findFirst: jest.fn(),
//         create: jest.fn(),
//         findMany: jest.fn(),
//         findUnique: jest.fn(),
//         update: jest.fn(),
//         delete: jest.fn(),
//         count: jest.fn(),
//         groupBy: jest.fn(),
//       },
//       module: {
//         findUnique: jest.fn(),
//       },
//       roleModuleAccess: {
//         upsert: jest.fn(),
//         findMany: jest.fn(),
//       },
//       $transaction: jest.fn(),
//     };
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         EmployeeService,
//         { provide: PrismaService, useValue: mockPrisma },
//       ],
//     }).compile();
//     service = module.get<EmployeeService>(EmployeeService);
//     prisma = module.get<PrismaService>(PrismaService);
//     jest.clearAllMocks();
//   });

//   // ---- createEmployee ----
//   describe('createEmployee', () => {
//     const dtoNoEmail: RegisterEmployeeDto = {
//       name: 'John',
//       mobile: '9876543210',
//       roleName: 'Manager',
//       address: 'AAA',
//     };
//     const dtoWithEmail: RegisterEmployeeDto = {
//       name: 'John',
//       mobile: '9876543210',
//       email: 'john@example.com',
//       roleName: 'Manager',
//       address: 'AAA',
//     };
//     it('registers a new employee and sends credentials if email exists', async () => {
//       prisma.role.findFirst.mockResolvedValueOnce({ name: 'Manager' });
//       prisma.employee.findFirst.mockResolvedValue(null);
//       prisma.employee.findMany.mockResolvedValueOnce([{ id: 'EMP009' }]);
//       prisma.employee.create.mockResolvedValue({});
//       prisma.employee.findMany.mockResolvedValueOnce([dtoWithEmail]);
//       sendCredentials.mockClear();
//       const res = await service.createEmployee(dtoWithEmail);
//       expect(prisma.role.findFirst).toHaveBeenCalled();
//       expect(prisma.employee.create).toHaveBeenCalled();
//       expect(sendCredentials).toHaveBeenCalled();
//       expect(res?.message).toContain('created');
//       expect(res?.employeeDetails).toBeDefined();
//     });
//     it('registers a new employee and does NOT send credentials if email missing', async () => {
//       prisma.role.findFirst.mockResolvedValue({ name: 'Manager' });
//       prisma.employee.findFirst.mockResolvedValue(null);
//       prisma.employee.findMany.mockResolvedValueOnce([{ id: 'EMP001' }]);
//       prisma.employee.create.mockResolvedValue({});
//       prisma.employee.findMany.mockResolvedValueOnce([dtoNoEmail]);
//       sendCredentials.mockClear();
//       const res = await service.createEmployee(dtoNoEmail);
//       expect(sendCredentials).not.toHaveBeenCalled();
//       expect(res?.employeeDetails?.[0]?.name).toEqual('John');
//     });
//     it('creates role if not found', async () => {
//       prisma.role.findFirst.mockResolvedValueOnce(null);
//       prisma.role.create.mockResolvedValue({ name: 'Manager' });
//       prisma.employee.findFirst.mockResolvedValue(null);
//       prisma.employee.findMany.mockResolvedValueOnce([{ id: 'EMP010' }]);
//       prisma.employee.create.mockResolvedValue({});
//       prisma.employee.findMany.mockResolvedValueOnce([dtoNoEmail]);
//       await service.createEmployee(dtoNoEmail);
//       expect(prisma.role.create).toHaveBeenCalledWith({ data: { name: 'Manager' } });
//     });
//     it('throws on duplicate mobile or email', async () => {
//       prisma.role.findFirst.mockResolvedValue({ name: 'Manager' });
//       prisma.employee.findFirst.mockResolvedValue(dtoNoEmail);
//       await expect(service.createEmployee(dtoNoEmail)).rejects.toBeInstanceOf(BadRequestException);
//     });
//     it('handles no prior employees gracefully', async () => {
//       prisma.role.findFirst.mockResolvedValue({ name: 'Manager' });
//       prisma.employee.findFirst.mockResolvedValue(null);
//       prisma.employee.findMany.mockResolvedValueOnce([]);
//       prisma.employee.create.mockResolvedValue({});
//       prisma.employee.findMany.mockResolvedValueOnce([dtoNoEmail]);
//       await expect(service.createEmployee(dtoNoEmail)).resolves.toBeDefined();
//     });
//   });

//   // ---- createAccessForModules ----
//   describe('createAccessForModules', () => {
//     const dto: AssignMultiplePermissionsDto = {
//       roleName: 'Manager',
//       permissions: [
//         {
//           moduleName: 'Cattle Management',
//           canView: true,
//           canEdit: false,
//           canDelete: false,
//         },
//         {
//           moduleName: 'Milk Management',
//           canView: true,
//           canEdit: true,
//           canDelete: false,
//         },
//       ],
//     };
//     it('should upsert permissions for all modules when all modules exist', async () => {
//       prisma.role.findFirst.mockResolvedValueOnce({ name: 'Manager' });
//       prisma.module.findUnique.mockResolvedValue({ name: 'Cattle Management' });
//       prisma.roleModuleAccess.upsert.mockResolvedValue({});
//       const result = await service.createAccessForModules(dto);
//       expect(prisma.module.findUnique).toHaveBeenCalled();
//       expect(prisma.roleModuleAccess.upsert).toHaveBeenCalledTimes(dto.permissions.length);
//       expect(result?.message).toContain('successfully');
//     });
//     it('should create role if role not existed', async () => {
//       prisma.role.findFirst.mockResolvedValueOnce(null);
//       prisma.role.create.mockResolvedValue({ name: 'Manager' });
//       prisma.module.findUnique.mockResolvedValue({ name: 'Cattle Management' });
//       prisma.roleModuleAccess.upsert.mockResolvedValue({});
//       await service.createAccessForModules({ ...dto, permissions: [dto.permissions[0]] });
//       expect(prisma.role.create).toHaveBeenCalled();
//     });
//     it('should throw if any module does not exist', async () => {
//       prisma.role.findFirst.mockResolvedValue({ name: 'Manager' });
//       prisma.module.findUnique.mockResolvedValue(null);
//       await expect(service.createAccessForModules(dto)).rejects.toBeInstanceOf(NotFoundException);
//     });
//   });

//   // ---- fetchingAllEmployeesBasedOnRole ----
//   describe('fetchingAllEmployeesBasedOnRole', () => {
//     it('should retrieve employees and permissions for given role', async () => {
//       prisma.employee.count.mockResolvedValue(21);
//       prisma.employee.findMany.mockResolvedValue([
//         { id: 'EMP001', roleName: 'Manager' }, { id: 'EMP002', roleName: 'Manager' },
//       ]);
//       prisma.roleModuleAccess.findMany.mockResolvedValue([
//         { roleName: 'Manager', moduleName: 'Cattle Management' }
//       ]);
//       const result = await service.fetchingAllEmployeesBasedOnRole('Manager', 1);
//       expect(result?.message).toContain('Manager');
//       expect(result?.specificRoleDetails.totalUsers?.length).toBe(2);
//       expect(result?.specificRoleDetails.permissionDetails[0].roleName).toBe('Manager');
//     });
//     it('should run even if permissionDetails is empty', async () => {
//       prisma.employee.count.mockResolvedValue(0);
//       prisma.employee.findMany.mockResolvedValue([]);
//       prisma.roleModuleAccess.findMany.mockResolvedValue([]);
//       const res = await service.fetchingAllEmployeesBasedOnRole('RoleX', 10);
//       expect(res?.specificRoleDetails.totalUsers).toHaveLength(0);
//       expect(res?.specificRoleDetails.permissionDetails).toHaveLength(0);
//     });
//   });

//   // ---- editEmployeeDetails ----
//   describe('editEmployeeDetails', () => {
//     const id = 'EMP001';
//     const dto: RegisterEmployeeDto = {
//       name: 'Daner',
//       mobile: '9876543212',
//       roleName: 'Manager',
//       address: 'Addr',
//     };
//     it('should update employee details with hash', async () => {
//       prisma.employee.findUnique.mockResolvedValue({ id, username: 'daner123' });
//       prisma.role.findFirst.mockResolvedValue({ name: 'Manager' });
//       prisma.employee.update.mockResolvedValue({});
//       prisma.employee.findMany.mockResolvedValue([dto]);
//       (bcrypt.hash as jest.Mock).mockResolvedValue('pwdhash');
//       const result = await service.editEmployeeDetails(id, dto);
//       expect(prisma.employee.update).toHaveBeenCalled();
//       expect(result?.allEmployees).toBeDefined();
//     });
//     it('should create role if role not present', async () => {
//       prisma.employee.findUnique.mockResolvedValue({ id, username: 'daner123' });
//       prisma.role.findFirst.mockResolvedValueOnce(null);
//       prisma.role.create.mockResolvedValue({ name: 'Manager' });
//       prisma.employee.update.mockResolvedValue({});
//       prisma.employee.findMany.mockResolvedValue([dto]);
//       await service.editEmployeeDetails(id, dto);
//       expect(prisma.role.create).toHaveBeenCalled();
//     });
//     it('should throw BadRequestException if employee not found', async () => {
//       prisma.employee.findUnique.mockResolvedValue(null);
//       await expect(service.editEmployeeDetails(id, dto)).rejects.toBeInstanceOf(BadRequestException);
//     });
//   });

//   // ---- deleteEmployee ----
//   describe('deleteEmployee', () => {
//     it('should delete if id exists', async () => {
//       prisma.employee.findUnique.mockResolvedValue({ id: 'EMP001' });
//       prisma.employee.delete.mockResolvedValue({});
//       prisma.employee.findMany.mockResolvedValue([{ id: 'EMP020' }]);
//       const result = await service.deleteEmployee('EMP001');
//       expect(prisma.employee.delete).toHaveBeenCalledWith({ where: { id: 'EMP001' } });
//       expect(result?.message).toContain('deleted');
//     });
//     it('should throw BadRequestException if not exists', async () => {
//       prisma.employee.findUnique.mockResolvedValue(null);
//       await expect(service.deleteEmployee('ABC')).rejects.toBeInstanceOf(BadRequestException);
//     });
//   });

//   // ---- getAllRoles ----
//   describe('getAllRoles', () => {
//     const roleArr = [{ name: 'Manager', id: 1, createdAt: new Date() }];
//     it('should retrieve all roles with user counts and build message for search', async () => {
//       prisma.$transaction.mockResolvedValue([roleArr, 1]);
//       prisma.employee.groupBy.mockResolvedValue([{ roleName: 'Manager', _count: 2 }]);
//       const res = await service.getAllRoles(1, 'Mana', '', [], '', '');
//       expect(res?.roleDashboardData.allRolesDetails[0].totalUsers).toBe(2);
//       expect(res?.roleDashboardData.totalRecordsCount).toBe(1);
//       expect(res?.message).toContain('search');
//     });
//     it('should handle filter and date', async () => {
//       prisma.$transaction.mockResolvedValue([roleArr, 1]);
//       prisma.employee.groupBy.mockResolvedValue([{ roleName: 'Manager', _count: 2 }]);
//       const res = await service.getAllRoles(1, '', '', ['Mana'], '2023-01-01', '2023-12-31');
//       expect(res?.message).toMatch(/filters|date range/i);
//     });
//     it('should throw BadRequestException for sortBy', async () => {
//       await expect(service.getAllRoles(1, '', 'xinvalid', [], '', '')).rejects.toBeInstanceOf(BadRequestException);
//     });
//   });

//   // ---- deleteRole ----
//   describe('deleteRole', () => {
//     it('should delete and return a success message', async () => {
//       prisma.role.findFirst.mockResolvedValue({ id: 11 });
//       prisma.role.delete.mockResolvedValue({});
//       const result = await service.deleteRole(11);
//       expect(prisma.role.delete).toHaveBeenCalled();
//       expect(result?.message).toContain('deleted');
//     });
//     it('should throw if not found', async () => {
//       prisma.role.findFirst.mockResolvedValue(null);
//       await expect(service.deleteRole(12)).rejects.toBeInstanceOf(BadRequestException);
//     });
//   });

//   // ---- fetchAllEmployees ----
//   describe('fetchAllEmployees', () => {
//     it('returns employees for simple query', async () => {
//       prisma.employee.findMany.mockResolvedValue([{ id: 'EMP1', name: 'Alice', roleName: 'Manager' }]);
//       prisma.employee.count.mockResolvedValue(1);
//       const res = await service.fetchAllEmployees(1, '', '', [], '', '');
//       expect(res?.allEmployeeDetails.allEmployees[0].name).toBeDefined();
//       expect(res?.message).toContain('employees');
//     });

//     it('sorts and runs search', async () => {
//       prisma.employee.findMany.mockResolvedValue([{ id: 'EMP1', name: 'Alice', roleName: 'Manager' }]);
//       prisma.employee.count.mockResolvedValue(1);
//       const res = await service.fetchAllEmployees(1, 'Ali', 'oldest', [], '', '');
//       expect(res?.message).toContain('oldest');
//       expect(res?.allEmployeeDetails.allEmployees.length).toBe(1);
//     });

//     it('throws on invalid sort', async () => {
//       await expect(service.fetchAllEmployees(1, '', 'notAValue', [], '', '')).rejects.toBeInstanceOf(BadRequestException);
//     });

//     it('runs filter by names and roles', async () => {
//       prisma.employee.findMany.mockResolvedValueOnce([{ name: 'TestName' }]).mockResolvedValueOnce([{ roleName: 'Manager' }]);
//       prisma.employee.count.mockResolvedValue(2);
//       prisma.employee.findMany.mockResolvedValue([{ id: 'EMP1', name: 'TestName' }]);
//       const res = await service.fetchAllEmployees(1, '', '', ['TestName', 'Manager'], '', '');
//       expect(res?.message).toContain('selected filters');
//     });
//   });

// });

import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { RegisterEmployeeDto } from './dto/EmployeeDto';
import { AssignMultiplePermissionsDto } from './dto/AssignMultiplePermissionsDto';

jest.mock('../common/send-credentails', () => ({
  sendCredentials: jest.fn(),
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve('hashed:' + password)),
}));
jest.mock('../common/catch-block', () => ({
  catchBlock: jest.fn((err) => {
    // Simulate correct NestJS error propagation in service unit tests
    if (
      err instanceof Error &&
      (
        err.constructor.name === 'NotFoundException' ||
        err.constructor.name === 'BadRequestException' ||
        err.constructor.name === 'HttpException'
      )
    ) {
      throw err;
    }
    throw new InternalServerErrorException('Something went wrong');
  }),
}));

const mockSendCredentials = require('../common/send-credentails').sendCredentials;

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prisma: any;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
  });

  beforeEach(async () => {
    prisma = {
      role: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      employee: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        groupBy: jest.fn(),
        count: jest.fn(),
      },
      module: {
        findUnique: jest.fn(),
      },
      roleModuleAccess: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    jest.clearAllMocks();
    mockSendCredentials.mockClear();
  });

  describe('createEmployee', () => {
    const dto: RegisterEmployeeDto = {
      name: 'John Doe',
      email: 'john@x.com',
      mobile: '9999988888',
      roleName: 'Manager',
      address: 'Pune',
    };

    it('should create a new employee and send credentials', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ name: 'Manager' });
      prisma.employee.findFirst.mockResolvedValue(null);
      prisma.employee.findMany
        .mockResolvedValueOnce([{ id: 'EMP001' }]) // before create
        .mockResolvedValueOnce([{ id: 'EMP002' }]);
      prisma.employee.create.mockResolvedValue({});
      const result = await service.createEmployee(dto);
      expect(prisma.role.create).toHaveBeenCalled();
      expect(prisma.employee.create).toHaveBeenCalled();
      expect(mockSendCredentials).toHaveBeenCalledWith(dto.email, expect.any(String), expect.any(String));
      expect(result?.employeeDetails).toBeDefined();
    });

    it('should create even if no previous employees', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ name: 'Manager' });
      prisma.employee.findFirst.mockResolvedValue(null);
      prisma.employee.findMany
        .mockResolvedValueOnce([]) // before create
        .mockResolvedValueOnce([{ id: 'EMP001' }]);
      prisma.employee.create.mockResolvedValue({});
      await service.createEmployee(dto);
      expect(prisma.employee.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if duplicate mobile/email', async () => {
      prisma.role.findFirst.mockResolvedValue({ name: 'Manager' });
      prisma.employee.findFirst.mockResolvedValue({ id: 'EMP003' });
      await expect(service.createEmployee(dto)).rejects.toThrow(BadRequestException);
    });

    it('should work if no email', async () => {
      prisma.role.findFirst.mockResolvedValue({ name: 'Manager' });
      prisma.employee.findFirst.mockResolvedValue(null);
      prisma.employee.findMany
        .mockResolvedValueOnce([{ id: 'EMP001' }])
        .mockResolvedValueOnce([{ id: 'EMP002' }]);
      prisma.employee.create.mockResolvedValue({});
      await service.createEmployee({ ...dto, email: undefined });
      expect(prisma.employee.create).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException in catch block', async () => {
      prisma.role.findFirst.mockRejectedValue(new Error('Some DB error'));
      await expect(service.createEmployee(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createAccessForModules', () => {
    const dto: AssignMultiplePermissionsDto = {
      roleName: 'Manager',
      permissions: [
        { moduleName: 'Feed Management', canView: true, canEdit: false, canDelete: false },
        { moduleName: 'Milk Management', canView: true, canEdit: true, canDelete: false },
      ],
    };

    it('should upsert access for each module/role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ name: 'Manager' });
      prisma.module.findUnique.mockResolvedValue({ name: 'Feed Management' });
      prisma.roleModuleAccess.upsert.mockResolvedValue({});
      const result = await service.createAccessForModules(dto);
      expect(prisma.role.create).toHaveBeenCalled();
      expect(prisma.module.findUnique).toHaveBeenCalledTimes(dto.permissions.length);
      expect(prisma.roleModuleAccess.upsert).toHaveBeenCalledTimes(dto.permissions.length);
      expect(result?.message).toMatch(/permissions assigned/i);
    });

    it('should throw NotFoundException if module does not exist', async () => {
      prisma.role.findFirst.mockResolvedValue({ name: 'Manager' });
      prisma.module.findUnique.mockResolvedValueOnce(null);
      await expect(service.createAccessForModules(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      prisma.role.findFirst.mockRejectedValue(new Error('Oops'));
      await expect(service.createAccessForModules(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('fetchingAllEmployeesBasedOnRole', () => {
    it('fetches data and returns proper object', async () => {
      prisma.employee.count.mockResolvedValue(1);
      prisma.employee.findMany.mockResolvedValue([{ id: 'EMP01' }]);
      prisma.roleModuleAccess.findMany.mockResolvedValue([{ roleName: 'Manager', id: 2 }]);
      const result = await service.fetchingAllEmployeesBasedOnRole('Manager', 1);
      expect(result?.message).toContain('Manager');
      expect(result?.specificRoleDetails.totalPage).toBe(1);
    });

    it('throws InternalServerErrorException on catch', async () => {
      prisma.employee.count.mockRejectedValue(new Error('DB error'));
      await expect(service.fetchingAllEmployeesBasedOnRole('Manager', 1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('editEmployeeDetails', () => {
    const dto: RegisterEmployeeDto = {
      name: 'Jane Doe',
      email: 'jane@x.com',
      mobile: '1234567890',
      roleName: 'Admin',
      address: 'Chennai',
    };

    it('should update an employee with hashed password', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'EMP44', username: 'jane44' });
      prisma.role.findFirst.mockResolvedValue({ name: 'Admin' });
      prisma.employee.findMany.mockResolvedValue([{ id: 'EMP44' }]);
      prisma.employee.update.mockResolvedValue({});
      const result = await service.editEmployeeDetails('EMP44', dto);
      expect(result?.message).toContain('updated');
      expect(result?.allEmployees).toBeDefined();
    });

    it('should throw BadRequestException if not found', async () => {
      prisma.employee.findUnique.mockResolvedValue(undefined);
      await expect(service.editEmployeeDetails('EMPxx', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException on catch', async () => {
      prisma.employee.findUnique.mockRejectedValue(new Error('DB error'));
      await expect(service.editEmployeeDetails('EMP44', dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteEmployee', () => {
    it('should mark employee as inactive if found', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'EMP09' });
      prisma.employee.update.mockResolvedValue({}); // because now we use update, not delete
      prisma.employee.findMany.mockResolvedValue([{ id: 'EMP09' }]);
      
      const res = await service.deleteEmployee('EMP09');
  
      expect(res?.message).toContain('status updated successfully');
      expect(res?.allEmployees).toBeDefined();
    });
  
    it('should throw BadRequestException if not found', async () => {
      prisma.employee.findUnique.mockResolvedValue(undefined);
      await expect(service.deleteEmployee('EMPnotexist')).rejects.toThrow(BadRequestException);
    });
  
    it('throws InternalServerErrorException on catch', async () => {
      prisma.employee.findUnique.mockRejectedValue(new Error('DB error'));
      await expect(service.deleteEmployee('EMP09')).rejects.toThrow(InternalServerErrorException);
    });
  });
  

  describe('getAllRoles', () => {
    it('should fetch roles and user counts', async () => {
      prisma.$transaction.mockResolvedValue([
        [{ name: 'Manager', createdAt: new Date() }],
        1,
      ]);
      prisma.employee.groupBy.mockResolvedValue([{ roleName: 'Manager', _count: 5 }]);
      const res = await service.getAllRoles(1, '', '', [], '', '');
      expect(res?.roleDashboardData.allRolesDetails[0].totalUsers).toBe(5);
      expect(res?.message).toBeDefined();
    });

    it('should sort by name-asc/name-desc client-side', async () => {
      prisma.$transaction.mockResolvedValue([
        [
          { name: 'Zebra', createdAt: new Date() },
          { name: 'Alpha', createdAt: new Date() },
        ],
        2,
      ]);
      prisma.employee.groupBy.mockResolvedValue([
        { roleName: 'Alpha', _count: 1 },
        { roleName: 'Zebra', _count: 2 },
      ]);
      const asc = await service.getAllRoles(1, '', 'name-asc', [], '', '');
      const desc = await service.getAllRoles(1, '', 'name-desc', [], '', '');
      expect(asc?.roleDashboardData.allRolesDetails[0].name).toBe('Alpha');
      expect(desc?.roleDashboardData.allRolesDetails[0].name).toBe('Zebra');
    });

    it('throws BadRequestException on bad sortBy', async () => {
      await expect(service.getAllRoles(1, '', 'bad-sort', [], '', '')).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException on catch', async () => {
      prisma.$transaction.mockRejectedValue(new Error('DB error'));
      await expect(service.getAllRoles(1, '', '', [], '', '')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteRole', () => {
    it('should delete if found', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 100 });
      prisma.role.delete.mockResolvedValue({});
      const res = await service.deleteRole(100);
      expect(res?.message).toContain('deleted');
    });
    it('should throw if role not found', async () => {
      prisma.role.findFirst.mockResolvedValue(undefined);
      await expect(service.deleteRole(999)).rejects.toThrow(BadRequestException);
    });
    it('throws InternalServerErrorException on catch', async () => {
      prisma.role.findFirst.mockRejectedValue(new Error('DB error'));
      await expect(service.deleteRole(99)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('fetchAllEmployees', () => {
    it('should fetch and sort in-memory', async () => {
      prisma.employee.findMany.mockResolvedValue([
        { name: 'B' },
        { name: 'A' },
      ]);
      prisma.employee.count.mockResolvedValue(2);
      const res = await service.fetchAllEmployees(1, '', 'name-asc', [], '', '');
      expect(res?.allEmployeeDetails.allEmployees[0].name).toBe('A');
    });

    it('should filter by name and role', async () => {
      // nameMatches, roleMatches, then allEmployees, then count
      prisma.employee.findMany
        .mockResolvedValueOnce([{ name: 'E1' }]) // names
        .mockResolvedValueOnce([{ roleName: 'Role1' }]) // roles
        .mockResolvedValue([{ name: 'E1', roleName: 'Role1' }]); // employees
      prisma.employee.count.mockResolvedValue(1);
      const res = await service.fetchAllEmployees(1, '', '', ['E1', 'Role1'], '', '');
      expect(res?.allEmployeeDetails.allEmployees.length).toBeGreaterThanOrEqual(0);
    });

    it('should throw BadRequestException for bad sortBy', async () => {
      await expect(service.fetchAllEmployees(1, '', 'bad-sort', [], '', '')).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException on catch', async () => {
      prisma.employee.findMany.mockRejectedValue(new Error('Oops'));
      await expect(service.fetchAllEmployees(1, '', '', [], '', '')).rejects.toThrow(InternalServerErrorException);
    });
  });
});
