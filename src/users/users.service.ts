import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as otpGenerator from 'otp-generator';
import { sendOtpToUser } from '../common/send-otp';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from '../auth/dto/login-user.dto';
import { catchBlock } from '../common/catch-block';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  //Check the email is in database
  async findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email } });
  }

  //Registering new user
  async createUser(registerDto: RegisterDto) {
    try {
      const { email, password, role } = registerDto;

      await this.prisma.user.findFirst({ where: { email } }) &&
        (() => {
          throw new ConflictException('Email is already in use');
        })();

      await this.prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 10),
          role,
        },
      });
      return { message: 'New user registered successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Send OTP to email
  async updatePassword(email: string) {
    try {
      (await this.prisma.user.findFirst({ where: { email } })) ||
        (() => {
          throw new NotFoundException('User not found!');
        })();

      const otp = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets:false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const expiresIn = Date.now() + 2 * 60 * 1000;

      sendOtpToUser(email, otp);

      await this.prisma.user.update({
        where: { email },
        data: {
          otp,
          expiresIn: String(expiresIn),
        },
      });

      return { message: 'otp sended successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Verify OTP
  async verifyOtp(data: VerifyOtpDto) {
    try {
      const { email, otp } = data;
      const user = await this.prisma.user.findFirst({ where: { email } });

      if (user?.otp !== otp || Date.now() > Number(user.expiresIn)) {
        throw new UnauthorizedException('OTP is invalid or expired');
      }

      return { message: 'OTP verified successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }

   //Reset password after verifying OTP
  async resetPassword(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      (await this.prisma.user.findFirst({ where: { email } })) ||
        (() => {
          throw new NotFoundException('User not found!');
        })();

      await this.prisma.user.update({
        where: { email },
        data: {
          password: await bcrypt.hash(password, 10),
          otp: '',
          expiresIn: '',
        },
      });
      return { message: 'Password updated successfully!' };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
