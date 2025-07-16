import {
  Body,
  Controller,
  Post,
  UseGuards,
  Put,
  Param,
  Get,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  Query,
  ParseIntPipe,
  Request,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddAnimalDto } from './dto/add-animal.dto';
import { AnimalService } from './animal.service';
import { VerifySuperAdmin } from '../common/guards/verify-super-admin.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { matches } from 'class-validator';
import { EditAnimalDto } from './dto/edit-animal.dto';
import { AddNewCalfDto } from './dto/add-calf.dto';

@ApiTags('Animal Management')
@ApiBearerAuth()
@Controller('api/dashboard/animal')
export class AnimalController {
  constructor(private readonly animalServie: AnimalService) {}

  //Add new animal
  @UseGuards(JwtAuthGuard)
  @Post('add-animal')
  @ApiOperation({ summary: 'Add a new cattle with images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: AddAnimalDto,
    description: 'Form data including animal details and image files',
  })
  @ApiCreatedResponse({
    description: 'New cattle added successfully',
    schema: {
      example: {
        message: 'Animal added successfully',
        animal: {
          cattleId: 'Kaveri-001',
          breed: 'Jersey',
          gender: 'Female',
          weight: 220,
          age: 4,
          color: 'Brown',
          dob: '2021-05-12',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid data provided',
    schema: {
      example: {
        statusCode: 400,
        message: ['cattleId must be a string', 'weight must be a number'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  @UseInterceptors(FilesInterceptor('images', 5))
  async addAnimal(
    @Body() animalDto: AddAnimalDto,
    @UploadedFiles() images: Express.Multer.File[],
    @Request() req: any,
  ) {
    const userId: number = req?.user?.id;

    if (!images || images.length < 2) {
      throw new BadRequestException('You must upload at least 2 images.');
    }
    const image1 = images[0];
    const image2 = images[1];

    return this.animalServie.addAnimal(animalDto, image1, image2, userId);
  }

  // Fetching all animals
  @UseGuards(JwtAuthGuard)
  @Get('all-animals/:page')
  @ApiOperation({ summary: 'Retrieve all cattle details' })
  @ApiParam({
    name: 'page',
    required: true,
    example: 1,
    description: 'Enter page no (e.g.,1)',
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
    isArray:true,
    required: false,
    description:
      'Query string for filtering data based on breeds and cattle type and health status',
      example: ['COW', 'GOAT', 'KARAMPASU'],
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description:
      'Specific start date to filter the cattle overview data',
    example: '2025-06-12',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description:
      'Specific end date to filter top cattle overview data',
    example: '2025-06-12',
  })
  @ApiOkResponse({
    description: 'List of all cattle',
    type: [AddAnimalDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
  async showAllCattles(@Param('page',ParseIntPipe) page:number,@Query('sortBy') sortBy:string , @Query('filter') filter:string[] | string , @Query('fromDate') fromDate: string,
  @Query('toDate') toDate: string) {
    const normalizedFilter = Array.isArray(filter) ? filter : filter ? [filter] : [];
    return this.animalServie.gettingAllCattles(page,sortBy,normalizedFilter,fromDate,toDate);
  }

  //Getting all details of specific animal
  @UseGuards(JwtAuthGuard)
  @Get('specific-animal/:cattleId')
  @ApiOperation({ summary: 'Retrieve details of a specific cattle' })
  @ApiParam({
    name: 'cattleId',
    required: true,
    example: 'Kaveri-001',
    description: 'Cattle ID (e.g., Kaveri-001)',
  })
  @ApiOkResponse({
    description: 'Details of the specific animal',
    type: AddAnimalDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid cattle ID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Enter a valid cattle ID',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
  async showParticularCattleDetails(@Param('cattleId') cattleId: string) {
    if (!cattleId || !matches(cattleId, /^[A-Za-z]+-\d+$/)) {
      throw new BadRequestException('Enter a valid cattle ID');
    }
    return this.animalServie.showingParticularAnimal(cattleId);
  }

  //Update animal details
  @UseGuards(JwtAuthGuard)
  @Put('update-animal/:id')
  @ApiOperation({ summary: 'Update existing animal details' })
  @ApiParam({
    name: 'id',
    required: true,
    example: '1',
    description: 'Animal ID (e.g., 1)',
  })
  @ApiBody({ type: EditAnimalDto })
  @ApiOkResponse({
    description: 'Animal details updated successfully',
    type: AddAnimalDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['age must be a positive number'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
  async updateAnimal(
    @Param('id', ParseIntPipe) id: number,
    @Body() animalDto: EditAnimalDto,
  ) {
    return this.animalServie.updateParticularAnimalDetails(id, animalDto);
  }

  //Delete specific animal
  @UseGuards(JwtAuthGuard, VerifySuperAdmin)
  @Delete('delete-animal/:id')
  @ApiOperation({ summary: 'Delete an animal (Super Admin only)' })
  @ApiParam({
    name: 'id',
    required: true,
    example: '1',
    description: 'Animal ID (e.g., 1)',
  })
  @ApiOkResponse({
    description: 'Animal deleted successfully',
    schema: {
      example: {
        message: 'Animal deleted successfully',
        deletedId: '1',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  @ApiForbiddenResponse({ description: 'Access denied: Super admin only' })
  async deleteAnimal(@Param('id', ParseIntPipe) id: number) {
    return this.animalServie.deleteParticularAnimal(id);
  }

  //Get all cattle names
  @UseGuards(JwtAuthGuard)
  @Get('all-cattle-names')
  @ApiOperation({ summary: 'Get names/IDs of all cattle' })
  @ApiOkResponse({
    description: 'List of cattle IDs',
    schema: {
      example: ['Kaveri-001', 'Ganga-002', 'Moti-003'],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
  async gettingAllCattleIds() {
    return this.animalServie.gettingAllCattleIds();
  }

  //Fetch Feed history
  @UseGuards(JwtAuthGuard)
  @Get('feed-history/:cattleName/:page')
  @ApiOperation({ summary: 'Get feed history of a specific animal' })
  @ApiParam({
    name: 'cattleName',
    required: true,
    example: 'Kaveri-05',
    description: 'Enter the cattle name (e.g., Kaveri-05)',
  })
  @ApiParam({
    name: 'page',
    required: true,
    example: 1,
    description: 'Enter the page number (e.g.,1)',
  })
  @ApiOkResponse({ description: 'Feed history fetched successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid cattle name format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid cattle name format',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
  async getAllFeedHistory(@Param('cattleName') cattleName: string, @Param('page',ParseIntPipe) page:number) {
    if (!/^[A-Za-z]+-\d+$/.test(cattleName)) {
      throw new BadRequestException('Invalid cattle name format');
    }
    return this.animalServie.getFeedHistory(cattleName,page);
  }

  //Fetch milk production history
  @UseGuards(JwtAuthGuard)
  @Get('milk-history/:cattleName/:page')
  @ApiOperation({ summary: 'Get milk production history of a specific animal' })
  @ApiParam({
    name: 'cattleName',
    required: true,
    example: 'Kaveri-05',
    description: 'Enter the cattle name (e.g., Kaveri-05)',
  })
  @ApiParam({
    name: 'page',
    required: true,
    example: 1,
    description: 'Enter the page number (e.g.,1)',
  })
  @ApiOkResponse({
    description: 'Milk production history fetched successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid cattle name format',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
  async getAllMilkHistory(@Param('cattleName') cattleName: string , @Param('page',ParseIntPipe) page:number) {
    if (!/^[A-Za-z]+-\d+$/.test(cattleName)) {
      throw new BadRequestException('Invalid cattle name format');
    }
    return this.animalServie.milkProductionHistory(cattleName,page);
  }

  //Fetch checkup history
  @UseGuards(JwtAuthGuard)
  @Get('checkup-history/:cattleName/:page')
  @ApiOperation({ summary: 'Get checkup history of a specific animal' })
  @ApiParam({
    name: 'cattleName',
    required: true,
    example: 'Kaveri-05',
    description: 'Enter the cattle name (e.g., Kaveri-05)',
  })
  @ApiParam({
    name: 'page',
    required: true,
    example: 1,
    description: 'Enter the page number (e.g.,1)',
  })
  @ApiOkResponse({ description: 'Checkup history fetched successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid cattle name format',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
  async getAllCheckupHistory(@Param('cattleName') cattleName: string , @Param('page',ParseIntPipe) page:number) {
    if (!/^[A-Za-z]+-\d+$/.test(cattleName)) {
      throw new BadRequestException('Invalid cattle name format');
    }
    return this.animalServie.getCheckupHistory(cattleName,page);
  }

  //Get cattle management top section data
  @UseGuards(JwtAuthGuard)
  @Get('get-data-dashboard-top-section')
  @ApiOperation({ summary: 'Getting the dashboard data for top section' })
  @ApiOkResponse({
    description: 'Top section data for the dashboard retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description:
      'Query string for filtering data (optional if date is provided)',
    example: 'Week',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description:
      'Specific start date to filter the top section data (optional if query is provided)',
    example: '2025-06-12',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description:
      'Specific end date to filter the top section data (optional if query is provided)',
    example: '2025-06-12',
  })
  async gettingDashboardTopSection(
    @Query('query') query: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    if (!query && !(fromDate && toDate)) {
      throw new BadRequestException(
        'At least one query parameter (query or date) must be provided.',
      );
    }
    return this.animalServie.getDataForDashboardTopSection(query, fromDate,toDate);
  }

   //Fetching all the recent health checkup reocords
  @UseGuards(JwtAuthGuard)
  @Get('get-dashboard-checkup-records')
  @ApiOperation({
    summary: 'Fetching health checkup records for dashboard display',
  })
  @ApiOkResponse({
    description: 'Health records fetched successfully for dashboard',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async getDashboardCheckupRecords() {
    return this.animalServie.getHealthRecordsForDashboard();
  }

  //Fetching all the checkup records data for dashboard graph
  @UseGuards(JwtAuthGuard)
  @Get('get-graph-data-dashboard-checkup')
  @ApiOperation({ summary: 'Fetching checkup graph data for dashboard' })
  @ApiOkResponse({
    description: 'Graph data fetched successfully for dashboard checkups',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    description:
      'Select the period for the data range',
    example: 'Week',
    enum: ['Week', 'Month', 'Quarter', 'Year'],
  })
  async getDashboardGraphCheckupRecords(@Query('query') query: string) {
    return this.animalServie.getHealthRecordsForDashboardGraph(query);
  }

   //Fetching the list of feed stock records
  @UseGuards(JwtAuthGuard)
  @Get('get-dashboard-feed-stock-records')
  @ApiOperation({ summary: 'Fetching feed stock records for dashboard view' })
  @ApiOkResponse({
    description: 'Feed stock dashboard records fetched successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Select the period for the data range',
    example: 'Week',
    enum: ['Week', 'Month', 'Quarter', 'Year'],
  })
  async getDashboardFeedStockRecords(@Query('query') query: string) {
    return this.animalServie.getDashboardFeedStockRecords(query);
  }

  //Adding a new calf
  @UseGuards(JwtAuthGuard)
  @Post('add-new-calf')
  @ApiOperation({ summary: 'Add a new calf record' })
  @ApiBody({ type: AddNewCalfDto })
  @ApiCreatedResponse({ description: 'New calf added successfully!' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access - JWT token required' })
  async addNewCalf(@Body() calfDto: AddNewCalfDto) {
    return this.animalServie.addNewCalf(calfDto);
  }

  // Showing the list all calfs
  @UseGuards(JwtAuthGuard)
  @Get('get-all-calfs/:cattleName')
  @ApiOperation({ summary: 'Get all calf records by parent cattle name' })
  @ApiParam({ name: 'cattleName', required: true, example: 'Kaveri-01', description: 'Name of the parent cattle' })
  @ApiOkResponse({ description: 'Fetched all calf records successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access - JWT token required' })
  async getAllCalf(@Param('cattleName') cattleName: string) {
    if (!/^[A-Za-z]+-\d+$/.test(cattleName)) {
      throw new BadRequestException('Invalid cattle name format');
    }
    return this.animalServie.allCalfDetails(cattleName);
  }

  // Creating a dynamic id for cattle name
  @UseGuards(JwtAuthGuard)
  @Get('generate-cattleId/:type')
  @ApiOperation({ summary: 'Generating a unique cattle id'})
  @ApiParam({ name: 'type', required: true, example: 'COW', description: 'Name of the cattle type' })
  @ApiOkResponse({ description: 'New cattle id created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access - JWT token required' })
  async generateCattleId(@Param('type') type:string) {
    return this.animalServie.generateCattleId(type)
  }

  //Creating a dynamic id for calf
  @UseGuards(JwtAuthGuard)
  @Get('generate-calfId/:type')
  @ApiOperation({ summary: 'Generating a unique calf id'})
  @ApiParam({ name: 'type', required: true, example: 'COW', description: 'Name of the cattle type' })
  @ApiOkResponse({ description: 'New calf id created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access - JWT token required' })
  async generateCalfId(@Param('type') type:string) {
    return this.animalServie.generateCalfId(type)
  }

}
