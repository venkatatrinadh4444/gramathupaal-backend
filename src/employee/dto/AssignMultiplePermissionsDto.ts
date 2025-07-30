// assign-multiple-permissions.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleModuleAccessDto } from './RoleModuleAccessDto';

export class AssignMultiplePermissionsDto {
  @ApiProperty({
    description: 'Role name to assign permissions to (must match Role.name)',
    example: 'Manager',
  })
  @IsNotEmpty()
  @IsString()
  roleName: string;

  @ApiProperty({
    type: [RoleModuleAccessDto],
    description: 'List of module access configurations',
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleModuleAccessDto)
  permissions: RoleModuleAccessDto[];
}
