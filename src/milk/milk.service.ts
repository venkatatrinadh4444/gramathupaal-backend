import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddMilkRecordDto } from './dto/add-milk-record.dto';
import { PrismaService } from '../prisma/prisma.service';
import { catchBlock } from '../common/catch-block';
import { CattleType, SelectedMilkGrade, SelectedSession } from '@prisma/client';

@Injectable()
export class MilkService {
  constructor(private readonly prisma: PrismaService) {}

  //Add new milk record
  async addNewMilkRecord(milkDto: AddMilkRecordDto, userId: number) {
    try {
      const {
        cattleId,
        date,
        morningMilk,
        afternoonMilk,
        eveningMilk,
        milkGrade,
      } = milkDto;
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
          morningMilk: morningMilk || 0.0,
          afternoonMilk: afternoonMilk || 0.0,
          eveningMilk: eveningMilk || 0.0,
          milkGrade,
        },
      });

      return { message: 'New milk record added successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }

  // fetching all milk records
  // async gettingAllMilkRecords(
  //   page: number,
  //   sortBy: string,
  //   filter: string[],
  //   search: string,
  //   fromDate: string,
  //   toDate: string,
  // ) {
  //   try {
  //     const skip = (page - 1) * 25;
  //     const limit = 25;
  //     let message = 'showing initial milk data';

  //     const where: any = {
  //       AND: [],
  //     };

  //     const types: CattleType[] = [];
  //     const grades: SelectedMilkGrade[] = [];

  //     // Search condition
  //     if (search) {
  //       message = `Showing the searched records based on ${search}`;
  //       const possibleEnum = Object.values(SelectedMilkGrade).includes(
  //         search as SelectedMilkGrade,
  //       )
  //         ? (search as SelectedMilkGrade)
  //         : undefined;

  //       where.AND.push({
  //         OR: [
  //           {
  //             cattle: {
  //               cattleName: {
  //                 contains: search.toLowerCase(),
  //                 mode: 'insensitive',
  //               },
  //             },
  //           },
  //           {
  //             milkGrade: possibleEnum,
  //           },
  //         ],
  //       });
  //     }

  //     // Filters
  //     if (filter && Array.isArray(filter)) {
  //       filter.forEach((f) => {
  //         const upper = f.toUpperCase();
  //         console.log(f)
  //         if (Object.values(CattleType).includes(upper as CattleType)) {
  //           types.push(upper as CattleType);
  //         }

  //         if (
  //           Object.values(SelectedMilkGrade).includes(f as SelectedMilkGrade)
  //         ) {
  //           grades.push(f as SelectedMilkGrade);
  //         }
  //       });

  //       if (types.length > 0) {
  //         where.AND.push({
  //           cattle: {
  //             type: { in: types },
  //           },
  //         });
  //       }

  //       if (grades.length > 0) {
  //         where.AND.push({
  //           milkGrade: { in: grades },
  //         });
  //       }

  //       if (types.length > 0 || grades.length > 0) {
  //         message = 'Showing the filtered data based on selected filters';
  //       }
  //     }

  //     // Date range
  //     if (fromDate && toDate) {
  //       const startDate = new Date(fromDate);
  //       startDate.setHours(0, 0, 0, 0);
  //       const endDate = new Date(toDate);
  //       endDate.setHours(23, 59, 59, 999);

  //       where.AND.push({
  //         date: {
  //           gte: startDate,
  //           lte: endDate,
  //         },
  //       });

  //       message =
  //         types.length > 0 || grades.length > 0
  //           ? `Showing the data based selected filters and date range ${fromDate} to ${toDate}`
  //           : `Showing the data based on date range ${fromDate} to ${toDate}`;
  //     }

  //     // Remove AND if empty
  //     if (where.AND.length === 0) delete where.AND;

  //     // Sort logic
  //     let orderBy: any = { date: 'desc' }; // Default
  //     if (sortBy) {
  //       message = `Showing the sorted data based on ${sortBy}`;
  //       switch (sortBy) {
  //         case 'name-asc':
  //           orderBy = {
  //             cattle: {
  //               cattleName: 'asc',
  //             },
  //           };
  //           break;
  //         case 'name-desc':
  //           orderBy = {
  //             cattle: {
  //               cattleName: 'desc',
  //             },
  //           };
  //           break;
  //         case 'oldest':
  //           orderBy = { date: 'asc' };
  //           break;
  //         case 'newest':
  //           orderBy = { date: 'desc' };
  //           break;
  //         default:
  //           throw new BadRequestException('Please enter a valid query value');
  //       }
  //     }

  //     const totalCount = await this.prisma.milk.count({ where });

  //     const allRecords = await this.prisma.milk.findMany({
  //       where,
  //       orderBy,
  //       select: {
  //         cattle: {
  //           select: {
  //             image1: true,
  //             type: true,
  //             cattleName: true,
  //           },
  //         },
  //         id: true,
  //         date: true,
  //         morningMilk: true,
  //         afternoonMilk: true,
  //         eveningMilk: true,
  //         milkGrade: true,
  //       },
  //       skip,
  //       take: limit,
  //     });

  //     const milkOverview = {
  //       allRecords,
  //       totalPages: Math.ceil(totalCount / 25),
  //       totalRecordsCount: totalCount,
  //     };

  //     return { message, milkOverview };
  //   } catch (err) {
  //     catchBlock(err);
  //   }
  // }
  async gettingAllMilkRecords(
    page: number,
    sortBy: string,
    filter: string[],
    search: string,
    fromDate: string,
    toDate: string,
  ) {
    try {
      const skip = (page - 1) * 25;
      const limit = 25;
      let message = 'showing initial milk data';
  
      const where: any = {
        AND: [],
      };
  
      const types: CattleType[] = [];
      const grades: SelectedMilkGrade[] = [];
  
      // Search condition
      if (search) {
        message = `Showing the searched records based on ${search}`;
        const possibleEnum = Object.values(SelectedMilkGrade).includes(
          search as SelectedMilkGrade,
        )
          ? (search as SelectedMilkGrade)
          : undefined;
  
        where.AND.push({
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
              milkGrade: possibleEnum,
            },
          ],
        });
      }
  
      // ✅ Updated Filter logic
      if (filter && Array.isArray(filter)) {
        filter
          .flatMap((item) => item.split(',')) // split comma-separated values
          .map((f) => f.trim()) // remove any spaces
          .forEach((f) => {
            const upper = f.toUpperCase();
  
            const matchedType = Object.values(CattleType).find(
              (type) => type.toString().toUpperCase() === upper,
            );
            if (matchedType) {
              types.push(matchedType as CattleType);
            }
  
            const matchedGrade = Object.values(SelectedMilkGrade).find(
              (grade) => grade.toString().toUpperCase() === upper,
            );
            if (matchedGrade) {
              grades.push(matchedGrade as SelectedMilkGrade);
            }
          });
  
        if (types.length > 0) {
          where.AND.push({
            cattle: {
              type: {
                in: types,
              },
            },
          });
        }
  
        if (grades.length > 0) {
          where.AND.push({
            milkGrade: {
              in: grades,
            },
          });
        }
  
        if (types.length > 0 || grades.length > 0) {
          message = 'Showing the filtered data based on selected filters';
        }
      }
  
      // Date range
      if (fromDate && toDate) {
        console.log(fromDate,toDate)
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        console.log(startDate,endDate)
  
        where.AND.push({
          date: {
            gte: startDate,
            lte: endDate,
          },
        });
  
        message =
          types.length > 0 || grades.length > 0
            ? `Showing the data based selected filters and date range ${fromDate} to ${toDate}`
            : `Showing the data based on date range ${fromDate} to ${toDate}`;
      }
  
      // Remove AND if empty
      if (where.AND.length === 0) delete where.AND;
  
      // Sort logic
      let orderBy: any = { date: 'desc' }; // Default
      if (sortBy) {
        message = `Showing the sorted data based on ${sortBy}`;
        switch (sortBy) {
          case 'name-asc':
            orderBy = {
              cattle: {
                cattleName: 'asc',
              },
            };
            break;
          case 'name-desc':
            orderBy = {
              cattle: {
                cattleName: 'desc',
              },
            };
            break;
          case 'oldest':
            orderBy = { date: 'asc' };
            break;
          case 'newest':
            orderBy = { date: 'desc' };
            break;
          default:
            throw new BadRequestException('Please enter a valid query value');
        }
      }
  
      const totalCount = await this.prisma.milk.count({ where });
  
      const allRecords = await this.prisma.milk.findMany({
        where,
        orderBy,
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
        skip,
        take: limit,
      });
  
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
  async dashboardData(session: string, fromDate: string, toDate: string) {
    try {
      const cardsMilk = [
        {
          number: '',
          title: 'Total Milk',
          des: 'Total milk collected across animals',
          percentage: '',
          status: '',
        },
        {
          number: '',
          title: 'A1 Milk',
          des: 'Quantity of milk classified as A1',
          percentage: '',
          status: '',
        },
        {
          number: '',
          title: 'A2 Milk',
          des: 'Quantity of milk classified as A2',
          percentage: '',
          status: '',
        },
        {
          number: '',
          title: 'Cow A1 Milk',
          des: 'Milk collected from one animals',
          percentage: '',
          status: '',
        },
        {
          number: '',
          title: 'Cow A2 Milk',
          des: 'Milk collected from one animals',
          percentage: '',
          status: '',
        },
        {
          number: '',
          title: 'Buffalo Milk',
          des: 'The total buffalo milk production',
          percentage: '',
          status: '',
        },
        {
          number: '',
          title: 'Karampasu Milk',
          des: 'The total karampasu milk production',
          percentage: '',
          status: '',
        },
      ];

      const fetchingMilkData = async (startTime: any, endTime: any) => {
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
        return dashboardData;
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

      const settingMilkSectionData = (
        currentMilkData: any,
        previousMilkData: any,
      ) => {
        const fields = [
          { key: 'totalMilk', index: 0 },
          { key: 'a1Milk', index: 1 },
          { key: 'a2Milk', index: 2 },
          { key: 'cowA1Milk', index: 3 },
          { key: 'cowA2Milk', index: 4 },
          { key: 'buffaloMilk', index: 5 },
          { key: 'karampasuMilk', index: 6 },
        ];

        fields.forEach(({ key, index }) => {
          const current = currentMilkData[key];
          const previous = previousMilkData[key];
          const { status, percent } = calculatePercentageChange(
            previous,
            current,
          );

          cardsMilk[index].number = current.toFixed(2); // Optional: format milk to 2 decimal places
          cardsMilk[index].status = status;
          cardsMilk[index].percentage = percent !== null ? `${percent}%` : '0%';
        });
      };

      if (fromDate && toDate && session === 'Overall') {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        // Calculate number of days in the current range
        const diffInDays = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Previous range ends the day before the current start
        const previousEndTime = new Date(start);
        previousEndTime.setDate(start.getDate() - 1);
        previousEndTime.setHours(23, 59, 59, 999);

        // Previous range starts `diffInDays` before the previousEndTime
        const previousStartTime = new Date(previousEndTime);
        previousStartTime.setDate(previousEndTime.getDate() - (diffInDays - 1));
        previousStartTime.setHours(0, 0, 0, 0);

        const currentData = await fetchingMilkData(start, end);

        const previousData = await fetchingMilkData(
          previousStartTime,
          previousEndTime,
        );

        settingMilkSectionData(currentData, previousData);

        return {
          message: `Showing all the dashboard data for Overall ${fromDate} to ${toDate} `,
          cardsMilk,
        };
      }

      if (session as SelectedSession) {
        const startTime = new Date();
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(23, 59, 59, 999);

        const previousStartTime = new Date(startTime);
        previousStartTime.setDate(startTime.getDate() - 1);
        previousStartTime.setHours(0, 0, 0, 0);
        const previousEndTime = new Date(previousStartTime);
        previousEndTime.setHours(23, 59, 59, 999);

        // return { message: currentData?.message, cardsMilk };
      }

      if (fromDate && toDate && (session as SelectedSession)) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        // Calculate number of days in the current range
        const diffInDays = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Previous range ends the day before the current start
        const previousEndTime = new Date(start);
        previousEndTime.setDate(start.getDate() - 1);
        previousEndTime.setHours(23, 59, 59, 999);

        // Previous range starts `diffInDays` before the previousEndTime
        const previousStartTime = new Date(previousEndTime);
        previousStartTime.setDate(previousEndTime.getDate() - (diffInDays - 1));
        previousStartTime.setHours(0, 0, 0, 0);

        const fetchSessionMilkData = async (
          prisma: any,
          session: 'MORNING' | 'AFTERNOON' | 'EVENING',
          startTime: any,
          endTime: any,
        ) => {
          const key = session.toLowerCase() + 'Milk';

          const getValue = (res: any) => Number(res._sum[key] ?? 0);

          const [
            totalMilk,
            a1Milk,
            a2Milk,
            cowA1Milk,
            cowA2Milk,
            buffaloMilk,
            karampasuMilk,
          ] = await Promise.all([
            prisma.milk.aggregate({
              where: { date: { gte: startTime, lte: endTime } },
              _sum: {
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
              },
            }),
            prisma.milk.aggregate({
              where: {
                milkGrade: 'A1',
                date: { gte: startTime, lte: endTime },
              },
              _sum: {
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
              },
            }),
            prisma.milk.aggregate({
              where: {
                milkGrade: 'A2',
                date: { gte: startTime, lte: endTime },
              },
              _sum: {
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
              },
            }),
            prisma.milk.aggregate({
              where: {
                AND: [
                  { cattle: { type: 'COW' } },
                  { milkGrade: SelectedMilkGrade.OneCowA1 },
                  { date: { gte: startTime, lte: endTime } },
                ],
              },
              _sum: {
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
              },
            }),
            prisma.milk.aggregate({
              where: {
                AND: [
                  { cattle: { type: 'COW' } },
                  { milkGrade: SelectedMilkGrade.OneCowA2 },
                  { date: { gte: startTime, lte: endTime } },
                ],
              },
              _sum: {
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
              },
            }),
            prisma.milk.aggregate({
              where: {
                cattle: { type: 'BUFFALO' },
                date: { gte: startTime, lte: endTime },
              },
              _sum: {
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
              },
            }),
            prisma.milk.aggregate({
              where: {
                cattle: { breed: 'KARAMPASU' },
                date: { gte: startTime, lte: endTime },
              },
              _sum: {
                morningMilk: true,
                afternoonMilk: true,
                eveningMilk: true,
              },
            }),
          ]);

          return {
            message: `Showing all milk summary of ${session.toLowerCase()}`,
            dashboardData: {
              totalMilk: getValue(totalMilk),
              a1Milk: getValue(a1Milk),
              a2Milk: getValue(a2Milk),
              cowA1Milk: getValue(cowA1Milk),
              cowA2Milk: getValue(cowA2Milk),
              buffaloMilk: getValue(buffaloMilk),
              karampasuMilk: getValue(karampasuMilk),
            },
          };
        };

        const currentData = await fetchSessionMilkData(
          this.prisma,
          session as SelectedSession,
          start,
          end,
        );

        const previousData = await fetchSessionMilkData(
          this.prisma,
          session as SelectedSession,
          previousStartTime,
          previousEndTime,
        );

        settingMilkSectionData(
          currentData?.dashboardData,
          previousData?.dashboardData,
        );

        return {
          message: `Showing all the dashboard data based on date ${fromDate} to ${toDate} based on ${session}`,
          cardsMilk,
        };
      }

      throw new BadRequestException(
        'Please enter a valid session and from date to to date as query value',
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

  //Filter milk records by a specific date
  async getMilkRecordsForSpecificDate(
    cattleName: string,
    fromDate: string,
    toDate: string,
  ) {
    try {
      const startTime = new Date(fromDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(toDate);
      endTime.setHours(23, 59, 59, 999);

      const allRecords = await this.prisma.milk.findMany({
        where: {
          cattleId: cattleName,
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
