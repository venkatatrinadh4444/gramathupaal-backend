import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  BadRequestException,
  Delete,
  Request,
  Query,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeedManagementService } from './feed-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConsumedFeedDto } from './dto/consumed-feed.dto';
import { matches } from 'class-validator';

@ApiTags('Feed Management')
@ApiBearerAuth('access-token')
@Controller('api/dashboard/feed-management')
export class FeedManagementController {
  constructor(private readonly feedManagementService: FeedManagementService) {}

  //Add new feed consumption record
  @UseGuards(JwtAuthGuard)
  @Post('add-new-record')
  @ApiOperation({ summary: 'Add a new feed consumption record' })
  @ApiBody({ type: ConsumedFeedDto })
  @ApiCreatedResponse({
    description: 'New consumption record added successfully!',
    schema: {
      example: {
        cattleName: 'Kaveri-02',
        feedType: 'Hay',
        quantity: 10,
        date: '2025-06-12',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload',
    schema: {
      example: {
        statusCode: 400,
        message: ['quantity must be a number'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async addNewFeedConsumptionRecord(@Body() consumedFeedDto: ConsumedFeedDto,@Request() req:any) {
    const userId=req?.user?.id
    return this.feedManagementService.addFeedRecord(consumedFeedDto,userId);
  }

  //Fetch specific animal feed consumption records
  @UseGuards(JwtAuthGuard)
  @Get('specific-cattle-records/:cattleName')
  @ApiOperation({ summary: 'Get all feed records of a specific animal' })
  @ApiParam({
    name: 'cattleName',
    required: true,
    example: 'Kaveri-02',
    description: 'Enter a valid cattle name',
  })
  @ApiOkResponse({
    description: 'Feed records retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          cattleName: 'Kaveri-02',
          feedType: 'Hay',
          quantity: 8,
          date: '2025-06-10',
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid cattle name format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Enter a valid cattle name',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async gettingSpecificAnimalRecords(@Param('cattleName') cattleName: string) {
    if (!matches(cattleName, /^[A-Za-z]+-\d+$/)) {
      throw new BadRequestException('Enter a valid cattle name');
    }
    return this.feedManagementService.gettingParticularAnimalFeedRecords(
      cattleName,
    );
  }

  //Fetching all feed records
  @UseGuards(JwtAuthGuard)
  @Get('get-all-feed-records/:page')
  @ApiOperation({ summary: 'Get all feed records' })
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
    isArray:true,
    required: false,
    description:
      'Query string for filtering data based on breeds and cattle type("COW","BUFFALO","GOAT"),feed name,sesssion("MORNING","AFTERNOON","EVENING") and units("KG","UNITS","PACKETS")',
    example: ['COW', 'Gross','Morning'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Search string for filtering data based on feed name',
    example: 'Green Fodder',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description:
      'Specific start date to filter for feed management overview data',
    example: '2025-06-12',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description:
      'Specific end date to filter for feed management overview data',
    example: '2025-06-12',
  })
  @ApiOkResponse({
    description: 'List of all feed records',
    schema: {
      example: [
        {
          id: 1,
          cattleName: 'Kaveri-02',
          feedType: 'Corn',
          quantity: 10,
          date: '2025-06-10',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async gettingAllFeedRecords(@Param('page',ParseIntPipe) page:number , @Query('sortBy') sortBy:string , @Query('filter') filter:string[] , @Query('search') search:string,@Query('fromDate') fromDate: string,
  @Query('toDate') toDate: string) {
    const normalizedFilter = Array.isArray(filter) ? filter : filter ? [filter] : [];
    return this.feedManagementService.gettingAllFeedRecords(page,sortBy,normalizedFilter,search,fromDate,toDate);
  }

  //Edit a specific consumption record
  @UseGuards(JwtAuthGuard)
  @Put('edit-specific-record/:id')
  @ApiOperation({ summary: 'Edit a specific feed record' })
  @ApiParam({
    name: 'id',
    required: true,
    example: 1,
    description: 'Enter a valid record ID',
  })
  @ApiBody({ type: ConsumedFeedDto })
  @ApiOkResponse({
    description: 'Feed record updated successfully',
    schema: {
      example: {
        id: 1,
        cattleName: 'Kaveri-02',
        feedType: 'Wheat',
        quantity: 12,
        date: '2025-06-11',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid record ID or request body',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async editParticularFeedRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() feedDto: ConsumedFeedDto,
  ) {
    return this.feedManagementService.editParticularFeedRecord(id, feedDto);
  }

  //Delete a specific feed record
  @UseGuards(JwtAuthGuard)
  @Delete('delete-specific-record/:id')
  @ApiOperation({ summary: 'Delete a specific feed record' })
  @ApiParam({
    name: 'id',
    required: true,
    example: 1,
    description: 'Enter a valid record ID',
  })
  @ApiOkResponse({
    description: 'Feed record deleted successfully',
    schema: {
      example: {
        message: 'Feed record with ID 1 deleted successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid feed record ID',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async deleteParticularFeedRecord(@Param('id', ParseIntPipe) id: number) {
    return this.feedManagementService.deleteParticularFeedRecord(id);
  }

   // Get milk records by a specific date range
    @UseGuards(JwtAuthGuard)
    @Get('date-specific-milk-records/:cattleName')
    @ApiOperation({ summary: 'Fetching all milk records based on the date' })
    @ApiOkResponse({ description: 'Showing the data of milk records' })
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
    async gettingDateBasedMilkRecords(
      @Param('cattleName') cattleName: string,
      @Query('fromDate') fromDate: string,
      @Query('toDate') toDate: string
    ) {
      return this.feedManagementService.getFeedRecordsForSpecificDate(cattleName, fromDate,toDate);
    }
}
