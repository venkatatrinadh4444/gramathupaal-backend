import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { SelectedRole } from 'generated/prisma';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: Partial<Record<keyof UserService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  const plainPassword = 'plainPassword';
  let hashedPassword: string;

  beforeEach(async () => {
    // Hash password once before each test block
    hashedPassword = await bcrypt.hash(plainPassword, 10);

    userService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    const loginDto = {
      email: 'test@example.com',
      password: plainPassword,
    };

    it('should return user details and token if credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
        otp: '1234',
        expiresIn: new Date(),
        name: 'Test User',
      };

      userService.findByEmail!.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jwtService.sign!.mockReturnValue('mocked-jwt-token');

      const result = await authService.validateUser(loginDto);

      expect(result).toEqual({
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

    it('should throw BadRequest if user does not exist', async () => {
      userService.findByEmail!.mockResolvedValue(null);

      await expect(authService.validateUser(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword, // correct hash
        role: 'user',
        otp: '1234',
        expiresIn: new Date(),
        name: 'Test User',
      };

      userService.findByEmail!.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false); // simulate invalid password

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
