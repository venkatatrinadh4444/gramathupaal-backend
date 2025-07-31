import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
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
    console.error(err);
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
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        email: 'existing@example.com',
      });

      await expect(
        service.createUser({
          email: 'existing@example.com',
          password: '123456',
          role: 'SuperAdmin',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updatePassword', () => {
    it('should send OTP and update user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        email: 'user@example.com',
      });
      (otpGenerator.generate as jest.Mock).mockReturnValue('123456');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.updatePassword('user@example.com');

      expect(sendOtpToUser).toHaveBeenCalledWith('user@example.com', '123456');
      expect(prisma.user.update).toHaveBeenCalled();
      expect(result).toEqual({ message: 'otp sended successfully!' });
    });

    it('should throw NotFoundException if user not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updatePassword('unknown@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        email: 'otp@example.com',
        otp: '654321',
        expiresIn: `${Date.now() + 60000}`,
      });

      const result = await service.verifyOtp({
        email: 'otp@example.com',
        otp: '654321',
      });

      expect(result).toEqual({ message: 'OTP verified successfully!' });
    });

    it('should throw UnauthorizedException if OTP is invalid', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        otp: '111111',
        expiresIn: `${Date.now() + 60000}`,
      });

      await expect(
        service.verifyOtp({ email: 'otp@example.com', otp: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if OTP is expired', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        otp: '654321',
        expiresIn: `${Date.now() - 1000}`, // expired
      });

      await expect(
        service.verifyOtp({ email: 'otp@example.com', otp: '654321' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password if new password is different', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        email: 'reset@example.com',
        password: 'oldHashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // different password
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.resetPassword({
        email: 'reset@example.com',
        password: 'newPassword',
      });

      expect(result).toEqual({ message: 'Password updated successfully!' });
    });

    it('should throw BadRequestException if password is same', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        email: 'reset@example.com',
        password: 'sameHashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // same password

      await expect(
        service.resetPassword({
          email: 'reset@example.com',
          password: 'samePassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: 'notfound@example.com',
          password: 'any',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      (prisma.user.findFirst as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected');
      });

      await expect(
        service.resetPassword({ email: 'fail@example.com', password: '123' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should rethrow HttpException', async () => {
      const error = new BadRequestException('forced');
      (prisma.user.findFirst as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(
        service.resetPassword({ email: 'fail@example.com', password: '123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
