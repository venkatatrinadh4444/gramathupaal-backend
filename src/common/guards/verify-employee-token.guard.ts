import { Injectable, CanActivate, ExecutionContext, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";

@Injectable()
export class VerifyEmployeeToken implements CanActivate {
    constructor(private readonly jwt:JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest()

        const authHeader = request.headers['authorization']

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new BadRequestException('Authorization token not found or malformed')
        }

        const emp_token = authHeader.split(' ')[1]

        try {
            const decoded = this.jwt.verify(emp_token);
      
            (request as any).employee = {
              id: decoded.id,
              name:decoded.name,
              username:decoded.username,
              role: decoded.role,
              token:emp_token
            };
      
            return true;
          } catch (error) {
            throw new UnauthorizedException('Token is invalid or expired');
          }
    }
}