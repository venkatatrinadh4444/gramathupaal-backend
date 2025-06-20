import { ApiProperty } from '@nestjs/swagger';
import { CattleType } from '@prisma/client';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';

export class CreateCheckupDto {
  @ApiProperty({
    example: new Date(),
    description: 'Date and time of the checkup',
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'Amoxicillin 250mg twice daily for 5 days',
    description: 'Prescribed medicine or treatment details',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  prescription: string;

  @ApiProperty({
    example: 'Routine health check for fever and mild cough',
    description: 'Brief description of the checkup purpose or findings',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description: string;


  @ApiProperty({enumName:'type',enum:CattleType,example:'COW',description:'The type of cattle must includes {COW,BUFFALO,GOAT}'})
  @IsNotEmpty()
  @IsEnum(CattleType)
  type:CattleType

  @ApiProperty({example:'Raghav',description:'Name of the doctor'})
  @IsNotEmpty()
  @IsString()
  doctorName:string

  @ApiProperty({example:'+91 1234567890',description:'Contact number of the doctor'})
  @IsNotEmpty()
  @IsString()
  doctorPhone:string


  @ApiProperty({
    example: 'Kaveri-02',
    description: 'Name of the cattle in the format Name-XX (e.g., Kaveri-02)',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z][a-zA-Z]+-\d+$/, {
    message: 'cattleName must follow the format Name-XX (e.g., Kaveri-02)',
  })
  cattleName: string;
}
