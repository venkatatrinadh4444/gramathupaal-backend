import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsumedFeedDto } from './dto/consumed-feed.dto';
import { catchBlock } from '../common/catch-block';
import { CattleType, SelectedSession, SelectedUnit } from '@prisma/client';

@Injectable()
export class FeedManagementService {
  constructor(private readonly prisma: PrismaService) {}

  //Add new feed consumption record
  async addFeedRecord(feedDto: ConsumedFeedDto, userId: number) {
    try {
      const { feedName, type, cattleName, quantity, date, session, feedType } =
        feedDto;
      (await this.prisma.cattle.findFirst({
        where: {
          AND: {
            type,
            cattleName,
          },
        },
      })) ||
        (() => {
          throw new NotFoundException('No cattle found with the given details');
        })();

      if (feedType === 'WATER') {
        await this.prisma.feedConsumption.create({
          data: {
            cattle: {
              connect: {
                cattleName: cattleName,
              },
            },
            user: {
              connect: {
                id: userId,
              },
            },
            feedName: 'Water',
            unit: 'Litres',
            quantity,
            session,
            date: new Date(date),
            feedType,
          },
        });

        return {
          message: 'New water consumption record added successfully!',
          allRecords: await this.prisma.feedConsumption.findMany({
            orderBy: { date: 'desc' },
            select: {
              cattle: {
                select: {
                  image1: true,
                  type: true,
                  cattleName: true,
                },
              },
              id: true,
              feedName: true,
              session: true,
              date: true,
              quantity: true,
              feedType: true,
            },
          }),
        };
      }

      const feedRecord =
        (await this.prisma.feedStock.findFirst({
          where: { name: feedName },
        })) ||
        (() => {
          throw new NotFoundException('No feed stock found with the name');
        })();

      if (Number(quantity) > Number(feedRecord.quantity)) {
        throw new BadRequestException(
          'Quantity must be less than total feed stock quantity',
        );
      }

      await this.prisma.feedConsumption.create({
        data: {
          cattle: {
            connect: {
              cattleName: cattleName,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          feedName,
          feedType,
          unit: feedRecord.unit,
          quantity,
          session,
          date: new Date(date),
        },
      });

      await this.prisma.feedStock.update({
        where: { id: feedRecord.id },
        data: {
          quantity: Number(feedRecord.quantity) - Number(quantity),
        },
      });

      await this.prisma.feedStockHistory.create({
        data: {
          feedStock: {
            connect: {
              id: feedRecord.id,
            },
          },
          type: 'Consumed',
          newQuantity: quantity,
        },
      });

      return {
        message: 'New feed consumption record added successfully!',
        allRecords: await this.prisma.feedConsumption.findMany({
          orderBy: { date: 'desc' },
          select: {
            cattle: {
              select: {
                image1: true,
                type: true,
                cattleName: true,
              },
            },
            id: true,
            feedName: true,
            session: true,
            date: true,
            quantity: true,
          },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching all feed records
  async gettingAllFeedRecords(
    page: number,
    sortBy: string,
    filter: string[],
    search: string,
    fromDate:string,
    toDate:string
  ) {
    try {
      const skip = (page - 1) * 25;
      const limit = 25;
      let message = 'Showing intial fetched data';
      let totalCount = await this.prisma.feedConsumption.count();
      let allFeedRecords = await this.prisma.feedConsumption.findMany({
        orderBy: { date: 'desc' },
        select: {
          cattle: {
            select: {
              image1: true,
              type: true,
              cattleName: true,
            },
          },
          id: true,
          feedName: true,
          session: true,
          date: true,
          unit: true,
          quantity: true,
        },
        skip: skip,
        take: limit,
      });

      if (sortBy) {
        message = `Showing sorted data based on ${sortBy}`;
        switch (sortBy) {
          case 'name-asc':
            allFeedRecords = await this.prisma.feedConsumption.findMany({
              orderBy: { feedName: 'asc' },
              select: {
                cattle: {
                  select: {
                    image1: true,
                    type: true,
                    cattleName: true,
                  },
                },
                id: true,
                feedName: true,
                session: true,
                date: true,
                unit: true,
                quantity: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          case 'name-desc':
            allFeedRecords = await this.prisma.feedConsumption.findMany({
              orderBy: { feedName: 'desc' },
              select: {
                cattle: {
                  select: {
                    image1: true,
                    type: true,
                    cattleName: true,
                  },
                },
                id: true,
                feedName: true,
                session: true,
                date: true,
                unit: true,
                quantity: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          case 'newest':
            allFeedRecords = await this.prisma.feedConsumption.findMany({
              orderBy: { date: 'desc' },
              select: {
                cattle: {
                  select: {
                    image1: true,
                    type: true,
                    cattleName: true,
                  },
                },
                id: true,
                feedName: true,
                session: true,
                date: true,
                unit: true,
                quantity: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          case 'oldest':
            allFeedRecords = await this.prisma.feedConsumption.findMany({
              orderBy: { feedName: 'asc' },
              select: {
                cattle: {
                  select: {
                    image1: true,
                    type: true,
                    cattleName: true,
                  },
                },
                id: true,
                feedName: true,
                session: true,
                date: true,
                unit: true,
                quantity: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          default:
            throw new BadRequestException('Please enter a valid query value');
        }
      }

      if (filter && Array.isArray(filter)) {
        message = `Showing filtered data based on selected filters`;

        const sessions: SelectedSession[] = [];
        const units: SelectedUnit[] = [];
        const types: CattleType[] = [];
        const feedNameKeywords: string[] = [];

        filter.forEach((f) => {
          const upper = f.toUpperCase();

          if (
            Object.values(SelectedSession).includes(upper as SelectedSession)
          ) {
            sessions.push(upper as SelectedSession);
          } else if (
            Object.values(SelectedUnit).includes(upper as SelectedUnit)
          ) {
            units.push(upper as SelectedUnit);
          } else if (Object.values(CattleType).includes(upper as CattleType)) {
            types.push(upper as CattleType);
          } else {
            feedNameKeywords.push(f); // For AND keyword search
          }
        });

        const where:any = {
          AND: [],
        };

        if (sessions.length > 0) {
          where.AND.push({ session: { in: sessions } });
        }

        if (units.length > 0) {
          where.AND.push({ unit: { in: units } });
        }

        if (types.length > 0) {
          where.AND.push({
            cattle: {
              type: { in: types },
            },
          });
        }

        // AND: feedName must contain all keywords
        feedNameKeywords.forEach((keyword) => {
          where.AND.push({
            feedName: {
              contains: keyword,
              mode: 'insensitive',
            },
          });
        });

        totalCount = await this.prisma.feedConsumption.count({ where });

        allFeedRecords = await this.prisma.feedConsumption.findMany({
          where,
          orderBy: { date: 'desc' },
          select: {
            cattle: {
              select: {
                image1: true,
                type: true,
                cattleName: true,
              },
            },
            id: true,
            feedName: true,
            session: true,
            date: true,
            unit: true,
            quantity: true,
          },
          skip,
          take: limit,
        });
      }

      if (search) {
        message = `Showing the data based on the ${search} value`;
        const possibleEnum = Object.values(SelectedSession).includes(
          search.toUpperCase() as SelectedSession,
        )
          ? (search.toUpperCase() as SelectedSession)
          : undefined;

        totalCount = await this.prisma.feedConsumption.count({
          where: {
            OR: [
              {
                feedName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                cattleName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                session: possibleEnum && possibleEnum,
              },
            ],
          },
        });

        allFeedRecords = await this.prisma.feedConsumption.findMany({
          where: {
            OR: [
              {
                feedName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                cattleName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                session: possibleEnum && possibleEnum,
              },
            ],
          },
          orderBy: { date: 'desc' },
          select: {
            cattle: {
              select: {
                image1: true,
                type: true,
                cattleName: true,
              },
            },
            id: true,
            feedName: true,
            session: true,
            date: true,
            unit: true,
            quantity: true,
          },
          skip,
          take: limit,
        });
      }

      if(fromDate && toDate) {
        message = `Showing the data based on ${fromDate} to ${toDate}`
        const startDate = new Date(fromDate)
        startDate.setHours(0,0,0,0)
        const endDate = new Date(toDate)
        endDate.setHours(23,59,59,999)

        totalCount = await this.prisma.feedConsumption.count({
          where:{
            date:{
              gte:startDate,
              lte:endDate
            }
          }
        });
        allFeedRecords = await this.prisma.feedConsumption.findMany({
          where:{
            date:{
              gte:startDate,
              lte:endDate
            }
          },
          orderBy: { date: 'desc' },
          select: {
            cattle: {
              select: {
                image1: true,
                type: true,
                cattleName: true,
              },
            },
            id: true,
            feedName: true,
            session: true,
            date: true,
            unit: true,
            quantity: true,
          },
          skip: skip,
          take: limit,
        });
      }

      const feedManagementOverview = {
        allFeedRecords,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / 25),
      };

      return {
        message,
        feedManagementOverview,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetch specific animal feed consumption records
  async gettingParticularAnimalFeedRecords(cattleName: string) {
    try {
      const animal =
        (await this.prisma.cattle.findFirst({
          where: { cattleName },
          select: {
            image1: true,
            image2: true,
            cattleName: true,
            active: true,
            type: true,
          },
        })) ||
        (() => {
          throw new NotFoundException('No animal found with the cattle name');
        })();
      const allFeedRecords = await this.prisma.feedConsumption.findMany({
        where: { cattleName },
        orderBy: { date: 'desc' },
      });

      const avgWaterConsumption = await this.prisma.feedConsumption.aggregate({
        where: {
          feedName: {
            equals: 'Water',
          },
          cattleName,
        },
        _avg: {
          quantity: true,
        },
      });
      const avgFeedConsumption = await this.prisma.feedConsumption.aggregate({
        where: {
          feedName: {
            not: 'Water',
          },
          cattleName,
        },
        _avg: {
          quantity: true,
        },
      });

      const specificCattleDetials = {
        animal,
        allFeedRecords,
        avgWaterConsumption: avgWaterConsumption._avg.quantity ?? 0,
        avgFeedConsumption: avgFeedConsumption._avg.quantity ?? 0,
      };

      return {
        message: `Showing the details of the cattle ${cattleName}`,
        specificCattleDetials,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Edit a specific consumption record
  async editParticularFeedRecord(id: number, feedDto: ConsumedFeedDto) {
    try {
      const specificFeedRecord =
        (await this.prisma.feedConsumption.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No record found with the id');
        })();

      const { feedName, type, cattleName, quantity, date, session } = feedDto;

      if (specificFeedRecord.cattleName !== cattleName) {
        throw new BadRequestException(
          'Cattle name was not matching, enter the same cattle name',
        );
      }

      const animal =
        (await this.prisma.cattle.findFirst({
          where: {
            AND: {
              type,
              cattleName,
            },
          },
          select: {
            image1: true,
            image2: true,
            cattleName: true,
            active: true,
            type: true,
          },
        })) ||
        (() => {
          throw new NotFoundException('No cattle found with the given details');
        })();

      if (feedName === 'Water') {
        await this.prisma.feedConsumption.update({
          where: {
            id,
          },
          data: {
            feedName,
            unit: 'Litres',
            quantity,
            session,
            date: new Date(date),
          },
        });

        const allFeedRecords = await this.prisma.feedConsumption.findMany({
          where: { cattleName },
          orderBy: { date: 'desc' },
        });

        const avgWaterConsumption = await this.prisma.feedConsumption.aggregate(
          {
            where: {
              feedName: {
                equals: 'Water',
              },
              cattleName,
            },
            _avg: {
              quantity: true,
            },
          },
        );
        const avgFeedConsumption = await this.prisma.feedConsumption.aggregate({
          where: {
            feedName: {
              not: 'Water',
            },
            cattleName,
          },
          _avg: {
            quantity: true,
          },
        });

        const specificCattleDetials = {
          animal,
          allFeedRecords,
          avgWaterConsumption: avgWaterConsumption._avg.quantity ?? 0,
          avgFeedConsumption: avgFeedConsumption._avg.quantity ?? 0,
        };

        return {
          message: 'Water consumption record updated successfully!',
          specificCattleDetials,
        };
      }

      const feedRecord =
        (await this.prisma.feedStock.findFirst({
          where: { name: feedName },
        })) ||
        (() => {
          throw new NotFoundException('No feed stock found with the name');
        })();

      if (
        Number(quantity) >
        Number(specificFeedRecord.quantity) + Number(feedRecord.quantity)
      ) {
        throw new BadRequestException(
          'Quantity must be less than total stock quantity',
        );
      }

      await this.prisma.feedConsumption.update({
        where: {
          id,
        },
        data: {
          feedName,
          unit: feedRecord.unit,
          quantity,
          session,
          date: new Date(date),
        },
      });

      await this.prisma.feedStock.update({
        where: { id: feedRecord.id },
        data: {
          quantity:
            Number(specificFeedRecord.quantity) +
            Number(feedRecord.quantity) -
            Number(quantity),
        },
      });

      const targetDate = new Date(
        Math.floor(specificFeedRecord.createdAt.getTime() / 1000) * 1000,
      );

      const nextSecond = new Date(targetDate.getTime() + 1000); // 1 second after

      const feedHistoryRecord = await this.prisma.feedStockHistory.findFirst({
        where: {
          AND: {
            feedId: feedRecord?.id,
            createdAt: {
              gte: targetDate,
              lt: nextSecond,
            },
          },
        },
      });

      await this.prisma.feedStockHistory.update({
        where: {
          id: feedHistoryRecord?.id,
        },
        data: {
          type: 'Consumed',
          newQuantity: quantity,
        },
      });

      const allFeedRecords = await this.prisma.feedConsumption.findMany({
        where: { cattleName },
        orderBy: { date: 'desc' },
      });

      const avgWaterConsumption = await this.prisma.feedConsumption.aggregate({
        where: {
          feedName: {
            equals: 'Water',
          },
          cattleName,
        },
        _avg: {
          quantity: true,
        },
      });
      const avgFeedConsumption = await this.prisma.feedConsumption.aggregate({
        where: {
          feedName: {
            not: 'Water',
          },
          cattleName,
        },
        _avg: {
          quantity: true,
        },
      });

      const specificCattleDetials = {
        animal,
        allFeedRecords,
        avgWaterConsumption: avgWaterConsumption._avg.quantity ?? 0,
        avgFeedConsumption: avgFeedConsumption._avg.quantity ?? 0,
      };

      return {
        message: 'feed consumption record updated successfully!',
        specificCattleDetials,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Delete a specific feed record
  async deleteParticularFeedRecord(id: number) {
    try {
      const feedRecord =
        (await this.prisma.feedConsumption.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No record found with the given id');
        })();

      if (feedRecord?.feedType === 'WATER') {
        await this.prisma.feedConsumption.delete({ where: { id } });
        const { cattleName } = feedRecord;
        const allFeedRecords = await this.prisma.feedConsumption.findMany({
          where: { cattleName },
          orderBy: { date: 'desc' },
          select: {
            cattle: {
              select: {
                cattleName: true,
                type: true,
                active: true,
              },
            },
            id: true,
            date: true,
            feedName: true,
            unit: true,
            session: true,
            quantity: true,
          },
        });

        const avgWaterConsumption = await this.prisma.feedConsumption.aggregate(
          {
            where: {
              feedName: {
                equals: 'Water',
              },
              cattleName,
            },
            _avg: {
              quantity: true,
            },
          },
        );
        const avgFeedConsumption = await this.prisma.feedConsumption.aggregate({
          where: {
            feedName: {
              not: 'Water',
            },
            cattleName,
          },
          _avg: {
            quantity: true,
          },
        });

        const specificCattleDetials = {
          allFeedRecords,
          avgWaterConsumption,
          avgFeedConsumption,
        };

        return {
          message: 'Water record deleted successfully',
          specificCattleDetials,
        };
      }

      await this.prisma.feedConsumption.delete({ where: { id } });

      const feedStockSpecificId = await this.prisma.feedStock.findFirst({
        where: { name: feedRecord.feedName },
      });

      await this.prisma.feedStock.update({
        where: { id: feedStockSpecificId?.id },
        data: {
          quantity:
            Number(feedStockSpecificId?.quantity) +
            Number(feedRecord?.quantity),
        },
      });

      const targetDate = new Date(
        Math.floor(feedRecord.createdAt.getTime() / 1000) * 1000,
      );

      const nextSecond = new Date(targetDate.getTime() + 1000); // 1 second after

      const feedHistoryRecord = await this.prisma.feedStockHistory.findFirst({
        where: {
          AND: {
            feedId: feedStockSpecificId?.id,
            createdAt: {
              gte: targetDate,
              lt: nextSecond,
            },
          },
        },
      });

      await this.prisma.feedStockHistory.delete({
        where: { id: feedHistoryRecord?.id },
      });

      const { cattleName } = feedRecord;

      const allFeedRecords = await this.prisma.feedConsumption.findMany({
        where: { cattleName },
        orderBy: { date: 'desc' },
        select: {
          cattle: {
            select: {
              cattleName: true,
              type: true,
              active: true,
            },
          },
          id: true,
          date: true,
          feedName: true,
          unit: true,
          session: true,
          quantity: true,
        },
      });

      const avgWaterConsumption = await this.prisma.feedConsumption.aggregate({
        where: {
          feedName: {
            equals: 'Water',
          },
          cattleName,
        },
        _avg: {
          quantity: true,
        },
      });
      const avgFeedConsumption = await this.prisma.feedConsumption.aggregate({
        where: {
          feedName: {
            not: 'Water',
          },
          cattleName,
        },
        _avg: {
          quantity: true,
        },
      });

      const specificCattleDetials = {
        allFeedRecords,
        avgWaterConsumption,
        avgFeedConsumption,
      };

      return {
        message: 'Feed record deleted successfully!',
        specificCattleDetials,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Filter feed records by a specific date
  async getFeedRecordsForSpecificDate(
    cattleName: string,
    fromDate: string,
    toDate: string,
  ) {
    try {
      const startTime = new Date(fromDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(toDate);
      endTime.setHours(23, 59, 59, 999);

      const allRecords = await this.prisma.feedConsumption.findMany({
        where: {
          cattleName: cattleName,
          date: {
            gte: startTime,
            lte: endTime,
          },
        },
        orderBy: { date: 'desc' },
      });

      return {
        message: `Showing all milk records for ${fromDate} to ${toDate}`,
        allRecords,
      };
    } catch (err) {
      catchBlock(err);
    }
  }
}
