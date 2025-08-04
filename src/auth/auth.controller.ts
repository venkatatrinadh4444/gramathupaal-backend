import {
  Body,
  Controller,
  Post,
  Res,
  BadRequestException,
  Delete,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { Response } from 'express';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Authentication')
@ApiBearerAuth('access-token')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService:JwtService
  ) {}

  //User login
  @Post('login')
  @ApiOperation({ summary: 'Login with valid credentials' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({
    description: 'Login successful!',
    schema: {
      example: {
        message: 'Login successful',
        userDetails: {
          id: 1,
          name: 'Tom Holland',
          email: 'tom@example.com',
          role: 'SuperAdmin',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or missing fields',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password must be a string'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto
  ) {
    return this.authService.validateUser(loginDto)
  }

  //User registration
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'New user registered successfully!',
    schema: {
      example: {
        message: 'User registered successfully!',
        user: {
          id: 2,
          name: 'Tom Holland',
          email: 'tom@example.com',
          role: 'SuperAdmin',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or missing fields',
    schema: {
      example: {
        statusCode: 400,
        message: ['password is too short', 'email must be an email'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access or duplication',
    schema: {
      example: {
        statusCode: 401,
        message: 'User already exists',
        error: 'Unauthorized',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.registerUser(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  @ApiOperation({ summary: 'Logout a user by clearing the auth token cookie' })
  @ApiOkResponse({
    description: 'User logged out successfully',
    schema: {
      example: {
        message: 'Logout successful!',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Token not found in request or user not authenticated',
    schema: {
      example: {
        statusCode: 400,
        message: 'Token not found!',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized request (missing or invalid JWT token)',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  async logoutUser(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
  
    if (!user?.token) {
      throw new BadRequestException('Token not found!');
    }
    
    return res.status(200).json({ message: 'Logout successful!' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/refresh-token')
  @ApiOperation({ summary: 'Generating a new JWT token' })
  @ApiOkResponse({
    description: 'New token generated successfully',
    schema: {
      example: {
        message: 'New token generated'
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Token not found in request or user not authenticated',
    schema: {
      example: {
        statusCode: 400,
        message: 'Token not found!',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized request (missing or invalid JWT token)',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  async generateNewToken(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;

    const token = this.jwtService.sign({
      id: user?.id,
      email: user?.email,
      role: user?.role,
    })

    return res.status(200).json({ message: 'New token generated successfully!', user, token });
  }
  
}
