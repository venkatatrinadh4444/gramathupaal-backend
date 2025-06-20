import { Injectable,CanActivate,ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class VerifySuperAdmin implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req=context.switchToHttp().getRequest()

        const {role}=req.user

        if(role!=="SuperAdmin") {
            throw new ForbiddenException("You don't have access")
        }
        return true
    }
}