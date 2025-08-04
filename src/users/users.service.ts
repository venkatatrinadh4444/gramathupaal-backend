import {
  BadRequestException,
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

      (await this.prisma.user.findFirst({ where: { email } })) &&
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
      
      const [user, employee] = await Promise.all([
        this.prisma.user.findFirst({ where: { email } }),
        this.prisma.employee.findFirst({ where: { email } }),
      ]);

      if (!user && !employee) {
        throw new UnauthorizedException(
          'Please enter a valid email or username',
        );
      }

      const otp = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const expiresIn = Date.now() + 2 * 60 * 1000;

      sendOtpToUser(email, otp);

      if(user) {
        await this.prisma.user.update({
          where: { email },
          data: {
            otp,
            expiresIn: String(expiresIn),
          },
        });
      }

      if(employee) {
        await this.prisma.employee.update({
          where: { id:employee.id },
          data:{
            otp,
            expiresIn:String(expiresIn)
          }
        })
      }
      return { message: 'otp sended successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Verify OTP
  async verifyOtp(data: VerifyOtpDto) {
    try {
      const { email, otp } = data;
      const [user, employee] = await Promise.all([
        this.prisma.user.findFirst({ where: { email } }),
        this.prisma.employee.findFirst({ where: { email } }),
      ]);

      if (!user && !employee) {
        throw new UnauthorizedException(
          'Please enter a valid email or username',
        );
      }

      if(user) {
        if (user?.otp !== otp || Date.now() > Number(user.expiresIn)) {
          throw new UnauthorizedException('OTP is invalid or expired');
        }
      }

      if(employee) {
        if(employee?.otp!==otp || Date.now() > Number(employee.expiresIn)) {
          throw new UnauthorizedException('OTP is invalid or expired');
        }
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

      const [user, employee] = await Promise.all([
        this.prisma.user.findFirst({ where: { email } }),
        this.prisma.employee.findFirst({ where: { email } }),
      ]);

      if (!user && !employee) {
        throw new UnauthorizedException(
          'Please enter a valid email or username',
        );
      }

      if(user) {
      (await bcrypt.compare(password, user?.password)) &&
        (() => {
          throw new BadRequestException(
            'Please choose a password different from your current one',
          );
        })();
      
      await this.prisma.user.update({
        where: { email },
        data: {
          password: await bcrypt.hash(password, 10),
          otp: '',
          expiresIn: '',
        },
      });
    }

    if(employee) {
      if(employee.password===password) {
        throw new BadRequestException(
          'Please choose a password different from your current one',
        );
      }
      await this.prisma.employee.update({
        where:{id:employee.id},
        data :{
          password:password,
          otp:'',
          expiresIn:''
        }
      })
    }

      return { message: 'Password updated successfully!' };
      
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  //Fetching login in details
  async loggedUserDetails(user: any) {
    try {
      const { token, username, role } = user;
      if (role === 'SuperAdmin') {
        return { message: 'SuperAdmin details fetched successfully!', user };
      }
      const emp = await this.prisma.employee.findFirst({
        where: { username: username },
      });

      const allowedPermissions = await this.prisma.roleModuleAccess.findMany({
        where: {
          roleName: emp?.roleName,
        },
      });

      const employeeDetails = {
        emp_token: token,
        employeeDetails: emp,
        allowedPermissions,
      };

      return {
        message: 'Showing the fetched employee details',
        employeeDetails,
      };
    } catch (err) {
      catchBlock(err);
    }
  }
}
