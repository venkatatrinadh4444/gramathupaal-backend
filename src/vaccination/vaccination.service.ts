import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVaccinationDto } from './dto/add-vaccination.dto';
import { catchBlock } from 'src/common/catch-block';
import { EditVaccinationDto } from './dto/edit-vaccination.dto';

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
  async fetchingAllVaccinationRecords() {
    try {
      const allReports = await this.prisma.vaccination.findMany({
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          name: true,
          notes: true,
          doctorName:true,
          doctorPhone:true,
          cattle: {
            select: {
              image1: true,
              active: true,
              cattleName: true,
              type: true,
            },
          },
        },
      });
      const totalIllnessCount=await this.prisma.checkup.count({
        where:{
          cattle:{
            healthStatus:'INJURED'
          }
        }
      })
      const checkupDashboard={
        allReports,
        totalCheckups:allReports.length,
        totalIllnessCount:totalIllnessCount??0
      }
      return {
        message: 'Showing all the doctor vaccination reports',
        checkupDashboard
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
}
