import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddMilkRecordDto } from './dto/add-milk-record.dto';
import { PrismaService } from '../prisma/prisma.service';
import { catchBlock } from '../common/catch-block';
import { CattleType, SelectedMilkGrade } from '@prisma/client';

@Injectable()
export class MilkService {
  constructor(private readonly prisma: PrismaService) {}

  //Add new milk record
  async addNewMilkRecord(milkDto: AddMilkRecordDto, userId: number) {
    try {
      const { cattleId, date, ...restOfValues } = milkDto;
      (await this.prisma.cattle.findFirst({
        where: { cattleName: cattleId },
      })) ||
        (() => {
          throw new NotFoundException('No animal found with the id');
        })();

      await this.prisma.milk.create({
        data: {
          cattle: {
            connect: {
              cattleName: cattleId,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          date: new Date(date),
          ...restOfValues,
        },
      });

      return { message: 'New milk record added successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching all milk records
  async gettingAllMilkRecords(
    page: number,
    sortBy: string,
    filter: string,
    search: string,
  ) {
    try {
      const skip = (page - 1) * 25;
      const limit = 25;
      let message = 'showing initial milk data';

      let totalCount = await this.prisma.milk.count();

      let allRecords = await this.prisma.milk.findMany({
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
          date: true,
          morningMilk: true,
          afternoonMilk: true,
          eveningMilk: true,
          milkGrade: true,
        },
        skip: skip,
        take: limit,
      });

      if (sortBy) {
        message = 'showing the sorted data';
        switch (sortBy) {
          case 'name-asc':
            allRecords = await this.prisma.milk.findMany({
              orderBy: {
                cattle: {
                  cattleName: 'asc',
                },
              },
              select: {
                cattle: {
                  select: {
                    image1: true,
                    type: true,
                    cattleName: true,
                  },
                },
                id: true,
                date: true,
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
                milkGrade: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          case 'name-desc':
            allRecords = await this.prisma.milk.findMany({
              orderBy: {
                cattle: {
                  cattleName: 'desc',
                },
              },
              select: {
                cattle: {
                  select: {
                    image1: true,
                    type: true,
                    cattleName: true,
                  },
                },
                id: true,
                date: true,
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
                milkGrade: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          case 'newest':
            allRecords = await this.prisma.milk.findMany({
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
                date: true,
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
                milkGrade: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          case 'oldest':
            allRecords = await this.prisma.milk.findMany({
              orderBy: { date: 'asc' },
              select: {
                cattle: {
                  select: {
                    image1: true,
                    type: true,
                    cattleName: true,
                  },
                },
                id: true,
                date: true,
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
                milkGrade: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          default:
            throw new BadRequestException('Please enter a valid query value');
        }
      }

      if (filter) {
        message = 'showing the filtered data';
        switch (filter) {
          case filter as CattleType:
            if (!Object.values(CattleType).includes(filter as CattleType)) {
              throw new BadRequestException('please enter a valid cattle type');
            }
            totalCount = await this.prisma.milk.count({
              where: {
                cattle: {
                  type: filter,
                },
              },
            });
            allRecords = await this.prisma.milk.findMany({
              where: {
                cattle: {
                  type: filter,
                },
              },
              select: {
                cattle: {
                  select: {
                    image1: true,
                    type: true,
                    cattleName: true,
                  },
                },
                id: true,
                date: true,
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
                milkGrade: true,
              },
              skip: skip,
              take: limit,
            });
            break;
          default:
            throw new BadRequestException('Please enter a valid query value');
        }
      }

      if (search) {
        message = `Showing the filtered data for ${search}`;
        totalCount = await this.prisma.milk.count({
          where: {
            cattle: {
              cattleName: {
                contains: search.toLowerCase(),
                mode: 'insensitive',
              },
            },
          },
        });
        allRecords = await this.prisma.milk.findMany({
          where: {
            cattle: {
              cattleName: {
                contains: search.toLowerCase(),
                mode: 'insensitive',
              },
            },
          },
          select: {
            cattle: {
              select: {
                image1: true,
                type: true,
                cattleName: true,
              },
            },
            id: true,
            date: true,
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
            milkGrade: true,
          },
          skip: skip,
          take: limit,
        });
      }

      const milkOverview = {
        allRecords,
        totalPages: Math.ceil(totalCount / 25),
        totalRecordsCount: totalCount,
      };

      return { message, milkOverview };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching specific animal milk records
  async gettingParticularAnimalMilkRecords(cattleName: string) {
    try {
      const animal =
        (await this.prisma.cattle.findFirst({ where: { cattleName } })) ||
        (() => {
          throw new NotFoundException('No animal found with the Id');
        })();

      const allRecords = await this.prisma.milk.findMany({
        where: { cattleId: cattleName },
        orderBy: { date: 'desc' },
      });

      const records = await this.prisma.milk.findMany({
        where: { cattleId: cattleName },
        select: { milkGrade: true },
      });

      const gradeCount: Record<string, number> = {};

      for (const record of records) {
        const grade = record.milkGrade;
        if (grade) {
          gradeCount[grade] = (gradeCount[grade] || 0) + 1;
        }
      }

      // Find the grade with the highest count
      const mostFrequentGrade = Object.entries(gradeCount).reduce(
        (a, b) => (b[1] > a[1] ? b : a),
        ['', 0],
      )[0];

      const specificAnimalRecords = {
        animal,
        allRecords,
        averageMilkGrade: mostFrequentGrade || null,
      };

      return {
        message: `Showing all milk records of ${cattleName}`,
        specificAnimalRecords,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Update specific milk record
  async updateParticularMilkRecord(id: number, milkDto: AddMilkRecordDto) {
    try {
      const { cattleId, date, ...restOfData } = milkDto;

      (await this.prisma.milk.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No record found with the id');
        })();

      (await this.prisma.cattle.findFirst({
        where: { cattleName: cattleId },
      })) ||
        (() => {
          throw new NotFoundException('No record found with the cattle name');
        })();

      await this.prisma.milk.update({
        where: { id },
        data: {
          date: new Date(date),
          ...restOfData,
        },
      });

      const updatedDetails = await this.prisma.milk.findMany({
        where: { cattleId },
        orderBy: { date: 'desc' },
      });

      return {
        message: 'Milk record details updated successfully!',
        updatedDetails,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Delete specific milk record
  async deleteParticularAnimalMilkRecords(id: number) {
    try {
      const milkRecord =
        (await this.prisma.milk.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No milk record found with the id');
        })();
      await this.prisma.milk.delete({ where: { id } });

      return {
        message: 'Milk record deleted successfully',
        allRecords: await this.prisma.milk.findMany({
          where: { cattleId: milkRecord.cattleId },
          orderBy: { date: 'desc' },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching the data for milk dashboard
  async dashboardData(session: string, date: string) {
    try {
      if (session === 'Today') {
        const startTime = new Date();
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(23, 59, 59, 999);

        const totalMilk = await this.prisma.milk.aggregate({
          where: {
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const a1Milk = await this.prisma.milk.aggregate({
          where: {
            milkGrade: 'A1',
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const a2Milk = await this.prisma.milk.aggregate({
          where: {
            milkGrade: 'A2',
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const cowA1Milk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                type: 'COW',
              },
              milkGrade: SelectedMilkGrade.OneCowA1,
              date: {
                gte: startTime,
                lte: endTime,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const cowA2Milk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                type: 'COW',
              },
              milkGrade: SelectedMilkGrade.OneCowA2,
              date: {
                gte: startTime,
                lte: endTime,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const buffaloMilk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                type: 'BUFFALO',
              },
              date: {
                gte: startTime,
                lte: endTime,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const karampasuMilk = await this.prisma.milk.aggregate({
          where: {
            cattle: {
              breed: 'KARAMPASU',
            },
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const dashboardData = {
          totalMilk:
            Number(totalMilk._sum.morningMilk) +
            Number(totalMilk._sum.afternoonMilk) +
            Number(totalMilk._sum.eveningMilk),

          a1Milk:
            Number(a1Milk._sum.morningMilk) +
            Number(a1Milk._sum.afternoonMilk) +
            Number(a1Milk._sum.eveningMilk),

          a2Milk:
            Number(a2Milk._sum.morningMilk) +
            Number(a2Milk._sum.afternoonMilk) +
            Number(a2Milk._sum.eveningMilk),

          cowA1Milk:
            Number(cowA1Milk._sum.morningMilk) +
            Number(cowA1Milk._sum.afternoonMilk) +
            Number(cowA1Milk._sum.eveningMilk),

          cowA2Milk:
            Number(cowA2Milk._sum.morningMilk) +
            Number(cowA2Milk._sum.afternoonMilk) +
            Number(cowA2Milk._sum.eveningMilk),

          buffaloMilk:
            Number(buffaloMilk._sum.morningMilk) +
            Number(buffaloMilk._sum.afternoonMilk) +
            Number(buffaloMilk._sum.eveningMilk),

          karampasuMilk:
            Number(karampasuMilk._sum.morningMilk) +
            Number(karampasuMilk._sum.afternoonMilk) +
            Number(karampasuMilk._sum.eveningMilk),
        };

        return {
          message: 'Showing all the dashboard data for Today',
          dashboardData,
        };
      }

      if (session) {
        const startTime = new Date();
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(23, 59, 59, 999);

        const totalMilk = await this.prisma.milk.aggregate({
          where: {
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });
        const a1Milk = await this.prisma.milk.aggregate({
          where: {
            milkGrade: 'A1',
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });
        const a2Milk = await this.prisma.milk.aggregate({
          where: {
            milkGrade: 'A2',
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const cowA1Milk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                type: 'COW',
              },
              milkGrade: SelectedMilkGrade.OneCowA1,
              date: {
                gte: startTime,
                lte: endTime,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const cowA2Milk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                type: 'COW',
              },
              milkGrade: SelectedMilkGrade.OneCowA2,
              date: {
                gte: startTime,
                lte: endTime,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const buffaloMilk = await this.prisma.milk.aggregate({
          where: {
            cattle: {
              type: 'BUFFALO',
            },
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const karampasuMilk = await this.prisma.milk.aggregate({
          where: {
            cattle: {
              breed: 'KARAMPASU',
            },
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        switch (session) {
          case 'Morning':
            return {
              message: 'Showing all milk summary of morning',
              dashboardData: {
                totalMilk: totalMilk._sum.morningMilk ?? 0,
                a1Milk: a1Milk._sum.morningMilk ?? 0,
                a2Milk: a2Milk._sum.morningMilk ?? 0,
                cowA1Milk: cowA1Milk._sum.morningMilk ?? 0,
                cowA2Milk: cowA2Milk._sum.morningMilk ?? 0,
                buffaloMilk: buffaloMilk._sum.morningMilk ?? 0,
                karampasuMilk: karampasuMilk._sum.morningMilk ?? 0,
              },
            };
          case 'Afternoon':
            return {
              message: 'Showing all milk summary of afternoon',
              dashboardData: {
                totalMilk: totalMilk._sum.afternoonMilk ?? 0,
                a1Milk: a1Milk._sum.afternoonMilk ?? 0,
                a2Milk: a2Milk._sum.afternoonMilk ?? 0,
                cowA1Milk: cowA1Milk._sum.afternoonMilk ?? 0,
                cowA2Milk: cowA2Milk._sum.afternoonMilk ?? 0,
                buffaloMilk: buffaloMilk._sum.afternoonMilk ?? 0,
                karampasuMilk: karampasuMilk._sum.afternoonMilk ?? 0,
              },
            };
          case 'Evening':
            return {
              message: 'Showing all milk summary of evening',
              dashboardData: {
                totalMilk: totalMilk._sum.eveningMilk ?? 0,
                a1Milk: a1Milk._sum.eveningMilk ?? 0,
                a2Milk: a2Milk._sum.eveningMilk ?? 0,
                cowA1Milk: cowA1Milk._sum.eveningMilk ?? 0,
                cowA2Milk: cowA2Milk._sum.eveningMilk ?? 0,
                buffaloMilk: buffaloMilk._sum.eveningMilk ?? 0,
                karampasuMilk: karampasuMilk._sum.eveningMilk ?? 0,
              },
            };
        }
      }

      if (date) {
        const start = new Date(date);
        start.setHours(0,0,0,0)
        const end = new Date(date);
        end.setUTCHours(23, 59, 59, 999);

        const totalMilk = await this.prisma.milk.aggregate({
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });
        const a1Milk = await this.prisma.milk.aggregate({
          where: {
            milkGrade: 'A1',
            date: {
              gte: start,
              lte: end,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });
        const a2Milk = await this.prisma.milk.aggregate({
          where: {
            milkGrade: 'A2',
            date: {
              gte: start,
              lte: end,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const cowA1Milk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                type: 'COW',
              },
              milkGrade: SelectedMilkGrade.OneCowA1,
              date: {
                gte: start,
                lte: end,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const cowA2Milk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                type: 'COW',
              },
              milkGrade: SelectedMilkGrade.OneCowA2,
              date: {
                gte: start,
                lte: end,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const buffaloMilk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                type: 'BUFFALO',
              },
              date: {
                gte: start,
                lte: end,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const karampasuMilk = await this.prisma.milk.aggregate({
          where: {
            AND: {
              cattle: {
                breed: 'KARAMPASU',
              },
              date: {
                gte: start,
                lte: end,
              },
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const dashboardData = {
          totalMilk:
            Number(totalMilk._sum.morningMilk) +
            Number(totalMilk._sum.afternoonMilk) +
            Number(totalMilk._sum.eveningMilk),

          a1Milk:
            Number(a1Milk._sum.morningMilk) +
            Number(a1Milk._sum.afternoonMilk) +
            Number(a1Milk._sum.eveningMilk),

          a2Milk:
            Number(a2Milk._sum.morningMilk) +
            Number(a2Milk._sum.afternoonMilk) +
            Number(a2Milk._sum.eveningMilk),

          cowA1Milk:
            Number(cowA1Milk._sum.morningMilk) +
            Number(cowA1Milk._sum.afternoonMilk) +
            Number(cowA1Milk._sum.eveningMilk),

          cowA2Milk:
            Number(cowA2Milk._sum.morningMilk) +
            Number(cowA2Milk._sum.afternoonMilk) +
            Number(cowA2Milk._sum.eveningMilk),

          buffaloMilk:
            Number(buffaloMilk._sum.morningMilk) +
            Number(buffaloMilk._sum.afternoonMilk) +
            Number(buffaloMilk._sum.eveningMilk),

          karampasuMilk:
            Number(karampasuMilk._sum.morningMilk) +
            Number(karampasuMilk._sum.afternoonMilk) +
            Number(karampasuMilk._sum.eveningMilk),
        };
        return {
          message: `Showing all the dashboard data based on date ${date}`,
          dashboardData,
        };
      }

      throw new BadRequestException(
        'Please enter a valid session or date as query value',
      );
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetch monthly wise milk production data
  async getMonthlyMilkProductionTable(session: string) {
    try {
      const allMonthsData: any[] = [];

      for (let month = 0; month < 12; month++) {
        const startDate = new Date();
        const endDate = new Date();

        // Set to start of the month
        startDate.setMonth(month, 1);
        startDate.setHours(0, 0, 0, 0);

        // Set to end of the month
        endDate.setMonth(month + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        const milkRecords = await this.prisma.milk.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            cattle: {
              select: {
                type: true, // Expecting 'COW', 'GOAT', 'BUFFALO'
              },
            },
          },
        });

        const totals = {
          cow: 0,
          goat: 0,
          buffalo: 0,
        };

        for (const milk of milkRecords) {
          const type = milk.cattle.type.toLowerCase(); // 'cow', 'goat', 'buffalo'
          let value = 0;

          switch (session) {
            case 'Morning':
              value = Number(milk.morningMilk);
              break;
            case 'Afternoon':
              value = Number(milk.afternoonMilk);
              break;
            case 'Evening':
              value = Number(milk.eveningMilk);
              break;
            case 'Overall':
              value =
                Number(milk.morningMilk) +
                Number(milk.afternoonMilk) +
                Number(milk.eveningMilk);
              break;
            default:
              throw new BadRequestException('Please enter a valid query value');
          }

          if (totals[type] !== undefined) {
            totals[type] += value;
          }
        }

        const totalMilk = totals.cow + totals.goat + totals.buffalo;

        allMonthsData.push({
          month: startDate.toLocaleString('default', { month: 'long' }), // "January", etc.
          cowMilk: totals.cow,
          goatMilk: totals.goat,
          buffaloMilk: totals.buffalo,
          totalMilk: totalMilk,
        });
      }

      return {
        message: `Monthly Milk Report (${session?.toUpperCase()})`,
        data: allMonthsData,
      };
    } catch (err) {
      catchBlock(err);
    }
  }
}
