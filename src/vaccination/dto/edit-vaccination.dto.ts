import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class EditVaccinationDto {
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
    description: 'Brief description of the medicine purpose or findings',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  notes: string;
}