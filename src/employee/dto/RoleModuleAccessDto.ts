// role-module-access.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class RoleModuleAccessDto {
  @ApiProperty({
    description: 'Name of the module (must match Module.name)',
    example: 'Cattle Management',
  })
  @IsNotEmpty()
  @IsString()
  moduleName: string;

  @ApiProperty({ description: 'Can view', example: true })
  @IsNotEmpty()
  @IsBoolean()
  canView: boolean;

  @ApiProperty({ description: 'Can edit', example: false })
  @IsNotEmpty()
  @IsBoolean()
  canEdit: boolean;

  @ApiProperty({ description: 'Can delete', example: false })
  @IsNotEmpty()
  @IsBoolean()
  canDelete: boolean;
}
