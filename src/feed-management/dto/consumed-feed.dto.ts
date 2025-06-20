import { ApiProperty } from "@nestjs/swagger";
import { CattleType, FeedType, SelectedSession } from "@prisma/client";
import { IsDateString, IsDecimal, IsEnum, IsNotEmpty, IsString, Matches } from "class-validator";

export class ConsumedFeedDto {
    @ApiProperty({example:'COW',description:'Type must includes {COW,BUFFALO,GOAT}'})
    @IsNotEmpty()
    @IsEnum(CattleType)
    type:CattleType

    @ApiProperty({example:'Kaveri-02',description:'Enter a valid cattle Name'})
    @IsNotEmpty()
    @Matches(/^[A-Za-z]+-\d+$/,{message:'Cattle name must follow the format of Kaveri-01'})
    cattleName:string

    @ApiProperty({example:new Date(),description:'Enter the consumed date'})
    @IsNotEmpty()
    @IsDateString()
    date:string

    @ApiProperty({enumName:'feedType',enum:FeedType,description:'Select a valid type of feed {WATER,FEED}'})
    @IsNotEmpty()
    @IsEnum(FeedType)
    feedType:FeedType
    
    @ApiProperty({example:'Green Fodder',description:'Enter either feed name or water'})
    @IsNotEmpty()
    @IsString()
    feedName:string

    @ApiProperty({enumName:'session',enum:SelectedSession,description:'Session must inludes {MORNING,AFTERNOON,EVENING}'})
    @IsNotEmpty()
    @IsEnum(SelectedSession)
    session:SelectedSession

    @ApiProperty({example:'10',description:'Enter a qunatity of consumed water'})
    @IsNotEmpty()
    @IsDecimal()
    quantity:string
    
}