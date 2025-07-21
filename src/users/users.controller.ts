import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { isEmail } from 'class-validator';
import { UserService } from './users.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from '../auth/dto/login-user.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //Get user profile details 
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get logged-in user profile details' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched user profile',
    schema: {
      example: {
        message: 'verified',
        user: {
          id: 1,          
          email: 'user@example.com',
          name: 'John Doe',
          role: 'user',
        },
      },
    },
  })
  @ApiBadRequestResponse({description:'Invalid credentials'})
  async getProfile(@Req() req:any) {
    const user = req.user
    return { message: 'verified', user };
  }

  //Send OTP to email
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to the user email for verification' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent to the email address',
  })
  @ApiResponse({ status: 400, description: 'Invalid email format' })
  async forgetPassword(@Body('email') email: string) {
    if (!isEmail(email)) {
      throw new BadRequestException('Please enter a valid email');
    }
    return this.userService.updatePassword(email);
  }

  //Verify OTP
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify the OTP sent to the user' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verification successful',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() data: VerifyOtpDto) {
    return this.userService.verifyOtp(data);
  }

  //Reset password after verifying OTP
  @Put('reset-password')
  @ApiOperation({ summary: 'Reset the password using a new one' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiResponse({ status: 400, description: 'Validation or reset failure' })
  async resetPassword(@Body() loginDto: LoginDto) {
    return this.userService.resetPassword(loginDto);
  }
}
