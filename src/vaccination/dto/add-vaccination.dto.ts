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

export class CreateVaccinationDto {
  @ApiProperty({
    example: new Date(),
    description: 'Date and time of the vaccination',
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'Brucellosis',
    description: 'Name of the medicine',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  name: string;

  @ApiProperty({
    example: 'A slight shortage of calcium has been noted, which might necessitate additional observation a...',
    description: 'Brief description of the vaccination purpose or findings',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  notes: string;


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
  @Matches(/^[A-Z][a-zA-Z]*-\d+$/, {
    message: 'cattleName must follow the format Name-XX (e.g., Kaveri-02)',
  })
  cattleName: string;
}
