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
} from '@nestjs/swagger';

@ApiTags('Doctor Checkups')
@ApiBearerAuth()
@Controller('api/dashboard/doctor/checkup')
export class CheckupController {
  constructor(private readonly checkupService: CheckupService) {}

  //Add new doctor checkup
  @Post('add-new')
  @UseGuards(JwtAuthGuard)
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
  @Get('get-all-records')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch all checkup records' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all checkup records',
  })
  async gettingAllDoctorCheckupReports() {
    return this.checkupService.fetchingAllCheckups();
  }

  //Fetch specific animal checkup records
  @Get('specific-animal-records/:cattleName')
  @UseGuards(JwtAuthGuard)
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
  @Put('update-specific-record/:id')
  @UseGuards(JwtAuthGuard)
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
  @Delete('delete-specific-record/:id')
  @UseGuards(JwtAuthGuard)
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
}
