import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Param,
  Put,
  ParseIntPipe,
  Delete,
  Query,
} from '@nestjs/common';
import { CheckupService } from './checkup.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateCheckupDto } from './dto/add-checkup.dto';
import { EditCheckupDto } from './dto/edit-checkup.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Doctor Checkups')
@ApiBearerAuth('access-token')
@Controller('api/dashboard/doctor/checkup')
export class CheckupController {
  constructor(private readonly checkupService: CheckupService) {}

  //Add new doctor checkup
  @UseGuards(JwtAuthGuard)
  @Post('add-new')
  @ApiOperation({ summary: 'Add a new checkup record for a cattle' })
  @ApiResponse({
    status: 201,
    description: 'Checkup record successfully created',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ type: CreateCheckupDto })
  async addNewDoctorCheckup(@Body() checkDto: CreateCheckupDto) {
    return this.checkupService.addNewCheckup(checkDto);
  }

  //Fetch all the checkup records
  @UseGuards(JwtAuthGuard)
  @Get('get-all-records/:page')
  @ApiOperation({ summary: 'Fetch all checkup records' })
  @ApiParam({
    name: 'page',
    required: true,
    example: 1,
    description: 'Enter a valid animal name (e.g., 1)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description:
      'Query string for sorting data based on (e.g.,"newest","oldest","name-asc","name-dsc")',
    example: 'newest',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Query string for filtering data based on (e.g.,"COW","BUFFALO","GOAT")',
    example: 'COW',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Search string for filtering data based on cattle name, prescription',
    example: 'kaveri-004',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all checkup records',
  })
  async gettingAllDoctorCheckupReports(@Param('page',ParseIntPipe) page:number , @Query('sortBy') sortBy:string , @Query('filter') filter:string , @Query('search') search:string) {
    return this.checkupService.fetchingAllCheckups(page,sortBy,filter,search);
  }

  //Fetch specific animal checkup records
  @UseGuards(JwtAuthGuard)
  @Get('specific-animal-records/:cattleName')
  @ApiOperation({ summary: 'Fetch checkup records of a specific cattle' })
  @ApiParam({
    name: 'cattleName',
    description: 'Cattle name in the format Name-XX (e.g., Kaveri-02)',
    example: 'Kaveri-02',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all checkup records for the specified cattle',
  })
  async gettingParticularAnimalCheckupReports(
    @Param('cattleName') cattleName: string,
  ) {
    return this.checkupService.gettingParticularAnimalCheckups(cattleName);
  }

  //Update specific checkup record
  @UseGuards(JwtAuthGuard)
  @Put('update-specific-record/:id')
  @ApiOperation({ summary: 'Update a specific checkup record by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the checkup record to update',
    example: 5,
  })
  @ApiBody({ type: EditCheckupDto })
  @ApiResponse({
    status: 200,
    description: 'Checkup record successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Checkup record not found' })
  async updateSpecificCheckupReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() editCheckupDto: EditCheckupDto,
  ) {
    return this.checkupService.editParticularCheckupRecord(id, editCheckupDto);
  }

  //Delete specific checkup record
  @UseGuards(JwtAuthGuard)
  @Delete('delete-specific-record/:id')
  @ApiOperation({ summary: 'Delete a specific checkup record by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the checkup record to delete',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Checkup record successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Checkup record not found' })
  async deleteSpecificRecord(@Param('id', ParseIntPipe) id: number) {
    return this.checkupService.deleteParticularCheckupRecord(id);
  }

  //Getting the checkup dashboard data
  @UseGuards(JwtAuthGuard)
  @Get('checkup-dashboard')
  @ApiOperation({ summary: 'Fetching checkup dashboard data' })
  @ApiOkResponse({ description: 'Showing the data of checkup dashboard' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  @ApiQuery({
    name: 'fromDate',
    required: true,
    example: '2025-06-12',
    description: 'Required date filter in YYYY-MM-DD format',
  })
  @ApiQuery({
    name: 'toDate',
    required: true,
    example: '2025-06-12',
    description: 'Required date filter in YYYY-MM-DD format',
  })
  async gettingDateBasedMilkRecords(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.checkupService.checkupDashboard(fromDate, toDate);
  }

   // Get checkup records by a specific date range
   @UseGuards(JwtAuthGuard)
   @Get('date-specific-checkup-records/:cattleName')
   @ApiOperation({ summary: 'Fetching all checkup records based on the date' })
   @ApiOkResponse({ description: 'Showing the data of checkup records' })
   @ApiUnauthorizedResponse({
     description: 'Unauthorized access - JWT token required',
   })
   @ApiParam({
     name: 'cattleName',
     required: true,
     example: 'Kaveri-001',
     description: 'Enter a valid cattle name',
   })
   @ApiQuery({
     name: 'fromDate',
     required: true,
     example: '2025-06-12',
     description: 'Required date filter in YYYY-MM-DD format',
   })
   @ApiQuery({
     name: 'toDate',
     required: true,
     example: '2025-06-12',
     description: 'Required date filter in YYYY-MM-DD format',
   })
   async gettingDateBasedCheckupRecords(
     @Param('cattleName') cattleName: string,
     @Query('fromDate') fromDate: string,
     @Query('toDate') toDate: string
   ) {
     return this.checkupService.getCheckupRecordsForSpecificDate(cattleName, fromDate,toDate);
   }
}
