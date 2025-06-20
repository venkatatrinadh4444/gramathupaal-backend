
import { IsEmail, IsEnum, IsNotEmpty, Length } from "class-validator"
import { SelectedRole } from "@prisma/client"
import { ApiProperty } from "@nestjs/swagger"

export class RegisterDto {
    @ApiProperty({example:'example@gmail.com',description:'Enter a valid email id'})
    @IsNotEmpty({message:"Email must be not empty"})
    @IsEmail()
    email:string

    @ApiProperty({example:'12345678',description:'Password must be greater than 6 characters'})
    @IsNotEmpty()
    @Length(6,20)
    password:string


    @ApiProperty({example:'SuperAdmin',description:"Role must be (Admin,SuperAdmin,Doctor)"})
    @IsNotEmpty()
    @IsEnum(SelectedRole)
    role:SelectedRole
}