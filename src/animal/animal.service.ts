import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddAnimalDto } from './dto/add-animal.dto';
import { PrismaService } from '../prisma/prisma.service';
import { catchBlock } from '../common/catch-block';
import { put } from '@vercel/blob';
import { ConfigService } from '@nestjs/config';
import { $Enums, CattleBreed, CattleType, HealthStatus } from '@prisma/client';
import { EditAnimalDto } from './dto/edit-animal.dto';
import { AddNewCalfDto } from './dto/add-calf.dto';

@Injectable()
export class AnimalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  //Add new animal
  async addAnimal(
    animalDto: AddAnimalDto,
    image1: Express.Multer.File,
    image2: Express.Multer.File,
    userId: number,
  ) {
    try {
      const {
        cattleName,
        farmEntry,
        birthDate,
        weight,
        type,
        images,
        ...restOfValues
      } = animalDto;

      (await this.prisma.cattle.findFirst({
        where: { cattleName: cattleName },
      })) &&
        (() => {
          throw new BadRequestException('Cattle ID is already in use');
        })();

      const imageUrl1 = await put(image1.originalname, image1.buffer, {
        access: 'public',
        token: this.configService.get('BLOB_READ_WRITE_TOKEN'),
        allowOverwrite: true,
      });

      const imageUrl2 = await put(image2.originalname, image2.buffer, {
        access: 'public',
        token: this.configService.get('BLOB_READ_WRITE_TOKEN'),
        allowOverwrite: true,
      });

      await this.prisma.cattle.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          cattleName: cattleName,
          type,
          image1: imageUrl1?.url,
          image2: imageUrl2?.url,
          farmEntryDate: new Date(farmEntry),
          birthDate: new Date(birthDate),
          weight: Number(weight),
          ...restOfValues,
        },
      });

      return { message: 'New animal added successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }
 
  //Fetching all cattle details
  async gettingAllCattles(
    page: number,
    sortBy: string,
    filter: string[],
    fromDate: string,
    toDate: string,
  ) {
    try {
      const skip = (page - 1) * 25;
      const limit = 25;
      let totalPages: number | undefined;
      const allCattles: any[] = [];
  
      const where: any = {};
  
      // Parse filter
      const types: CattleType[] = [];
      const breeds: CattleBreed[] = [];
      const healthStatuses: HealthStatus[] = [];
  
      if (filter && Array.isArray(filter)) {
        filter.forEach((f) => {
          const upper = f.toUpperCase();
          if (Object.values(CattleType).includes(upper as CattleType)) {
            types.push(upper as CattleType);
          }
          if (Object.values(CattleBreed).includes(upper as CattleBreed)) {
            breeds.push(upper as CattleBreed);
          }
          if (Object.values(HealthStatus).includes(upper as HealthStatus)) {
            healthStatuses.push(upper as HealthStatus);
          }
        });
  
        if (types.length > 0) where.type = { in: types };
        if (breeds.length > 0) where.breed = { in: breeds };
        if (healthStatuses.length > 0)
          where.healthStatus = { in: healthStatuses };
      }
  
      // Parse date
      if (fromDate && toDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        where.farmEntryDate = {
          gte: startDate,
          lte: endDate,
        };
      }
  
      // Sort parser
      let orderBy: any = { farmEntryDate: 'desc' };
      let message = 'Showing initial paginated data';
  
      if (sortBy) {
        switch (sortBy) {
          case 'name-asc':
            orderBy = { cattleName: 'asc' };
            message = 'Showing data sorted by name ascending';
            break;
          case 'name-desc':
            orderBy = { cattleName: 'desc' };
            message = 'Showing data sorted by name descending';
            break;
          case 'newest':
            orderBy = { farmEntryDate: 'desc' };
            message = 'Showing data sorted by newest';
            break;
          case 'oldest':
            orderBy = { farmEntryDate: 'asc' };
            message = 'Showing data sorted by oldest';
            break;
          default:
            throw new BadRequestException('Invalid sort option');
        }
      }
  
      if (Object.keys(where).length > 0) {
        message = 'Showing filtered data';
        if (fromDate && toDate) {
          message += ` from ${fromDate} to ${toDate}`;
        }
      }
  
      totalPages = await this.prisma.cattle.count({ where });
  
      const allCattlesDetails = await this.prisma.cattle.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      });
  
      for (const eachCattle of allCattlesDetails) {
        const now = new Date();
        const endTime = new Date(now);
        endTime.setHours(23, 59, 59, 999);
        const startTime = new Date(now);
        startTime.setMonth(startTime.getMonth() - 1);
        startTime.setHours(0, 0, 0, 0);
  
        const previousEndTime = new Date(startTime);
        previousEndTime.setDate(previousEndTime.getDate() - 1);
        previousEndTime.setHours(23, 59, 59, 999);
        const previousStartTime = new Date(startTime);
        previousStartTime.setMonth(previousStartTime.getMonth() - 1);
        previousStartTime.setHours(0, 0, 0, 0);
  
        const getAverageValue = async (start: Date, end: Date) => {
          const avg = await this.prisma.milk.aggregate({
            where: {
              cattleId: eachCattle.cattleName,
              date: {
                gte: start,
                lte: end,
              },
            },
            _avg: {
              morningMilk: true,
              afternoonMilk: true,
              eveningMilk: true,
            },
          });
          return (
            Number(avg._avg.morningMilk) +
            Number(avg._avg.afternoonMilk) +
            Number(avg._avg.eveningMilk) / 3
          );
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
  
        const currentAvg = await getAverageValue(startTime, endTime);
        const prevAvg = await getAverageValue(previousStartTime, previousEndTime);
        const calc = calculatePercentageChange(prevAvg, currentAvg);
  
        const eachCattleDetails = {
          ...eachCattle,
          averageMilk: currentAvg,
          status: calc?.status,
          percentage: calc?.percent,
          totalPages: Math.ceil(totalPages / 25),
          totalAnimalCount: totalPages,
        };
        allCattles.push(eachCattleDetails);
      }
  
      return { message, allCattles };
    } catch (err) {
      catchBlock(err);
    }
  }
  

  //Fetching particular animal details
  async showingParticularAnimal(cattleName: string) {
    try {
      const animal =
        (await this.prisma.cattle.findFirst({
          where: { cattleName: cattleName },
        })) ||
        (() => {
          throw new NotFoundException('No animal found with the cattle ID');
        })();

      const averageMilk = await this.prisma.milk.aggregate({
        where: { cattleId: cattleName },
        _avg: {
          morningMilk: true,
          afternoonMilk: true,
          eveningMilk: true,
        },
      });

      const overallAverageMilk =
        Number(averageMilk._avg.morningMilk) +
        Number(averageMilk._avg.afternoonMilk) +
        Number(averageMilk._avg.eveningMilk);

      const vaccinationRecords = await this.prisma.vaccination.findMany({
        where: { cattleName: animal.cattleName },
        orderBy: { date: 'desc' },
      });

      const averageFeed = await this.prisma.feedConsumption.aggregate({
        where: { cattleName: animal.cattleName },
        _avg: {
          quantity: true,
        },
      });

      const calfCount = await this.prisma.calf.count({
        where: { cattleName },
        orderBy: { birthDate: 'desc' },
      });

      const animalDetails = {
        overallAverageMilk: overallAverageMilk / 3,
        lastVaccination: vaccinationRecords[0]?.date || null,
        averageFeed: averageFeed._avg.quantity ?? 0,
        calfCount: calfCount ?? 0,
        cattleDetails: animal,
      };

      return {
        message: `Showing the details of the animal ${cattleName}`,
        animalDetails,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Update particular animal details
  async updateParticularAnimalDetails(id: number, animalDto: EditAnimalDto) {
    try {
      const { cattleName, farmEntry, birthDate, weight, ...restOfValues } =
        animalDto;

      (await this.prisma.cattle.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No animal found with the id');
        })();

      await this.prisma.cattle.update({
        where: { id },
        data: {
          cattleName: cattleName,
          farmEntryDate: new Date(farmEntry),
          birthDate: new Date(birthDate),
          weight: Number(weight),
          ...restOfValues,
        },
      });

      return {
        message: 'Animal details updated successfully!',
        cattleDetails: await this.prisma.cattle.findFirst({ where: { id } }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Delete particular animal
  async deleteParticularAnimal(id: number) {
    try {
      (await this.prisma.cattle.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No animal found with the id');
        })();

      await this.prisma.cattle.delete({ where: { id } });

      return { message: 'Animal deleted successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Get the list of cattle names
  async gettingAllCattleIds() {
    try {
      const allCattlesIds = await this.prisma.cattle.findMany({
        where: { active: true },
        select: {
          cattleName: true,
        },
      });
      return { message: "Showing all cattle id's", allCattlesIds };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching feed history for specific animal
  async getFeedHistory(cattleName: string, page: number) {
    try {
      const skip = (page - 1) * 10;
      const limit = 10;

      (await this.prisma.cattle.findFirst({ where: { cattleName } })) ||
        (() => {
          throw new NotFoundException('No animal found with the given id');
        })();

      const totalCount = await this.prisma.feedConsumption.count({
        where: { cattleName },
      });

      const feedHistory = await this.prisma.feedConsumption.findMany({
        where: { cattleName },
        orderBy: { date: 'desc' },
        skip: skip,
        take: limit,
      });

      const feedHistoryOverview = {
        feedHistory,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / 10),
      };

      return {
        message: `Showing all feed records ${cattleName}`,
        feedHistoryOverview,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching milk production history for specific animal
  async milkProductionHistory(cattleName: string, page: number) {
    try {
      const skip = (page - 1) * 10;
      const limit = 10;

      (await this.prisma.cattle.findFirst({ where: { cattleName } })) ||
        (() => {
          throw new NotFoundException('No animal found with the given id');
        })();

      const totalCount = await this.prisma.milk.count({
        where: { cattleId: cattleName },
      });

      const allMilkRecords = await this.prisma.milk.findMany({
        where: { cattleId: cattleName },
        orderBy: { date: 'desc' },
        skip: skip,
        take: limit,
      });

      const milkHistoryOverview = {
        allMilkRecords,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / 10),
      };

      return {
        message: `Showing all milk records ${cattleName}`,
        milkHistoryOverview,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching checkup history for specific animal
  async getCheckupHistory(cattleName: string, page: number) {
    try {
      const skip = (page - 1) * 10;
      const limit = 10;

      (await this.prisma.cattle.findFirst({ where: { cattleName } })) ||
        (() => {
          throw new NotFoundException('No animal found with the given id');
        })();

      const totalCount = await this.prisma.checkup.count({
        where: { cattleName },
      });

      const medicalReports = await this.prisma.checkup.findMany({
        where: { cattleName },
        orderBy: { date: 'desc' },
        skip: skip,
        take: limit,
      });

      const checkupHistoryOverview = {
        medicalReports,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / 10),
      };

      return {
        message: `Showing all medical records ${cattleName}`,
        checkupHistoryOverview,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching cattle management data for top section
  async getDataForDashboardTopSection(
    query: string,
    fromDate: string,
    toDate: string,
  ) {
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const cards = [
        {
          number: '',
          title: 'Total Milk',
          des: 'Milk collected across all cattle',
          percentage: '',
          status: '',
          route:'/milk-production'
        },
        {
          number: '',
          title: 'Total Cattle',
          des: 'Count of all cattle added to the system',
          percentage: '',
          status: '',
          route:'/cattle-management'
        },
        {
          number: '',
          title: 'Total Illness Cases',
          des: 'Number of cattle reported sick',
          percentage: '',
          status: '',
          route:'/health-management/cattle-checkups'
        },
        {
          number: '',
          title: 'Newly Added Cattle',
          des: 'Cattle added during the current period',
          percentage: '',
          status: '',
          route:'/cattle-management'
        },
        {
          number: '',
          title: 'A2 Milk Production',
          des: 'Quantity of A2 milk collected',
          percentage: '',
          status: '',
          route:'/milk-production'
        },
      ];

      let topSection: any = null;

      const gettingTopData = async (startDate: any, endDate: any) => {
        const totalMilk = await this.prisma.milk.aggregate({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const totalCattle = await this.prisma.cattle.count({
          where: {
            farmEntryDate: {
              gte: startDate,
              lte: endDate,
            },
            active: true,
          },
        });

        const totalIllnessCases = await this.prisma.cattle.count({
          where: {
            healthStatus: 'INJURED',
            farmEntryDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const newlyAddedCattle = await this.prisma.cattle.count({
          where: {
            farmEntryDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const a2MilkCount = await this.prisma.milk.aggregate({
          where: {
            milkGrade: 'A2',
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            morningMilk: true,
            afternoonMilk: true,
            eveningMilk: true,
          },
        });

        const topSection = {
          totalMilk:
            Number(totalMilk._sum.morningMilk) +
            Number(totalMilk._sum.afternoonMilk) +
            Number(totalMilk._sum.eveningMilk),
          totalCattle: totalCattle ?? 0,
          totalIllnessCases: totalIllnessCases ?? 0,
          newlyAddedCattle: newlyAddedCattle ?? 0,
          a2MilkCount:
            Number(a2MilkCount._sum.morningMilk) +
            Number(a2MilkCount._sum.afternoonMilk) +
            Number(a2MilkCount._sum.eveningMilk),
        };

        return topSection;
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

      const settingTopSectionData = (
        topSection: any,
        previousTopSection: any,
      ) => {
        const fields = [
          { key: 'totalMilk', index: 0 },
          { key: 'totalCattle', index: 1 },
          { key: 'totalIllnessCases', index: 2 },
          { key: 'newlyAddedCattle', index: 3 },
          { key: 'a2MilkCount', index: 4 },
        ];

        fields.forEach(({ key, index }) => {
          const current = topSection[key];
          const previous = previousTopSection[key];
          const { status, percent } = calculatePercentageChange(
            previous,
            current,
          );

          cards[index].number = current;
          cards[index].status = status;
          cards[index].percentage = percent !== null ? `${percent}%` : '0%';
        });
      };

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

        // 🔄 Get top section data
        const topSection = await gettingTopData(
          specificStartDate,
          specificEndTime,
        );
        const previousTopSection = await gettingTopData(
          previousStartDate,
          previousEndTime,
        );

        settingTopSectionData(topSection, previousTopSection);

        return {
          message: `Showing the dashboard data for cattle management top section based on ${fromDate} to ${toDate}`,
          cards,
        };
      }

      switch (query) {
        case 'Week':
          const lastWeek = new Date();
          lastWeek.setDate(today.getDate() - 6);
          lastWeek.setHours(0, 0, 0, 0);
          const previousWeekStart = new Date(lastWeek);

          previousWeekStart.setDate(lastWeek.getDate() - 7); // 7 days before current week start

          const previousWeekEnd = new Date(lastWeek);
          previousWeekEnd.setDate(lastWeek.getDate() - 1); // 1 day before current week start

          // Optional: Set time boundaries
          previousWeekStart.setHours(0, 0, 0, 0);
          previousWeekEnd.setHours(23, 59, 59, 999);

          topSection = await gettingTopData(lastWeek, today);

          const previousTopSectionForWeek = await gettingTopData(
            previousWeekStart,
            previousWeekEnd,
          );

          settingTopSectionData(topSection, previousTopSectionForWeek);
          break;

        case 'Month':
          const lastMonthStart = new Date();
          lastMonthStart.setDate(today.getMonth() - 1);
          lastMonthStart.setHours(0, 0, 0, 0);

          const previousMonthStart = new Date(lastMonthStart);
          previousMonthStart.setMonth(lastMonthStart.getMonth() - 1);
          previousMonthStart.setHours(0, 0, 0, 0);

          const previousMonthEnd = new Date(lastMonthStart);
          previousMonthEnd.setDate(previousMonthEnd.getDate() - 1); // 1 day before current month start
          previousMonthEnd.setHours(23, 59, 59, 999);

          topSection = await gettingTopData(lastMonthStart, today);

          const previousTopSectionForMonth = await gettingTopData(
            previousMonthStart,
            previousMonthEnd,
          );

          settingTopSectionData(topSection, previousTopSectionForMonth);

          break;

        case 'Quarter':
          const lastSixMonths = new Date();
          lastSixMonths.setMonth(today.getMonth() - 6);
          lastSixMonths.setHours(0, 0, 0, 0);

          const previousSixMonthsStart = new Date(lastSixMonths);
          previousSixMonthsStart.setMonth(lastSixMonths.getMonth() - 6);
          previousSixMonthsStart.setHours(0, 0, 0, 0);

          const previousSixMonthsEnd = new Date(lastSixMonths);
          previousSixMonthsEnd.setDate(previousSixMonthsEnd.getDate() - 1);
          previousSixMonthsEnd.setHours(23, 59, 59, 999);

          topSection = await gettingTopData(lastSixMonths, today);

          const previousTopSectionForSixMonths = await gettingTopData(
            previousSixMonthsStart,
            previousSixMonthsEnd,
          );

          settingTopSectionData(topSection, previousTopSectionForSixMonths);

          break;

        case 'Year':
          const lastYear = new Date();
          lastYear.setFullYear(lastYear.getFullYear() - 1);
          lastYear.setHours(0, 0, 0, 0);

          const previousYearStart = new Date(lastYear);
          previousYearStart.setFullYear(lastYear.getFullYear() - 1);
          previousYearStart.setHours(0, 0, 0, 0);

          const previousYearEnd = new Date(lastYear);
          previousYearEnd.setDate(previousYearEnd.getDate() - 1);
          previousYearEnd.setHours(23, 59, 59, 999);

          topSection = await gettingTopData(lastYear, today);

          const previousTopSectionForYear = await gettingTopData(
            previousYearStart,
            previousYearEnd,
          );

          settingTopSectionData(topSection, previousTopSectionForYear);

          break;
        default:
          throw new BadRequestException(
            'Enter a valid query value {Week,Month,Quarter,Year}',
          );
      }

      return {
        message: `Showing the dashboard data for cattle management top section based on ${query}`,
        cards,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching all the recent health checkup reocords
  async getHealthRecordsForDashboard() {
    try {
      const healthRecords = await this.prisma.checkup.findMany({
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          prescription: true,
          description: true,
          doctorName: true,
          doctorPhone: true,
          cattleName: true,
          createdAt: true,
          updatedAt: true,
          cattle: {
            select: {
              type: true,
            },
          },
        },
      });

      return { message: 'Showing all the checkup records', healthRecords };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching all the checkup records data for dashboard graph
  async getHealthRecordsForDashboardGraph(query: string) {
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const getCheckupCount = async (startDate: any, endDate: any) => {
        const totalCowCount = await this.prisma.checkup.count({
          where: {
            cattle: {
              type: 'COW',
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        const totalBuffaloCount = await this.prisma.checkup.count({
          where: {
            cattle: {
              type: 'BUFFALO',
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        const totalGoatCount = await this.prisma.checkup.count({
          where: {
            cattle: {
              type: 'GOAT',
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        const totalValues = {
          totalCowCount,
          totalBuffaloCount,
          totalGoatCount,
        };
        return totalValues;
      };

      let totalCheckupCounts: any;
      switch (query) {
        case 'Week':
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          totalCheckupCounts = await getCheckupCount(startDate, endDate);
          break;
        case 'Month':
          const lastMonth = new Date();
          lastMonth.setMonth(endDate.getMonth() - 1);
          lastMonth.setHours(0, 0, 0, 0);
          totalCheckupCounts = await getCheckupCount(lastMonth, endDate);
          break;
        case 'Quarter':
          const lastSixMonths = new Date();
          lastSixMonths.setMonth(endDate.getMonth() - 6);
          lastSixMonths.setHours(0, 0, 0, 0);
          totalCheckupCounts = await getCheckupCount(lastSixMonths, endDate);
          break;
        case 'Year':
          const lastYear = new Date();
          lastYear.setFullYear(lastYear.getFullYear() - 1);
          lastYear.setHours(0, 0, 0, 0);
          totalCheckupCounts = await getCheckupCount(lastYear, endDate);
          break;
        default:
          throw new BadRequestException(
            'Enter a valid query value {Week,Month,Quarter,Year}',
          );
      }

      return {
        message: `Showing the count of health checkup reports based on ${query}`,
        totalCheckupCounts,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching the list of feed stock records
  async getDashboardFeedStockRecords(query: string) {
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const getFeedStockRecords = async (startDate: any, endDate: any) => {
        const feedRecords = await this.prisma.feedStock.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            date: 'desc',
          },
        });
        return feedRecords;
      };

      let totalFeedRecords: any;
      switch (query) {
        case 'Week':
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          totalFeedRecords = await getFeedStockRecords(startDate, endDate);
          break;
        case 'Month':
          const lastMonth = new Date();
          lastMonth.setMonth(endDate.getMonth() - 1);
          lastMonth.setHours(0, 0, 0, 0);
          totalFeedRecords = await getFeedStockRecords(lastMonth, endDate);
          break;
        case 'Quarter':
          const lastSixMonths = new Date();
          lastSixMonths.setMonth(endDate.getMonth() - 6);
          lastSixMonths.setHours(0, 0, 0, 0);
          totalFeedRecords = await getFeedStockRecords(lastSixMonths, endDate);
          break;
        case 'Year':
          const lastYear = new Date();
          lastYear.setFullYear(lastYear.getFullYear() - 1);
          lastYear.setHours(0, 0, 0, 0);
          totalFeedRecords = await getFeedStockRecords(lastYear, endDate);
          break;
        default:
          throw new BadRequestException(
            'Enter a valid query value {Week,Month,Quarter,Year}',
          );
      }

      return {
        message: `Showing the health checkup reports based on ${query}`,
        totalFeedRecords,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Adding a new calf
  async addNewCalf(calfDto: AddNewCalfDto) {
    try {
      const { birthDate, cattleName, ...restOfValues } = calfDto;

      (await this.prisma.cattle.findFirst({ where: { cattleName } })) ||
        (() => {
          throw new BadRequestException('Enter a valid cattle name');
        })();

      await this.prisma.calf.create({
        data: {
          cattle: {
            connect: {
              cattleName: cattleName,
            },
          },
          birthDate: new Date(birthDate),
          ...restOfValues,
        },
      });

      const allCalfs = await this.prisma.calf.findMany({
        where: { cattleName: cattleName },
        orderBy: { birthDate: 'desc' },
      });

      return { message: 'New calf added successfully!', allCalfs };
    } catch (err) {}
  }

  // Showing the list all calfs
  async allCalfDetails(cattleName: string) {
    try {
      (await this.prisma.cattle.findFirst({ where: { cattleName } })) ||
        (() => {
          throw new BadRequestException('Enter a valid cattle name');
        })();
      const allCalfs = await this.prisma.calf.findMany({
        where: {
          cattleName: cattleName,
        },
        orderBy: {
          birthDate: 'desc',
        },
      });
      return {
        message: `Showing all the calf details for ${cattleName}`,
        allCalfs,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  // Creating a dynamic id for cattle name
  async generateCattleId(type: string) {
    try {
      const length = await this.prisma.cattle.count();
      const cattleId = `${type.toLocaleLowerCase()}-${length}`;
      return { message: 'New Cattle ID generated', cattleId };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Creating a dynamic id for calf
  async generateCalfId(type: string) {
    try {
      const length = await this.prisma.calf.count();
      const calfId = `${type.toLocaleLowerCase().slice(0, 1)}-${length}`;
      return { message: 'New Calf ID generated', calfId };
    } catch (err) {
      catchBlock(err);
    }
  }
}
