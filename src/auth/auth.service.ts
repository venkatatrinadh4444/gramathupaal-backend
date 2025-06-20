import {
  BadRequestException,
  Injectable
} from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import { RegisterDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { catchBlock } from 'src/common/catch-block';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

   //User login
  async validateUser(loginDto: LoginDto) {
    try {
      const user =
        (await this.userService.findByEmail(loginDto.email)) ||
        (() => {
          throw new BadRequestException('User not existed!');
        })();

      (await bcrypt.compare(loginDto.password, user?.password)) ||
        (() => {
          throw new BadRequestException('Invalid credentials');
        })();

      const token = this.jwtService.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const {password ,otp,expiresIn,...userDetails }=user

      return { userDetails , token };
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
