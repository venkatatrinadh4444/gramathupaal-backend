import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class EditCheckupDto {
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
}