import { ApiProperty } from "@nestjs/swagger";
import { SelectedMilkGrade } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsDateString, IsDecimal, IsEnum, IsNotEmpty, IsOptional, Matches } from "class-validator";


export class AddMilkRecordDto {
   @ApiProperty({example:new Date(),description:'Enter a valid date'})
   @IsNotEmpty()
   @IsDateString()
   date:string

   @ApiProperty({example:'Kaveri-003',description:'Enter a valid cattle id'})
   @IsNotEmpty()
   @Matches(/^[A-Za-z]+-\d+$/,{message: 'cattleId must follow format Name-Number (e.g., Kaveri-01)'})
   cattleId:string

   @ApiProperty({example:'A1',description:'Milk grade must includes (A1,A2,OneCowA1,OneCowA2)'})
   @IsNotEmpty()
   @IsEnum(SelectedMilkGrade)
   milkGrade:SelectedMilkGrade

   @IsOptional()
   @Transform(({ value }) => value === '' ? undefined : value)
   @ApiProperty({example:"10.4",description:'Enter the value of the morning milk in litres'})
   @IsDecimal()
   morningMilk:string

   @IsOptional()
   @Transform(({ value }) => value === '' ? undefined : value)
   @ApiProperty({example:"8.4",description:'Enter the value of the afternoon milk in litres'})
   @IsDecimal()
   afternoonMilk?:string

   @IsOptional()
   @Transform(({ value }) => value === '' ? undefined : value)
   @ApiProperty({example:"5.4",description:'Enter the value of the evening milk in litres'})
   @IsDecimal()
   eveningMilk?:string

} 
