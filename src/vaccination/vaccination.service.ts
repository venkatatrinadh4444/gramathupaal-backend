import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccinationDto } from './dto/add-vaccination.dto';
import { catchBlock } from '../common/catch-block';
import { EditVaccinationDto } from './dto/edit-vaccination.dto';
import { CattleType } from '@prisma/client';

@Injectable()
export class VaccinationService {
  constructor(private readonly prisma: PrismaService) {}

  //Add new vaccination record
  async addNewVaccination(vaccinationDto: CreateVaccinationDto) {
    try {
      const { type, cattleName, date, ...restOfValues } = vaccinationDto;

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

      await this.prisma.vaccination.create({
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
        message: 'New doctor vaccination record added successfully!',
        allReports: await this.prisma.vaccination.findMany({
          orderBy: { date: 'desc' },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetch all vaccination records
  async fetchingAllVaccinationRecords(
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
      let message = 'Showing the all initial checkup records';
  
      const where: any = {};
  
      // --- Filter logic ---
      const types: CattleType[] = [];
      if (filter && Array.isArray(filter)) {
        filter.forEach((f) => {
          const upper = f.toUpperCase();
          if (Object.values(CattleType).includes(upper as CattleType)) {
            types.push(upper as CattleType);
          }
        });
        if (types.length > 0) {
          where.cattle = {
            ...(where.cattle || {}),
            type: { in: types },
          };
        }
      }
  
      // --- Date filter logic ---
      if (fromDate && toDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
  
        where.date = {
          gte: startDate,
          lte: endDate,
        };
      }
  
      // --- Search logic ---
      if (search) {
        message = `Showing the searched records based on ${search}`;
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            cattle: {
              cattleName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ];
      }
  
      // --- Sort logic ---
      let orderBy: any = { date: 'desc' }; // default
      if (sortBy) {
        message = `Showing the sorted records based on ${sortBy}`;
        switch (sortBy) {
          case 'name-asc':
            orderBy = { cattle: { cattleName: 'asc' } };
            break;
          case 'name-desc':
            orderBy = { cattle: { cattleName: 'desc' } };
            break;
          case 'newest':
            orderBy = { date: 'desc' };
            break;
          case 'oldest':
            orderBy = { date: 'asc' };
            break;
          default:
            throw new BadRequestException('Please provide a valid sortBy value');
        }
      }
  
      // --- Message for filters ---
      if (filter || fromDate || toDate) {
        message = 'Showing filtered vaccination records';
        if (filter && filter.length > 0) message += ` for ${filter.join(', ')}`;
        if (fromDate && toDate) message += ` between ${fromDate} and ${toDate}`;
      }
  
      // --- Total count ---
      const totalCount = await this.prisma.vaccination.count({ where });
  
      // --- Fetching records ---
      const allReports = await this.prisma.vaccination.findMany({
        where,
        orderBy,
        select: {
          id: true,
          date: true,
          name: true,
          notes: true,
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
        skip,
        take: limit,
      });
  
      // --- Illness count for dashboard ---
      const totalIllnessCount = await this.prisma.checkup.count({
        where: {
          cattle: {
            healthStatus: 'INJURED',
          },
        },
      });
  
      // --- Response format ---
      const checkupDashboard = {
        allReports,
        totalCheckups: allReports.length,
        totalIllnessCount: totalIllnessCount ?? 0,
        totalRecordCount: totalCount,
        totalPages: Math.ceil(totalCount / 25),
      };
  
      return {
        message,
        checkupDashboard,
      };
    } catch (err) {
      catchBlock(err);
    }
  }
  

  //Fetch specific animal vaccination records
  async gettingParticularAnimalVaccinationRecords(cattleName: string) {
    try {
      const animal =
        (await this.prisma.cattle.findFirst({ where: { cattleName } })) ||
        (() => {
          throw new NotFoundException('No cattle found with the given name');
        })();

      const allVaccinationRecords = await this.prisma.vaccination.findMany({
        where: { cattleName },
        orderBy: { date: 'desc' },
      });

      const vaccinationDetails = {
        cattleName: animal?.cattleName,
        image1: animal?.image1,
        image2: animal?.image2,
        type: animal?.type,
        active: animal?.active,
        lastVaccinationDate: allVaccinationRecords[0]?.date,
        vaccinationCount: allVaccinationRecords?.length,
        allVaccinationRecords,
      };

      return {
        message: `Showing all the details of the ${animal.cattleName}`,
        vaccinationDetails,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Update specific vaccination record
  async editParticularVaccinationRecord(
    id: number,
    editVaccinationDto: EditVaccinationDto,
  ) {
    try {
      const { date, ...restOfValues } = editVaccinationDto;

      (await this.prisma.vaccination.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No record found with the given id');
        })();

      await this.prisma.vaccination.update({
        where: { id },
        data: {
          date: new Date(date),
          ...restOfValues,
        },
      });

      return {
        message: 'Vaccination report updated successfully!',
        allRecords: await this.prisma.vaccination.findMany({
          orderBy: { date: 'desc' },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Delete specific animal record
  async deleteParticularVaccinationRecord(id: number) {
    try {
      (await this.prisma.vaccination.findFirst({ where: { id } })) ||
        (() => {
          throw new NotFoundException('No record found with the given id');
        })();

      await this.prisma.vaccination.delete({ where: { id } });
      return {
        message: 'Vaccination report deleted successfully!',
        allRecords: await this.prisma.vaccination.findMany({
          orderBy: { date: 'desc' },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Getting the specific records based date range
  async getVaccinationRecordsForSpecificDate(
    cattleName: string,
    fromDate: string,
    toDate: string,
  ) {
    try {
      const startTime = new Date(fromDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(toDate);
      endTime.setHours(23, 59, 59, 999);

      const allRecords = await this.prisma.vaccination.findMany({
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
