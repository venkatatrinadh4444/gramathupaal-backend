import { Injectable,CanActivate,ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {

    constructor(private jwtService:JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request=context.switchToHttp().getRequest()

        const {user_token}=request.cookies

        if(!user_token) {
            throw new UnauthorizedException('Token not found!')
        }
        const decoded=this.jwtService.verify(user_token)

        if(!decoded) {
            throw new UnauthorizedException('Token is invalid or expired')
        }

        (request as any).user={
            id:decoded.id,
            email:decoded.email,
            role:decoded.role,
            token:user_token
        }
        
        return true
    }
}