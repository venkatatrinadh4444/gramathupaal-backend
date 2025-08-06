import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as otpGenerator from 'otp-generator';
import { sendOtpToUser } from '../common/send-otp';
import { SelectedRole } from 'generated/prisma';

jest.mock('bcrypt');
jest.mock('otp-generator', () => ({
  generate: jest.fn(),
}));
jest.mock('../common/send-otp', () => ({
  sendOtpToUser: jest.fn(),
}));
jest.mock('../common/catch-block', () => ({
  catchBlock: jest.fn((err) => {
    if (process.env.NODE_ENV === 'test') throw err;
  }),
}));

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            employee: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            roleModuleAccess: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = { email: 'test@example.com' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create user if email is not taken', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPass');
      (prisma.user.create as jest.Mock).mockResolvedValue({});

      const result = await service.createUser({
        email: 'new@example.com',
        password: '123456',
        role: 'SuperAdmin' as SelectedRole,
      });

      expect(result).toEqual({ message: 'New user registered successfully!' });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ email: 'exists@example.com' });

      await expect(
        service.createUser({
          email: 'exists@example.com',
          password: '123456',
          role: 'SuperAdmin',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updatePassword', () => {
    it('should send OTP and update user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ email: 'u@example.com' });
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);
      (otpGenerator.generate as jest.Mock).mockReturnValue('123456');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.updatePassword('u@example.com');

      expect(sendOtpToUser).toHaveBeenCalledWith('u@example.com', '123456');
      expect(prisma.user.update).toHaveBeenCalled();
      expect(result).toEqual({ message: 'otp sended successfully!' });
    });

    it('should send OTP and update employee', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 1, email: 'emp@example.com' });
      (otpGenerator.generate as jest.Mock).mockReturnValue('654321');
      (prisma.employee.update as jest.Mock).mockResolvedValue({});

      const result = await service.updatePassword('emp@example.com');

      expect(sendOtpToUser).toHaveBeenCalledWith('emp@example.com', '654321');
      expect(prisma.employee.update).toHaveBeenCalled();
      expect(result).toEqual({ message: 'otp sended successfully!' });
    });

    it('should throw UnauthorizedException if neither user nor employee found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.updatePassword('unknown@example.com')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP for user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        otp: '111111',
        expiresIn: `${Date.now() + 60000}`,
      });
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.verifyOtp({ email: 'u@example.com', otp: '111111' });
      expect(result).toEqual({ message: 'OTP verified successfully!' });
    });

    it('should verify OTP for employee', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
        otp: '222222',
        expiresIn: `${Date.now() + 60000}`,
      });

      const result = await service.verifyOtp({ email: 'emp@example.com', otp: '222222' });
      expect(result).toEqual({ message: 'OTP verified successfully!' });
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        otp: '333333',
        expiresIn: `${Date.now() + 60000}`,
      });
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyOtp({ email: 'u@example.com', otp: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired OTP', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        otp: '444444',
        expiresIn: `${Date.now() - 1000}`,
      });
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyOtp({ email: 'u@example.com', otp: '444444' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if neither found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyOtp({ email: 'unknown', otp: '000000' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password for user if different from current', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        email: 'u@example.com',
        password: 'oldPass',
      });
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.resetPassword({ email: 'u@example.com', password: 'newP' });
      expect(result).toEqual({ message: 'Password updated successfully!' });
    });

    it('should reset password for employee if different', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        password: 'old',
      });
      const result = await service.resetPassword({ email: 'emp@example.com', password: 'new' });
      expect(result).toEqual({ message: 'Password updated successfully!' });
    });

    it('should throw BadRequestException if same password for user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        password: 'same',
      });
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.resetPassword({ email: 'u@example.com', password: 'same' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if same password for employee', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        password: 'pass',
      });

      await expect(service.resetPassword({ email: 'emp@example.com', password: 'pass' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if neither found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword({ email: 'unknown', password: 'x' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException for unknown errors', async () => {
      (prisma.user.findFirst as jest.Mock).mockImplementation(() => { throw new Error('unexpected'); });
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword({ email: 'err', password: 'x' }))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('loggedUserDetails', () => {
    it('should return SuperAdmin details', async () => {
      const user = { role: 'SuperAdmin', token: 't', username: 'u' };
      const result = await service.loggedUserDetails(user);
  
      expect(result).toEqual({
        message: 'SuperAdmin details fetched successfully!',
        userDetails: user,
        token: 't',
      });
    });
  
    it('should return employee details for non-SuperAdmin', async () => {
      const user = { role: 'Employee', token: 't', username: 'emp1' };
  
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ roleName: 'Manager' });
      (prisma.roleModuleAccess.findMany as jest.Mock).mockResolvedValue(['perm1', 'perm2']);
  
      const result = await service.loggedUserDetails(user);
  
      expect(result).toEqual({
        message: 'Showing the fetched employee details',
        userDetails: {
          emp_token: 't',
          employeeDetails: { roleName: 'Manager' },
          allowedPermissions: ['perm1', 'perm2'],
        },
        token: 't',
      });
    });
  });  

});
