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
} from '@nestjs/swagger';
import { FeedManagementService } from './feed-management.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ConsumedFeedDto } from './dto/consumed-feed.dto';
import { matches } from 'class-validator';

@ApiTags('Feed Management')
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
  @Get('get-all-feed-records')
  @ApiOperation({ summary: 'Get all feed records' })
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
  async gettingAllFeedRecords() {
    return this.feedManagementService.gettingAllFeedRecords();
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
}
