import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckupDto } from './dto/add-checkup.dto';
import { catchBlock } from '../common/catch-block';
import { EditCheckupDto } from './dto/edit-checkup.dto';
import { CattleType } from '@prisma/client';

@Injectable()
export class CheckupService {
  constructor(private readonly prisma: PrismaService) {}

  //Add new doctor checkup
  async addNewCheckup(checkupDto: CreateCheckupDto) {
    try {
      const { type, cattleName, date, ...restOfValues } = checkupDto;

      (await this.prisma.cattle.findFirst({
        where: {
          AND: {
            type,
            cattleName,
          },
        },
      })) ||
        (() => {
          throw new NotFoundException(
            'No cattle found with the type and cattle name',
          );
        })();

      await this.prisma.checkup.create({
        data: {
          cattle: {
            connect: {
              cattleName: cattleName,
            },
          },
          date: new Date(date),
          ...restOfValues,
        },
      });

      return {
        message: 'New doctor checkup added successfully!',
        allRecords: await this.prisma.checkup.findMany({
          orderBy: { date: 'desc' },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetch all the checkup records
  async fetchingAllCheckups(
    page: number,
    sortBy: string,
    filter: string,
    search: string,
  ) {
    try {
      const skip = (page - 1) * 25;
      const limit = 25;
      let message = 'Showing initial all checkup records';
      let totalCount = await this.prisma.checkup.count();
      let allCheckups = await this.prisma.checkup.findMany({
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          prescription: true,
          description: true,
          doctorName: true,
          doctorPhone: true,
          cattle: {
            select: {
              image1: true,
              active: true,
              cattleName: true,
              type: true,
            },
          },
        },
        skip:skip,
        take:limit
      });

      if (sortBy) {
        message = `Showing the sorted data based on the ${sortBy}`;
        switch (sortBy) {
          case 'name-asc':
            allCheckups = await this.prisma.checkup.findMany({
              orderBy: { prescription: 'asc' },
              select: {
                id: true,
                date: true,
                prescription: true,
                description: true,
                doctorName: true,
                doctorPhone: true,
                cattle: {
                  select: {
                    image1: true,
                    active: true,
                    cattleName: true,
                    type: true,
                  },
                },
              },
              skip:skip,
              take:limit
            });
            break;
          case 'name-desc':
            allCheckups = await this.prisma.checkup.findMany({
              orderBy: { prescription: 'desc' },
              select: {
                id: true,
                date: true,
                prescription: true,
                description: true,
                doctorName: true,
                doctorPhone: true,
                cattle: {
                  select: {
                    image1: true,
                    active: true,
                    cattleName: true,
                    type: true,
                  },
                },
              },
              skip:skip,
              take:limit
            });
            break;
          case 'newest':
            allCheckups = await this.prisma.checkup.findMany({
              orderBy: { date: 'desc' },
              select: {
                id: true,
                date: true,
                prescription: true,
                description: true,
                doctorName: true,
                doctorPhone: true,
                cattle: {
                  select: {
                    image1: true,
                    active: true,
                    cattleName: true,
                    type: true,
                  },
                },
              },
              skip:skip,
              take:limit
            });
            break;
          case 'descending':
            allCheckups = await this.prisma.checkup.findMany({
              orderBy: { date: 'asc' },
              select: {
                id: true,
                date: true,
                prescription: true,
                description: true,
                doctorName: true,
                doctorPhone: true,
                cattle: {
                  select: {
                    image1: true,
                    active: true,
                    cattleName: true,
                    type: true,
                  },
                },
              },
              skip:skip,
              take:limit
            });
            break;
          default:
            throw new BadRequestException('Please a valid sort by value');
        }
      }

      if (filter) {
        message = `Showing the filterd records based on ${filter}`;
        const type = filter.toUpperCase() as CattleType;

        if (Object.values(CattleType).includes(type)) {
          totalCount = await this.prisma.checkup.count({
            where: {
              cattle: {
                type: type,
              },
            },
          });
          allCheckups = await this.prisma.checkup.findMany({
            where: {
              cattle: {
                type: type,
              },
            },
            orderBy: { date: 'desc' },
            select: {
              id: true,
              date: true,
              prescription: true,
              description: true,
              doctorName: true,
              doctorPhone: true,
              cattle: {
                select: {
                  image1: true,
                  active: true,
                  cattleName: true,
                  type: true,
                },
              },
            },
            skip:skip,
            take:limit
          });
        }
      }

      if (search) {
        message = `Showing the searched records based on ${search}`;
        totalCount = await this.prisma.checkup.count({
          where: {
            OR: [
              {
                cattle: {
                  cattleName: {
                    contains: search.toLowerCase(),
                    mode: 'insensitive',
                  },
                },
              },
              {
                prescription: {
                  contains: search.toLowerCase(),
                  mode: 'insensitive',
                },
              },
            ],
          },
        });
        allCheckups = await this.prisma.checkup.findMany({
          where: {
            OR: [
              {
                cattle: {
                  cattleName: {
                    contains: search.toLowerCase(),
                    mode: 'insensitive',
                  },
                },
              },
              {
                prescription: {
                  contains: search.toLowerCase(),
                  mode: 'insensitive',
                },
              },
            ],
          },
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            prescription: true,
            description: true,
            doctorName: true,
            doctorPhone: true,
            cattle: {
              select: {
                image1: true,
                active: true,
                cattleName: true,
                type: true,
              },
            },
          },
          skip:skip,
          take:limit
        });
      }

      const checkupOverview = {
        allCheckups,
        totalRecordsCount : totalCount,
        totalPages : Math.ceil(totalCount/25)
      }

      return { message, checkupOverview };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetch specific animal checkup records
  async gettingParticularAnimalCheckups(cattleName: string) {
    try {
      const animal =
        (await this.prisma.cattle.findFirst({ where: { cattleName } })) ||
        (() => {
          throw new NotFoundException('No cattle found with the given name');
        })();
      const allChecupRecords = await this.prisma.checkup.findMany({
        where: { cattleName },
        orderBy: { date: 'desc' },
      });

      const checkupDetails = {
        cattleName: animal?.cattleName,
        image1: animal?.image1,
        image2: animal?.image2,
        type: animal.type,
        active: animal.active,
        lastCheckupDate: allChecupRecords[0]?.date,
        checkupCount: allChecupRecords?.length,
        allChecupRecords,
      };

      return {
        message: `Showing all the details of the ${animal.cattleName}`,
        checkupDetails,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Update specific checkup record
  async editParticularCheckupRecord(
    id: number,
    editCheckupDto: EditCheckupDto,
  ) {
    try {
      const { date, ...restOfValues } = editCheckupDto;
      (await this.prisma.checkup.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No record found with the given id');
        })();
      await this.prisma.checkup.update({
        where: { id },
        data: {
          date: new Date(date),
          ...restOfValues,
        },
      });
      return {
        message: 'Checkup report updated successfully!',
        allRecords: await this.prisma.checkup.findMany({
          orderBy: { date: 'desc' },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Delete specific checkup record
  async deleteParticularCheckupRecord(id: number) {
    try {
      (await this.prisma.checkup.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No record found with the given id');
        })();
      await this.prisma.checkup.delete({ where: { id } });
      return {
        message: 'Checkup report deleted successfully!',
        allRecords: await this.prisma.checkup.findMany({
          orderBy: { date: 'desc' },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Getting the checkup dashboard data
  async checkupDashboard(fromDate: string, toDate: string) {
    try {
      const cards = [
        {
          number: '',
          title: 'Total Checkups',
          description: 'Total health checkups done',
          status: '',
          percentage: '',
        },
        {
          number: '',
          title: 'Illness Cases',
          description: 'Reported health issues or symptoms',
          status: '',
          percentage: '',
        },
      ];

      const fetchCheckupData = async (startTime: any, endTime: any) => {
        const totalCheckups = await this.prisma.checkup.count({
          where: {
            date: {
              gte: startTime,
              lte: endTime,
            },
          },
        });
        const totalIllnessCases = await this.prisma.checkup.count({
          where: {
            date: {
              gte: startTime,
              lte: endTime,
            },
            cattle: {
              healthStatus: 'INJURED',
            },
          },
        });
        return { totalCheckups, totalIllnessCases };
      };

      function calculatePercentageChange(previous: number, current: number) {
        if (previous === 0 && current === 0) {
          return {
            status: 'no_change',
            percent: 0,
            message: 'No change (both values are 0)',
          };
        }

        if (previous === 0) {
          return {
            status: 'increase',
            percent: 100,
            message: 'Cannot calculate change from 0',
          };
        }

        const change = ((current - previous) / previous) * 100;
        const rounded = parseFloat(change.toFixed(2));

        if (change > 0) {
          return {
            status: 'increase',
            percent: rounded,
            message: `Increased by ${rounded}%`,
          };
        } else if (change < 0) {
          return {
            status: 'decrease',
            percent: Math.abs(rounded),
            message: `Decreased by ${Math.abs(rounded)}%`,
          };
        } else {
          return {
            status: 'no_change',
            percent: 0,
            message: 'No change',
          };
        }
      }

      if (fromDate && toDate) {
        const specificStartDate = new Date(fromDate);
        specificStartDate.setHours(0, 0, 0, 0);

        const specificEndTime = new Date(toDate);
        specificEndTime.setHours(23, 59, 59, 999);

        // ✅ Calculate the number of days in the selected range
        const durationInDays = Math.ceil(
          (specificEndTime.getTime() - specificStartDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // ✅ Calculate previous range
        const previousEndTime = new Date(specificStartDate);
        previousEndTime.setDate(specificStartDate.getDate() - 1);
        previousEndTime.setHours(23, 59, 59, 999);

        const previousStartDate = new Date(previousEndTime);
        previousStartDate.setDate(
          previousEndTime.getDate() - (durationInDays - 1),
        );
        previousStartDate.setHours(0, 0, 0, 0);

        const currentData = await fetchCheckupData(
          specificStartDate,
          specificEndTime,
        );

        const previousData = await fetchCheckupData(
          previousStartDate,
          previousEndTime,
        );

        const calculatedPercentageForCheckups = calculatePercentageChange(
          previousData.totalCheckups,
          currentData.totalCheckups,
        );

        const calculatedPercentageForIllnessCases = calculatePercentageChange(
          previousData.totalIllnessCases,
          currentData.totalIllnessCases,
        );

        cards[0].number = String(currentData.totalCheckups);
        cards[0].status = calculatedPercentageForCheckups.status;
        cards[0].percentage =
          String(calculatedPercentageForCheckups.percent) + '%';

        cards[1].number = String(currentData.totalIllnessCases);
        cards[1].status = calculatedPercentageForIllnessCases.status;
        cards[1].percentage =
          String(calculatedPercentageForIllnessCases.percent) + '%';

        return {
          message: `Showing the checkup dashboard data from ${fromDate} to ${toDate}`,
          cards,
        };
      }

      const endTime = new Date();
      endTime.setHours(23, 59, 59, 999);

      const currentWeekStart = new Date(endTime);
      currentWeekStart.setDate(endTime.getDate() - 6);
      currentWeekStart.setHours(0, 0, 0, 0);

      const previousWeekEnd = new Date(currentWeekStart);
      previousWeekEnd.setDate(currentWeekStart.getDate() - 1);
      previousWeekEnd.setHours(23, 59, 59, 999);

      const previousWeekStart = new Date(previousWeekEnd);
      previousWeekStart.setDate(previousWeekEnd.getDate() - 6);
      previousWeekStart.setHours(0, 0, 0, 0);

      const currentData = await fetchCheckupData(currentWeekStart, endTime);

      const previousData = await fetchCheckupData(
        previousWeekStart,
        previousWeekEnd,
      );

      const calculatedPercentageForCheckups = calculatePercentageChange(
        previousData.totalCheckups,
        currentData.totalCheckups,
      );

      const calculatedPercentageForIllnessCases = calculatePercentageChange(
        previousData.totalIllnessCases,
        currentData.totalIllnessCases,
      );

      cards[0].number = String(currentData.totalCheckups);
      cards[0].status = calculatedPercentageForCheckups.status;
      cards[0].percentage =
        String(calculatedPercentageForCheckups.percent) + '%';

      cards[1].number = String(currentData.totalIllnessCases);
      cards[1].status = calculatedPercentageForIllnessCases.status;
      cards[1].percentage =
        String(calculatedPercentageForIllnessCases.percent) + '%';

      return {
        message: 'Showing the checkup dashboard data from last week',
        cards,
      };
    } catch (error) {
      catchBlock(error);
    }
  }

  //Getting the specific records based date range
  async getCheckupRecordsForSpecificDate(
    cattleName: string,
    fromDate: string,
    toDate: string,
  ) {
    try {
      const startTime = new Date(fromDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(toDate);
      endTime.setHours(23, 59, 59, 999);

      const allRecords = await this.prisma.checkup.findMany({
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
