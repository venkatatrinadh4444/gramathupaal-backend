import { ApiProperty } from "@nestjs/swagger";

export class ErrorReponseDto {
    @ApiProperty({example:400})
    statusCode:number

    @ApiProperty({example:'Bad Request'})
    error:string

    @ApiProperty({example:['Something went wrong'],type:[String]})
    message:[string]|string
    
}