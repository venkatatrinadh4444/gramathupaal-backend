import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";


export class VerifyOtpDto {
    @ApiProperty({example:'example@gmail.com',description:'Email must be an email'})
    @IsNotEmpty({message:"Email must need"})
    @IsEmail()
    email:string

    @ApiProperty({example:'234233',description:'OTP must be equal to six characters'})
    @IsNotEmpty()
    @IsString()
    otp:string
}