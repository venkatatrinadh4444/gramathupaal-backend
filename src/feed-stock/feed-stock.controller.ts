import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeedStockService } from './feed-stock.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddFeedStock } from './dto/add-feed-stock.dto';

@ApiTags('Feed Stock Management')
@ApiBearerAuth('access-token')
@Controller('api/dashboard/feed-stock')
export class FeedStockController {
  constructor(private readonly feedStockService: FeedStockService) {}

  //Add new feed stock record
  @UseGuards(JwtAuthGuard)
  @Post('add-new')
  @ApiOperation({ summary: 'Add a new feed stock record' })
  @ApiBody({ type: AddFeedStock })
  @ApiCreatedResponse({
    description: 'Feed stock added successfully!',
    schema: {
      example: {
        stockName: 'Corn',
        quantity: 200,
        date: '2025-06-12',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for request body',
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
  async addFeedStock(@Body() feedDto: AddFeedStock,@Request() req:any) {
    const userId=req?.user?.id
    return this.feedStockService.addNewStock(feedDto,userId);
  }

  //Fetch all feed records
  @UseGuards(JwtAuthGuard)
  @Get('all-records/:page')
  @ApiOperation({ summary: 'Get all feed stock records' })
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
      example: 'KG',
    })
    @ApiQuery({
      name: 'search',
      required: false,
      description:
        'Search string for filterin data based on the stock name',
      example: 'Gross',
    })
  @ApiOkResponse({
    description: 'List of all feed stock records',
    type: [AddFeedStock],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async gettingAllFeedStockRecords(@Param('page',ParseIntPipe) page:number , @Query('sortBy') sortBy:string , @Query('filter') filter:string , @Query('search') search:string) {
    return this.feedStockService.gettingAllFeedRecords(page,sortBy,filter,search);
  }

  //Fetch specific feed record history
  @UseGuards(JwtAuthGuard)
  @Get('specific-record-history/:id')
  @ApiOperation({ summary: 'Get history for a specific feed stock record' })
  @ApiParam({
    name: 'id',
    required: true,
    example: 3,
    description: 'Enter a valid feed stock record ID',
  })
  @ApiOkResponse({
    description: 'Feed stock record history retrieved successfully',
    schema: {
      example: [
        {
          id: 3,
          stockName: 'Corn',
          quantity: 100,
          date: '2025-05-01',
        },
        {
          id: 3,
          stockName: 'Corn',
          quantity: 200,
          date: '2025-06-01',
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid feed stock ID',
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
  async gettingSpecificRecordHistory(@Param('id', ParseIntPipe) id: number) {
    return this.feedStockService.gettingParticularStockRecordHistory(id);
  }

  //Get all the stock names
  @UseGuards(JwtAuthGuard)
  @Get('get-all-stock-names')
  @ApiOperation({ summary: 'Get all feed stock names' })
  @ApiOkResponse({
    description: 'List of all feed stock names',
    schema: {
      example: ['Corn', 'Soybean', 'Wheat'],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - JWT token required',
  })
  async gettingAllStockNames() {
    return this.feedStockService.gettingAllFeedStockNames();
  }
}
