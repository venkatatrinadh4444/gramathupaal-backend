import {
  Body,
  Controller,
  Post,
  Res,
  BadRequestException,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultData = await this.authService.validateUser(loginDto);

    res.cookie('user_token', resultData.token, {
      httpOnly: true,
      secure:
        this.configService.get('NODE_ENV') === 'production' ? true : false,
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000,
    });

    return {
      message: 'Login successful',
      userDetails: resultData.userDetails,
      token: resultData?.token,
    };
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
  
    res.clearCookie('user_token');
    return res.status(200).json({ message: 'Logout successful!' });
  }
  
}
