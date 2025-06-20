import { Module } from "@nestjs/common";
import { AnimalController } from "./animal.controller";
import { AnimalService } from "./animal.service";
import { AuthModule } from "src/auth/auth.module";

@Module({
    imports:[AuthModule],
    controllers:[AnimalController],
    providers:[AnimalService]
})

export class AnimalModule {}