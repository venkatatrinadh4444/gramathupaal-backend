import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class RegisterEmployeeDto {
  @ApiProperty({
    description: 'Full name of the employee',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Mobile number of the employee',
    example: '9876543210',
  })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian number',
  })
  mobile: string;

//   @ApiProperty({
//     description: 'Username for login (should be unique)',
//     example: 'john.doe',
//   })
//   @IsNotEmpty()
//   @IsString()
//   username: string;

//   @ApiProperty({
//     description: 'Password (minimum 6 characters)',
//     example: 'strongP@ss123',
//   })
//   @IsNotEmpty()
//   @MinLength(6, {
//     message: 'Password must be at least 6 characters long',
//   })
//   password: string;

  @ApiProperty({
    description: 'Email of the employee (optional)',
    example: 'johndoe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiProperty({
    description: 'Role name assigned to the employee',
    example: 'Manager',
  })
  @IsNotEmpty()
  @IsString()
  roleName: string;

  @ApiProperty({
    description: 'Whether the employee account is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({
    description:'Enter the address of the employee',
    example:'Shanthi nagar,Coimbatore,Tamil Nadu'
  })
  @IsNotEmpty()
  @IsString()
  address:string

}
