import { IsDateString, IsDecimal, IsEnum,  IsInt,  IsNotEmpty, IsString, Matches } from "class-validator";

import { HealthStatus,CattleType,CattleBreed,InseminationType,ParentOrigin } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class EditAnimalDto {
    @ApiProperty({example:'Kaveri-004',description:'Cattle ID'})
    @IsNotEmpty()
    @IsString()
    @Matches(/^[A-Za-z]+-\d+$/, {message: 'cattle name must follow format Name-Number (e.g., Kaveri-003)'})
    cattleName:string

    @ApiProperty({
        enum:HealthStatus,
        enumName:'Health Status',
        description:'Enter a valid enum value'
    })
    @IsNotEmpty()
    @IsEnum(HealthStatus)
    healthStatus:HealthStatus


    @ApiProperty({
        enum:CattleType,
        enumName:'Cattle Type',
        description:'Enter a valid enum value'
    })
    @IsNotEmpty()
    @IsEnum(CattleType)
    type:CattleType


    @ApiProperty({
        example:180,
        description:'Weight of the cattle'
    })
    @IsNotEmpty()
    @IsInt()
    @Type(()=>Number)
    weight:number

    @ApiProperty({
        example:8.3,
        description:'SNF of the cattle'
    })
    @IsNotEmpty()
    @IsDecimal()
    snf:string

    @ApiProperty({
        enum:InseminationType,
        enumName:'Father Insemination Type',
        description:'Enter a valid enum value'
    })
    @IsNotEmpty()
    @IsEnum(InseminationType)
    fatherInsemination:InseminationType

    @ApiProperty({
        enum:ParentOrigin,
        enumName:'Parent Origin Type',
        description:'Enter a valid enum value'
    })
    @IsNotEmpty()
    @IsEnum(ParentOrigin)
    parent:ParentOrigin

    @ApiProperty({
        enum:CattleBreed,
        enumName:'Cattle Breed Type',
        description:'Enter a valid enum value'
    })
    @IsNotEmpty()
    @IsEnum(CattleBreed)
    breed:CattleBreed


    @ApiProperty({
        example:new Date(),
        description:'Birth Date of the cattle'
    })
    @IsNotEmpty()
    @IsDateString()
    birthDate:string


    @ApiProperty({
        example:new Date(),
        description:'Farm Entry Date of the cattle'
    })
    @IsNotEmpty()
    @IsDateString()
    farmEntry:string

    @ApiProperty({
        example:10000,
        description:'Purchase amount of the cattle'
    })
    @IsNotEmpty()
    @IsDecimal()
    purchaseAmount:string


    @ApiProperty({
        example:'Ramu',
        description:'Name of the vendor'
    })
    @IsNotEmpty()
    @IsString()
    vendorName:string
}