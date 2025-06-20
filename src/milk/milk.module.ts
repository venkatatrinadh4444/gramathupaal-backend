import { Module } from "@nestjs/common";
import { MilkController } from "./milk.controller";
import { MilkService } from "./milk.service";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports:[AuthModule],
    controllers:[MilkController],
    providers:[MilkService]
})

export class MilkModule {}