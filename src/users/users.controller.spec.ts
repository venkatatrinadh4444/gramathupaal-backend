import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from '../auth/dto/login-user.dto';
import { isEmail } from 'class-validator';

jest.mock('class-validator', () => ({
  ...jest.requireActual('class-validator'),
  isEmail: jest.fn(),
}));

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    loggedUserDetails: jest.fn(),
    updatePassword: jest.fn(),
    verifyOtp: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    role: 'user',
    name: 'John Doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return logged user details from service', async () => {
      mockUserService.loggedUserDetails.mockResolvedValueOnce({ message: 'verified', user: mockUser });

      const req = { user: mockUser };
      const result = await controller.getProfile(req);

      expect(mockUserService.loggedUserDetails).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ message: 'verified', user: mockUser });
    });
  });

  describe('forgetPassword (send-otp)', () => {
    it('should throw BadRequestException for invalid email', async () => {
      (isEmail as jest.Mock).mockReturnValueOnce(false);

      await expect(controller.forgetPassword('invalid-email')).rejects.toThrow(
        new BadRequestException('Please enter a valid email'),
      );
    });

    it('should call updatePassword for valid email', async () => {
      const email = 'test@example.com';
      (isEmail as jest.Mock).mockReturnValueOnce(true);
      mockUserService.updatePassword.mockResolvedValueOnce({ message: 'OTP sent' });

      const result = await controller.forgetPassword(email);

      expect(mockUserService.updatePassword).toHaveBeenCalledWith(email);
      expect(result).toEqual({ message: 'OTP sent' });
    });
  });

  describe('verifyOtp', () => {
    it('should call verifyOtp and return result', async () => {
      const dto: VerifyOtpDto = { email: 'user@example.com', otp: '123456' };
      mockUserService.verifyOtp.mockResolvedValueOnce({ message: 'OTP verified' });

      const result = await controller.verifyOtp(dto);

      expect(mockUserService.verifyOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'OTP verified' });
    });
  });

  describe('resetPassword', () => {
    it('should call resetPassword and return result', async () => {
      const loginDto: LoginDto = { email: 'user@example.com', password: 'newpassword' };
      mockUserService.resetPassword.mockResolvedValueOnce({ message: 'Password reset successful' });

      const result = await controller.resetPassword(loginDto);

      expect(mockUserService.resetPassword).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({ message: 'Password reset successful' });
    });
  });
});
