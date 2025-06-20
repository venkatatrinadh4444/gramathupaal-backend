import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Length } from "class-validator";


export class LoginDto {
    @ApiProperty({example:'intern@gmail.com',description:'Enter email'})
    @IsNotEmpty()
    @IsEmail()
    email:string

    @ApiProperty({example:'intern1234',description:'Enter valid password'})
    @IsNotEmpty()
    @Length(6,20)
    password:string
}