import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { JwtService } from '@nestjs/jwt';
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}
  
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest();
  
      const authHeader = request.headers['authorization'];
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Authorization token not found or malformed');
      }
  
      const user_token = authHeader.split(' ')[1];
  
      try {
        const decoded = this.jwtService.verify(user_token);
  
        (request as any).user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          token: user_token,
        };
  
        return true;
      } catch (error) {
        throw new UnauthorizedException('Token is invalid or expired');
      }
    }
  }
  