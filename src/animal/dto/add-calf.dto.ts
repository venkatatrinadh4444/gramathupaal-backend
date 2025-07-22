import { HealthStatus, SelectGender } from '@prisma/client';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddNewCalfDto {
  @ApiProperty({ example: 'Kaveri-004', description: 'Cattle ID' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z]+-\d+$/, {
    message: 'cattle name must follow format Name-Number (e.g., Kaveri-003)',
  })
  cattleName: string;

  @ApiProperty({
    description: 'Unique calf ID in the format C-202',
    example: 'C-202',
  })
  @IsNotEmpty()
  @Matches(/^[a-z]-\d+$/, { message: 'Calf name must follow the format C-202' })
  calfId: string;

  @ApiProperty({
    description: 'Birth date of the calf in ISO format',
    example: '2025-06-10',
  })
  @IsNotEmpty()
  @IsDateString()
  birthDate: string;

  @ApiProperty({
    description: 'Gender of the calf',
    enum: SelectGender,
    example: SelectGender.FEMALE,
  })
  @IsNotEmpty()
  @IsEnum(SelectGender)
  gender: SelectGender;

  @ApiProperty({
    description: 'Health status of the calf',
    enum: HealthStatus,
    example: HealthStatus.HEALTHY,
  })
  @IsNotEmpty()
  @IsEnum(HealthStatus)
  healthStatus: HealthStatus;

  @ApiProperty({
    description: 'Weight of the calf in kilograms (as decimal)',
    example: '28.5',
  })
  @IsNotEmpty()
  @IsDecimal()
  weight: string;
}
