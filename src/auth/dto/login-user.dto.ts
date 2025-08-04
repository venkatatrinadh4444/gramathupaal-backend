import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";


export class LoginDto {
    @ApiProperty({example:'intern@gmail.com',description:'Enter email'})
    @IsNotEmpty()
    @IsString()
    email:string

    @ApiProperty({example:'Ace@1234',description:'Enter valid password'})
    @IsNotEmpty()
    @Length(6,20)
    password:string
}