import {
  BadRequestException,
  Injectable
} from '@nestjs/common';
import { UserService } from '../users/users.service'
import { RegisterDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { catchBlock } from '../common/catch-block';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma:PrismaService
  ) {}

   //User login
  async validateUser(loginDto: LoginDto) {
    try {
      // const user =
      //   (await this.userService.findByEmail(loginDto.email)) ||
      //   (() => {
      //     throw new BadRequestException('User not existed!');
      //   })();

      const [user, employee] = await Promise.all([
        this.userService.findByEmail(loginDto.email),
        this.prisma.employee.findFirst({
          where: {
            OR: [
              { email: loginDto.email },
              { username: loginDto.email }
            ]
          }
        })
      ]);
      
      if(!user && !employee) {
        throw new BadRequestException('Invalid crendetials')
      }

      if(user) {
        (await bcrypt.compare(loginDto.password, user?.password)) ||
        (() => {
          throw new BadRequestException('Invalid credentials');
        })();
      }

      if(employee) {
        if(employee.password!==loginDto.password) {
          throw new BadRequestException('Invalid credentials')
        }
      }

      if(user) {
        const token = this.jwtService.sign({
          id: user.id,
          email: user.email,
          role: user.role,
        });
        const {password ,otp,expiresIn,...userDetails }=user
  
        return { message:'Super Admin login successfull',userDetails , token };
      }

      if(employee) {
        const token = this.jwtService.sign({
          id: employee.id,
          name: employee.name,
          username: employee.username,
          role: employee.roleName,
        });
        const allowedPermissions = await this.prisma.roleModuleAccess.findMany({
          where: {
            roleName: employee.roleName,
          },
        });
  
        const employeeDetails = {
          token,
          employeeDetails: employee,
          allowedPermissions,
        };
  
        return { message: 'Employee login successfull', employeeDetails };
      }

    } catch (err) {
      catchBlock(err);
      throw err;
    }
  }

   //User registration
  async registerUser(registerDto: RegisterDto) {
    return this.userService.createUser(registerDto);
  }

}
