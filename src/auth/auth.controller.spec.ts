import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-user.dto';
import { RegisterDto } from './dto/register-user.dto';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let jwtService: JwtService;

  const mockAuthService = {
    validateUser: jest.fn(),
    registerUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call AuthService.validateUser and return its result', async () => {
      const loginDto: LoginDto = { email: 'tom@example.com', password: 'pass123' };
      const mockResult = { message: 'Super Admin login successfull', token: 'test-token' };

      mockAuthService.validateUser.mockResolvedValue(mockResult);

      const result = await authController.login(loginDto);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('register', () => {
    it('should call AuthService.registerUser and return its result', async () => {
      const registerDto: RegisterDto = {
        email: 'tom@example.com',
        password: 'strongpassword',
        role: 'SuperAdmin',
      };
      const mockResult = { message: 'User registered successfully!', user: { id: 2, ...registerDto } };

      mockAuthService.registerUser.mockResolvedValue(mockResult);

      const result = await authController.register(registerDto);

      expect(mockAuthService.registerUser).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('logoutUser', () => {
    it('should throw BadRequestException if no token is found', async () => {
      const req = { user: {} } as any;
      const res = {} as Response;

      await expect(authController.logoutUser(req, res)).rejects.toThrow(
        new BadRequestException('Token not found!'),
      );
    });

    it('should return logout success message if token exists', async () => {
      const req = { user: { token: 'valid-token' } } as any;
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res = { status } as any;

      await authController.logoutUser(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'Logout successful!' });
    });
  });

  describe('generateNewToken', () => {
    it('should generate a new token and return it with user info', async () => {
      const user = { id: 1, email: 'tom@example.com', role: 'SuperAdmin' };
      const req = { user } as any;
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res = { status } as any;

      mockJwtService.sign.mockReturnValue('new-token');

      await authController.generateNewToken(req, res);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        message: 'New token generated successfully!',
        user,
        token: 'new-token',
      });
    });
  });
});
