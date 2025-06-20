import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { VaccinationService } from './vaccination.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateVaccinationDto } from './dto/add-vaccination.dto';
import { EditVaccinationDto } from './dto/edit-vaccination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('Vaccination')
@Controller('api/dashboard/doctor/vaccination')
export class VaccinationController {
  constructor(private readonly vaccinationService: VaccinationService) {}


  //Add new vaccination record
  @UseGuards(JwtAuthGuard)
  @Post('add-new')
  @ApiOperation({ summary: 'Add a new vaccination record' })
  @ApiBody({ type: CreateVaccinationDto })
  @ApiCreatedResponse({
    description: 'Vaccination record added successfully!',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or missing vaccination data',
    schema: {
      example: {
        statusCode: 400,
        message: ['vaccineName must be a string'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access',
  })
  async addNewVaccinationRecord(@Body() vaccinationDto: CreateVaccinationDto) {
    return this.vaccinationService.addNewVaccination(vaccinationDto);
  }

  //Fetch all vaccination records
  @UseGuards(JwtAuthGuard)
  @Get('all-vaccination-records')
  @ApiOperation({ summary: 'Get all vaccination records' })
  @ApiOkResponse({
    description: 'All vaccination records retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
  async gettingAllVaccinationRecords() {
    return this.vaccinationService.fetchingAllVaccinationRecords();
  }

  //Fetch specific animal vaccination records
  @UseGuards(JwtAuthGuard)
  @Get('specific-animal-vaccination-records/:cattleName')
  @ApiOperation({ summary: 'Get vaccination records of a specific animal' })
  @ApiParam({
    name: 'cattleName',
    required: true,
    example: 'Kaveri-03',
    description: 'Enter a valid cattle name',
  })
  @ApiOkResponse({
    description: 'Vaccination records for specific animal retrieved',
  })
  @ApiBadRequestResponse({
    description: 'Invalid cattle name format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid cattle name',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No vaccination records found for the animal',
  })
  async gettingSpecificAnimalVaccinationRecords(
    @Param('cattleName') cattleName: string,
  ) {
    if (!/^[A-Za-z]+-\d+$/.test(cattleName)) {
      throw new BadRequestException('Invalid cattle name');
    }
    return this.vaccinationService.gettingParticularAnimalVaccinationRecords(
      cattleName,
    );
  }

  //Update specific vaccination record
  @UseGuards(JwtAuthGuard)
  @Put('update-vaccination-record/:id')
  @ApiOperation({ summary: 'Update a vaccination record' })
  @ApiParam({
    name: 'id',
    required: true,
    example: 1,
    description: 'Enter a valid vaccination record ID',
  })
  @ApiBody({ type: EditVaccinationDto })
  @ApiOkResponse({
    description: 'Vaccination record updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or record ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access',
  })
  @ApiNotFoundResponse({
    description: 'Vaccination record not found',
  })
  async updateVaccinationRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() editVaccinationDto: EditVaccinationDto,
  ) {
    return this.vaccinationService.editParticularVaccinationRecord(
      id,
      editVaccinationDto,
    );
  }

  //Delete specific animal record
  @UseGuards(JwtAuthGuard)
  @Delete('delete-specific-record/:id')
  @ApiOperation({ summary: 'Delete a vaccination record' })
  @ApiParam({
    name: 'id',
    required: true,
    example: 2,
    description: 'Enter a valid record ID',
  })
  @ApiOkResponse({
    description: 'Vaccination record deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID format or not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access',
  })
  @ApiNotFoundResponse({
    description: 'Record not found for deletion',
  })
  async deleteVaccinationRecord(@Param('id', ParseIntPipe) id: number) {
    return this.vaccinationService.deleteParticularVaccinationRecord(id);
  }
}
