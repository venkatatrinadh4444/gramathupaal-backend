import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { SelectedRole } from 'generated/prisma';

jest.mock('../common/catch-block', () => ({
  catchBlock: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: Partial<Record<keyof UserService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let prismaService: PrismaService;

  const plainPassword = 'plainPassword';
  let hashedPassword: string;

  beforeEach(async () => {
    hashedPassword = await bcrypt.hash(plainPassword, 10);

    userService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    prismaService = {
      employee: { findFirst: jest.fn() },
      roleModuleAccess: { findMany: jest.fn() },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    const loginDto = {
      email: 'test@example.com',
      password: plainPassword,
    };

    it('should return Super Admin login success with token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        role: 'SuperAdmin',
        otp: '1234',
        expiresIn: new Date(),
        name: 'Test User',
      };

      userService.findByEmail!.mockResolvedValue(mockUser);
      prismaService.employee.findFirst = jest.fn().mockResolvedValue(null);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jwtService.sign!.mockReturnValue('mocked-jwt-token');

      const result = await authService.validateUser(loginDto);

      expect(result).toEqual({
        message: 'Super Admin login successfull',
        userDetails: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          name: mockUser.name,
        },
        token: 'mocked-jwt-token',
      });

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should return Employee login success with allowed permissions', async () => {
      const mockEmployee = {
        id: 2,
        name: 'Employee One',
        username: 'emp1',
        email: 'test@example.com',
        password: plainPassword,
        roleName: 'Manager',
      };

      userService.findByEmail!.mockResolvedValue(null);
      prismaService.employee.findFirst = jest.fn().mockResolvedValue(mockEmployee);
      prismaService.roleModuleAccess.findMany = jest
        .fn()
        .mockResolvedValue([{ module: 'Dashboard' }]);
      jwtService.sign!.mockReturnValue('mocked-employee-token');

      const result = await authService.validateUser(loginDto);

      expect(result).toEqual({
        message: 'Employee login successfull',
        employeeDetails: {
          token: 'mocked-employee-token',
          employeeDetails: mockEmployee,
          allowedPermissions: [{ module: 'Dashboard' }],
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockEmployee.id,
        name: mockEmployee.name,
        username: mockEmployee.username,
        role: mockEmployee.roleName,
      });
    });

    it('should throw BadRequestException if both user and employee are not found', async () => {
      userService.findByEmail!.mockResolvedValue(null);
      prismaService.employee.findFirst = jest.fn().mockResolvedValue(null);

      await expect(authService.validateUser(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user password is incorrect', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        role: 'SuperAdmin',
        otp: '1234',
        expiresIn: new Date(),
        name: 'Test User',
      };

      userService.findByEmail!.mockResolvedValue(mockUser);
      prismaService.employee.findFirst = jest.fn().mockResolvedValue(null);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(authService.validateUser(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if employee password is incorrect', async () => {
      const mockEmployee = {
        id: 2,
        name: 'Employee One',
        username: 'emp1',
        email: 'test@example.com',
        password: 'wrongPass',
        roleName: 'Manager',
      };

      userService.findByEmail!.mockResolvedValue(null);
      prismaService.employee.findFirst = jest.fn().mockResolvedValue(mockEmployee);

      await expect(authService.validateUser(loginDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerUser', () => {
    it('should call createUser and return result', async () => {
      const registerDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'securePassword',
        role: 'SuperAdmin' as SelectedRole,
      };

      const createdUser = { id: 2, ...registerDto };

      userService.createUser!.mockResolvedValue(createdUser);

      const result = await authService.registerUser(registerDto);

      expect(result).toEqual(createdUser);
      expect(userService.createUser).toHaveBeenCalledWith(registerDto);
    });
  });
});
