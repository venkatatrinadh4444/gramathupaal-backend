import { ApiProperty } from "@nestjs/swagger";
import { SelectedUnit } from "@prisma/client";
import { IsDateString, IsDecimal, IsEnum, IsNotEmpty, IsString } from "class-validator";

export class AddFeedStock {
    @ApiProperty({example:'Green Fodder',description:'Enter name of the stock'})
    @IsNotEmpty()
    @IsString()
    name:string

    @ApiProperty({example:new Date(),description:'Enter date of feed'})
    @IsNotEmpty()
    @IsDateString()
    date:string

    @ApiProperty({enum:SelectedUnit,enumName:'Inventory Unit'})
    @IsNotEmpty()
    @IsEnum(SelectedUnit)
    unit:SelectedUnit

    @ApiProperty({example:'100',description:'Enter the quantity'})
    @IsNotEmpty()
    @IsDecimal()
    quantity:string

    // @ApiProperty({example:'Added',description:'Enter the type either Added or Consumed'})
    // @IsNotEmpty()
    // @IsString()
    // type:string

    @ApiProperty({example:'This is a Green Fodder stock',description:'Enter some notes'})
    @IsNotEmpty()
    @IsString()
    notes:string

}