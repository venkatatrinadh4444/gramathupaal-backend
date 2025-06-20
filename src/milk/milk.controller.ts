import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AddMilkRecordDto } from './dto/add-milk-record.dto';
import { MilkService } from './milk.service';
import { matches } from 'class-validator';

@ApiTags('Milk Management')
@Controller('api/dashboard/milk')
export class MilkController {
  constructor(private readonly milkService: MilkService) {}

  //Add new milk record
  @UseGuards(JwtAuthGuard)
  @Post('add-new')
  @ApiOperation({ summary: 'Add a new milk record' })
  @ApiBody({ type: AddMilkRecordDto })
  @ApiCreatedResponse({
    type: AddMilkRecordDto,
    description: 'New milk record added successfully!',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid request body',
    schema: {
      example: {
        statusCode: 400,
        message: ['milkQuantity must be a number'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async addNewMilkRecord(@Body() milkDto: AddMilkRecordDto,@Request() req:any) {
    const userId=req?.user?.id
    return this.milkService.addNewMilkRecord(milkDto,userId);
  }

  //Fetching all milk records
  @UseGuards(JwtAuthGuard)
  @Get('all-milk-records')
  @ApiOperation({ summary: 'Get all milk records' })
  @ApiOkResponse({
    description: 'List of all milk records',
    schema: {
      example: [
        {
          id: 1,
          cattleName: 'Kaveri-01',
          date: '2025-06-11',
          milkQuantity: 12.5,
        },
        {
          id: 2,
          cattleName: 'Ganga-02',
          date: '2025-06-11',
          milkQuantity: 10,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async gettingAllMilkRecords() {
    return this.milkService.gettingAllMilkRecords();
  }

  //Fetching specific animal milk records
  @UseGuards(JwtAuthGuard)
  @Get('specific-animal-records/:cattleName')
  @ApiOperation({ summary: 'Get all milk records for a specific animal' })
  @ApiParam({
    name: 'cattleName',
    required: true,
    example: 'Kaveri-04',
    description: 'Enter a valid animal name (e.g., Kaveri-04)',
  })
  @ApiOkResponse({
    description: 'List of milk records for the specified animal',
  })
  @ApiBadRequestResponse({
    description: 'Invalid animal ID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Enter a valid animal name',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async gettingSpecificAnimalRecords(@Param('cattleName') cattleName: string) {
    if (!matches(cattleName, /^[A-Za-z]+-\d+$/)) {
      throw new BadRequestException('Enter a valid animal name');
    }
    return this.milkService.gettingParticularAnimalMilkRecords(cattleName);
  }

  //Update specific milk record
  @UseGuards(JwtAuthGuard)
  @Put('update-specific-record/:id')
  @ApiOperation({ summary: 'Update a specific milk record' })
  @ApiParam({
    name: 'id',
    required: true,
    example: '2',
    description: 'Enter a valid milk record ID',
  })
  @ApiBody({ type: AddMilkRecordDto })
  @ApiOkResponse({
    description: 'Milk record updated successfully!',
  })
  @ApiBadRequestResponse({
    description: 'Validation error or wrong input format',
    schema: {
      example: {
        statusCode: 400,
        message: ['milkQuantity must not be empty'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async updateMilkRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() milkDto: AddMilkRecordDto,
  ) {
    return this.milkService.updateParticularMilkRecord(id, milkDto);
  }
  
  //Delete specific milk record
  @UseGuards(JwtAuthGuard)
  @Delete('delete-specific-animal-milk-records/:id')
  @ApiOperation({ summary: 'Delete a specific milk record' })
  @ApiParam({
    name: 'id',
    required: true,
    example: '1',
    description: 'Enter a valid milk record id',
  })
  @ApiOkResponse({
    description: 'Specific milk record deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid milk record id',
    schema: {
      example: {
        statusCode: 400,
        message: 'Enter a valid milk record id',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async delete(@Param('id',ParseIntPipe) id:number) {
    return this.milkService.deleteParticularAnimalMilkRecords(id);
  }

  //Fetching all data for milk dashboard
  @UseGuards(JwtAuthGuard)
  @Get('milk-dashboard')
  @ApiOperation({ summary: 'Fetching all information for milk dashboard' })
  @ApiOkResponse({ description: 'Showing the data for milk dashboard' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  @ApiQuery({
    name: 'session',
    required: false,
    example: 'Morning',
    description: 'Optional session filter (e.g., Today,Morning, Afternoon, Evening)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2025-06-12',
    description: 'Optional date filter in YYYY-MM-DD format',
  })
  async gettingMilkDashboardData(
    @Query('session') session: string,
    @Query('date') date: string,
  ) {
    return this.milkService.dashboardData(session, date);
  }

  //Fetch monthly wise milk production data
  @UseGuards(JwtAuthGuard)
  @Get('get-monthly-production-records')
  @ApiOperation({ summary: 'Fetching all the records based on the month' })
  @ApiOkResponse({
    description: 'Monthly milk production records retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  @ApiQuery({
    name: 'session',
    required: true,
    description: 'Session to filter monthly milk production records',
    example: 'Overall',
    enum:["Overall","Morning","Afternoon","Evening"]
  })
  async getAllRecordsBasedOnMonth(@Query('session') session: string) {
    return this.milkService.getMonthlyMilkProductionTable(session);
  }
}
