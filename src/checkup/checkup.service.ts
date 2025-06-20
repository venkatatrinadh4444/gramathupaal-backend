import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCheckupDto } from './dto/add-checkup.dto';
import { catchBlock } from 'src/common/catch-block';
import { EditCheckupDto } from './dto/edit-checkup.dto';

@Injectable()
export class CheckupService {
  constructor(private readonly prisma: PrismaService) {}

  //Add new doctor checkup
  async addNewCheckup(checkupDto:CreateCheckupDto) {
    try {
      const {type,cattleName,date,...restOfValues}=checkupDto
      
      await this.prisma.cattle.findFirst({where:{
        AND:{
          type,
          cattleName
        }
      }}) || (()=>{throw new NotFoundException('No cattle found with the type and cattle name')})()

      await this.prisma.checkup.create({data:{
        cattle:{
          connect:{
            cattleName:cattleName
          }
        },
        date:new Date(date),
        ...restOfValues
      }})

      return {message:'New doctor checkup added successfully!',allRecords:await this.prisma.checkup.findMany({orderBy:{date:'desc'}})}

    } catch (err) {
      catchBlock(err)
    }
  }

    //Fetch all the checkup records
  async fetchingAllCheckups() {
    try {
      const allCheckups=await this.prisma.checkup.findMany({orderBy:{date:'desc'},select:{
        id:true,
        date:true,
        prescription:true,
        description:true,
        doctorName:true,
        doctorPhone:true,
        cattle:{
          select:{
            image1:true,
            active:true,
            cattleName:true,
            type:true
          }
        }
      }})
      return {message:'Showing all the doctor checkups',allCheckups}
    } catch (err) {
      catchBlock(err)
    }
  }

  //Fetch specific animal checkup records
  async gettingParticularAnimalCheckups(cattleName:string) {
    try {
      const animal = await this.prisma.cattle.findFirst({where:{cattleName}}) || (()=>{throw new NotFoundException('No cattle found with the given name')})()
      const allChecupRecords=await this.prisma.checkup.findMany({where:{cattleName},orderBy:{date:'desc'}})

      const checkupDetails= {
        cattleName:animal?.cattleName,
        image1:animal?.image1,
        image2:animal?.image2,
        type:animal.type,
        active:animal.active,
        lastCheckupDate:allChecupRecords[0]?.date,
        checkupCount:allChecupRecords?.length,
        allChecupRecords
      }

      return {message:`Showing all the details of the ${animal.cattleName}`,checkupDetails}

    } catch (err) {
      catchBlock(err)
    }
  }
  
  //Update specific checkup record
  async editParticularCheckupRecord(id:number,editCheckupDto:EditCheckupDto) {
    try {
      const {date,...restOfValues}=editCheckupDto
      await this.prisma.checkup.findFirst({where:{id}}) || (()=> { throw new NotFoundException('No record found with the given id')})()
      await this.prisma.checkup.update({where:{id},data:{
        date:new Date(date),
        ...restOfValues
      }})
      return {message:'Checkup report updated successfully!',allRecords:await this.prisma.checkup.findMany({orderBy:{date:'desc'}})}

    } catch (err) {
      catchBlock(err)
    }
  }

  //Delete specific checkup record
  async deleteParticularCheckupRecord(id:number) {
    try {
      await this.prisma.checkup.findFirst({where:{id}}) || (()=>{throw new NotFoundException('No record found with the given id')})()
      await this.prisma.checkup.delete({where:{id}})
      return {message:'Checkup report deleted successfully!',allRecords:await this.prisma.checkup.findMany({orderBy:{date:'desc'}})}
      
    } catch (err) {
      catchBlock(err)
    }
  }


}