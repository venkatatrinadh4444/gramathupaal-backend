import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('JWT_SECTET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
    forwardRef(() => UserModule),
  ],
  controllers: [ AuthController ],
  providers: [ AuthService ],
  exports: [ JwtModule ],
})
export class AuthModule {}
