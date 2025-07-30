import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Length } from "class-validator";


export class EmployeeLoginDto {
    @ApiProperty({example:'employee001 OR employee@gmail.com',description:'Enter a valid username or email'})
    @IsNotEmpty()
    username:string

    @ApiProperty({example:'employee@1234',description:'Enter valid password'})
    @IsNotEmpty()
    @Length(6,20)
    password:string
}