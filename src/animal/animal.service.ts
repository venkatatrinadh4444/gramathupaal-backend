import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AddAnimalDto } from "./dto/add-animal.dto";
import { PrismaService } from "../prisma/prisma.service";
import { catchBlock } from "../common/catch-block";
import { put } from "@vercel/blob";
import { ConfigService } from "@nestjs/config";
import { $Enums, CattleBreed } from "@prisma/client";
import { EditAnimalDto } from "./dto/edit-animal.dto";
import { AddNewCalfDto } from "./dto/add-calf.dto";
import { take } from "rxjs";

@Injectable() 
export class AnimalService {

    constructor(private readonly prisma:PrismaService,private readonly configService:ConfigService) {}
    
    //Add new animal
    async addAnimal(animalDto:AddAnimalDto,image1:Express.Multer.File,image2:Express.Multer.File,userId:number) {
        try {
            const {cattleName,farmEntry,birthDate,weight,type,images,...restOfValues}=animalDto

            await this.prisma.cattle.findFirst({where:{cattleName:cattleName}}) && (()=>{throw new BadRequestException('Cattle ID is already in use')})()

            const imageUrl1=await put(image1.originalname,image1.buffer,{
              access:'public',
              token:this.configService.get('BLOB_READ_WRITE_TOKEN'),
              allowOverwrite:true
            })

            const imageUrl2=await put(image2.originalname,image2.buffer,{
              access:"public",
              token:this.configService.get('BLOB_READ_WRITE_TOKEN'),
              allowOverwrite:true
            })

            await this.prisma.cattle.create({data:{
              user: {
                connect:{
                  id:userId
                }
              },
              cattleName:cattleName,
              type,
              image1:imageUrl1?.url,
              image2:imageUrl2?.url,
              farmEntryDate:new Date(farmEntry),
              birthDate:new Date(birthDate),
              weight:Number(weight),
              ...restOfValues
            }})

            return {message:'New animal added successfully!'}
        }
        catch(err) {
            catchBlock(err)
        }
    }

    // Get all cattles
    async gettingAllCattles(page:number,sortBy:string,filter:string) {
      try {
        const skip=(page-1)*25
        const limit=25
        let totalPages:number | undefined;
        let allCattlesDetails:any;
        let message:string='showing the intial paginated data'

        totalPages=await this.prisma.cattle.count()
        allCattlesDetails=await this.prisma.cattle.findMany({orderBy:{farmEntryDate:'desc'},skip:skip,take:limit})
        const allCattles:any[]=[]

        if(sortBy) {
          message='showing the sorted data'
          switch(sortBy) {
            case "name-asc":
              allCattlesDetails=await this.prisma.cattle.findMany({orderBy:{cattleName:'asc'},skip:skip,take:limit})
              break;
            case "name-desc":
              allCattlesDetails=await this.prisma.cattle.findMany({orderBy:{cattleName:'desc'},skip:skip,take:limit})
              break;
            case "newest":
              allCattlesDetails=await this.prisma.cattle.findMany({orderBy:{farmEntryDate:'desc'},skip:skip,take:limit})
              break;
            case "oldest":
              allCattlesDetails=await this.prisma.cattle.findMany({orderBy:{farmEntryDate:'asc'},skip:skip,take:limit})
              break;
            default :
              throw new BadRequestException('Please enter a valid query value')
          }
        }

        if(filter) {
          message='showing the filtered data'
          switch(filter) {
            case "COW":
              totalPages=await this.prisma.cattle.count({where:{type:'COW'}})
              allCattlesDetails=await this.prisma.cattle.findMany({where:{type:'COW'},orderBy:{farmEntryDate:'desc'},skip:skip,take:limit})
              break;
            case "BUFFALO":
              totalPages=await this.prisma.cattle.count({where:{type:'BUFFALO'}})
              allCattlesDetails=await this.prisma.cattle.findMany({where:{type:'BUFFALO'},orderBy:{farmEntryDate:'desc'},skip:skip,take:limit})
              break;
            case "GOAT":
              totalPages=await this.prisma.cattle.count({where:{type:'GOAT'}})
              allCattlesDetails=await this.prisma.cattle.findMany({where:{type:'GOAT'},orderBy:{farmEntryDate:'desc'},skip:skip,take:limit})
              break;
            case filter as CattleBreed : 
               if(!Object.values(CattleBreed).includes(filter as CattleBreed)) {
                throw new BadRequestException('please enter a valid breed name')
               }
               totalPages=await this.prisma.cattle.count({where:{breed:filter}})
               allCattlesDetails=await this.prisma.cattle.findMany({where:{breed:filter},orderBy:{farmEntryDate:'desc'},skip:skip,take:limit})
               break;
            default :
              throw new BadRequestException('Please enter a valid query value')
          }
        }

        for(const eachCattle of allCattlesDetails) {
          const averageValue=await this.prisma.milk.aggregate({
            where:{
              cattleId:eachCattle.cattleName
            },
            _avg:{
              morningMilk:true,
              afternoonMilk:true,
              eveningMilk:true
            }
          })
          const eachCattleDetails={
            ...eachCattle,
            averageMilk:Number(averageValue._avg.morningMilk)+Number(averageValue._avg.afternoonMilk)+Number(averageValue._avg.eveningMilk)/3,
            totalPages:Math.ceil(totalPages/25),
            totalAnimalCount:totalPages
            
          }
          allCattles.push(eachCattleDetails)
        }

        return {message,allCattles}
      } catch (err) {
        catchBlock(err)
      }
    }

    //Fetching particular animal details
    async showingParticularAnimal(cattleName:string) {
      try {
        const animal=await this.prisma.cattle.findFirst({where:{cattleName:cattleName}}) || (()=> {
          throw new NotFoundException('No animal found with the cattle ID')
        }) ()

        const averageMilk=await this.prisma.milk.aggregate({
          where:{cattleId:cattleName},
          _avg: {
            morningMilk:true,
            afternoonMilk:true,
            eveningMilk:true
          }
        })
        
        const overallAverageMilk=Number(averageMilk._avg.morningMilk)+Number(averageMilk._avg.afternoonMilk)+Number(averageMilk._avg.eveningMilk)

        const vaccinationRecords=await this.prisma.vaccination.findMany({where:{cattleName:animal.cattleName},orderBy:{date:'desc'}})

        const averageFeed=await this.prisma.feedConsumption.aggregate({
          where:{cattleName:animal.cattleName},
          _avg:{
            quantity:true
          }
        })
        
        const calfCount=await this.prisma.calf.count({
          where:{cattleName},
          orderBy:{birthDate:'desc'}
        })


        const animalDetails={
          overallAverageMilk:overallAverageMilk/3,
          lastVaccination:vaccinationRecords[0]?.date || null,
          averageFeed:averageFeed._avg.quantity ?? 0,
          calfCount:calfCount ?? 0,
          cattleDetails:animal
        }

        return {message:`Showing the details of the animal ${cattleName}`,animalDetails}

      } catch (err) {
        catchBlock(err)
      }
    }

    //Update particular animal details
    async updateParticularAnimalDetails(id:number,animalDto:EditAnimalDto) {
      try {
        const {cattleName,farmEntry,birthDate,weight,...restOfValues}=animalDto

        await this.prisma.cattle.findFirst({where:{id}}) || (()=>{
          throw new NotFoundException('No animal found with the id')
        })()

        await this.prisma.cattle.update({where:{id},data:{
              cattleName:cattleName,
              farmEntryDate:new Date(farmEntry),
              birthDate:new Date(birthDate),
              weight:Number(weight),
              ...restOfValues
            }})

        return {message:'Animal details updated successfully!',cattleDetails:await this.prisma.cattle.findFirst({where:{id}})}
      } catch (err) {
        catchBlock(err)
      }
    }

    //Delete particular animal
    async deleteParticularAnimal(id:number) {
      try {
        await this.prisma.cattle.findFirst({where:{id}}) || (()=> {
          throw new NotFoundException('No animal found with the id')
        })()

        await this.prisma.cattle.delete({where:{id}})

        return {message:'Animal deleted successfully!'}

      } catch (err) {
        catchBlock(err)
      }
    }

    //Get the list of cattle names
    async gettingAllCattleIds() {
      try {
        const allCattlesIds=await this.prisma.cattle.findMany({where:{active:true},
          select:{
            cattleName:true
          }
        })
        return {message:"Showing all cattle id's",allCattlesIds}
      } catch (err) {
        catchBlock(err)
      }
    }

    //Fetching feed history for specific animal
    async getFeedHistory(cattleName:string) {
      try {
        await this.prisma.cattle.findFirst({where:{cattleName}}) || (()=>{throw new NotFoundException('No animal found with the given id')})()

        const feedHistory=await this.prisma.feedConsumption.findMany({where:{cattleName},orderBy:{date:'desc'}})

        return {message:`Showing all feed records ${cattleName}`,feedHistory}

      } catch (err) {
        catchBlock(err)
      }
    }

    //Fetching milk production history for specific animal
    async milkProductionHistory(cattleName:string) {
      try {
        await this.prisma.cattle.findFirst({where:{cattleName}}) || (()=>{throw new NotFoundException('No animal found with the given id')})()

        const allMilkRecords=await this.prisma.milk.findMany({where:{cattleId:cattleName},orderBy:{date:'desc'}})

        return {message:`Showing all milk records ${cattleName}`,allMilkRecords}

      } catch (err) {
        catchBlock(err)
      }
    }

    //Fetching checkup history for specific animal
    async getCheckupHistory(cattleName:string) {
      try {
        await this.prisma.cattle.findFirst({where:{cattleName}}) || (()=>{throw new NotFoundException('No animal found with the given id')})()

        const medicalReports=await this.prisma.checkup.findMany({where:{cattleName},orderBy:{date:'desc'}})

        return {message:`Showing all medical records ${cattleName}`,medicalReports}

      } catch (err) {
        catchBlock(err)
      }
    }

    //Fetching cattle management data for top section
    async getDataForDashboardTopSection(query:string,date:string) {
      try {
        const today=new Date()
        today.setHours(23,59,59,999)

        let topSection:any=null

        const gettingTopData=async (startDate:any,endDate:any)=> {
          const totalMilk=await this.prisma.milk.aggregate({
            where:{
              date:{
                gte:startDate,
                lte:endDate
              }
            },
            _sum:{
              morningMilk:true,
              afternoonMilk:true,
              eveningMilk:true
            }
          })
  
          const totalCattle=await this.prisma.cattle.findMany({where:{active:true}})
          
  
          const totalIllnessCases=await this.prisma.cattle.findMany({
            where:{
              healthStatus:"INJURED"
            }
          })
  
          const newlyAddedCattle=await this.prisma.cattle.findMany({
            where:{
              farmEntryDate:{
                gte:startDate,
                lte:endDate
              }
            }
          })
  
          const a2MilkCount=await this.prisma.milk.aggregate({
            where:{
              milkGrade:"A2"
            },
            _sum: {
              morningMilk:true,
              afternoonMilk:true,
              eveningMilk:true
            }
          })
  
          const topSection={
            totalMilk:Number(totalMilk._sum.morningMilk)+Number(totalMilk._sum.afternoonMilk)+Number(totalMilk._sum.eveningMilk),
            totalCattle:totalCattle.length,
            totalIllnessCases:totalIllnessCases.length,
            newlyAddedCattle:newlyAddedCattle.length,
            a2MilkCount:Number(a2MilkCount._sum.morningMilk)+Number(a2MilkCount._sum.afternoonMilk)+Number(a2MilkCount._sum.eveningMilk)
          }

          return topSection;
        }

        if(date) {
          const specificStartDate=new Date(date)
          specificStartDate.setHours(0,0,0,0)
          const specificEndTime=new Date()
          specificEndTime.setHours(23,59,59,999)
          topSection =await gettingTopData(specificStartDate,specificEndTime)
          return {message:`Showing the dashboard data for cattle management top section based on ${date}`,topSection}
        }

        switch(query) {
          case "Week":
            const lastWeek=new Date()
            lastWeek.setDate(today.getDate()-6)
            lastWeek.setHours(0,0,0,0)
            topSection = await gettingTopData(lastWeek,today)
            break;
          case "Month":
            const lastMonth=new Date()
            lastMonth.setDate(today.getMonth() - 1)
            lastMonth.setHours(0,0,0,0)
            topSection = await gettingTopData(lastMonth,today)
            break;
          case "Quarter":
            const lastSixMonths=new Date()
            lastSixMonths.setMonth(today.getMonth()-6)
            lastSixMonths.setHours(0,0,0,0)
            topSection=await gettingTopData(lastSixMonths,today)
            break;
          case "Year":
            const lastYear=new Date()
            lastYear.setFullYear(lastYear.getFullYear()-1)
            lastYear.setHours(0,0,0,0)
            topSection=await gettingTopData(lastYear,today)
            break;
          default:
            throw new BadRequestException('Enter a valid query value {Week,Month,Quarter,Year}')
        }
       
        return {message:`Showing the dashboard data for cattle management top section based on ${query}`,topSection}

      } catch (err) {
        catchBlock(err)
      }
    }

    //Fetching all the recent health checkup reocords
    async getHealthRecordsForDashboard() {
      try {
        const healthRecords=await this.prisma.checkup.findMany({
          orderBy:{date:'desc'}
        })
        return {message:'Showing all the checkup records',healthRecords}
      } catch (err) {
        catchBlock(err)        
      }
    }

    //Fetching all the checkup records data for dashboard graph
    async getHealthRecordsForDashboardGraph(query:string) {
      try {
        const endDate=new Date()
        endDate.setHours(23,59,59,999)

        const getCheckupCount=async (startDate:any,endDate:any)=> {
          const totalCowCount=await this.prisma.checkup.count({where:{
            cattle:{
              type:"COW"
            },
            date:{
              gte:startDate,
              lte:endDate
            }
          }})
          const totalBuffaloCount=await this.prisma.checkup.count({
            where:{
              cattle:{
                type:"BUFFALO"
              },
              date:{
                gte:startDate,
                lte:endDate
              }
            }
          })
          const totalGoatCount=await this.prisma.checkup.count({
            where:{
              cattle:{
                type:"GOAT"
              },
              date:{
                gte:startDate,
                lte:endDate
              }
            }
          })
          const totalValues={
            totalCowCount,
            totalBuffaloCount,
            totalGoatCount
          }
          return totalValues
        }

        let totalCheckupCounts:any;
        switch(query) {
          case "Week":
            const startDate=new Date()
            startDate.setDate(endDate.getDate()-6)
            startDate.setHours(0,0,0,0)
            totalCheckupCounts= await getCheckupCount(startDate,endDate)
            break;
          case "Month":
            const lastMonth=new Date()
            lastMonth.setDate(endDate.getMonth() - 1)
            lastMonth.setHours(0,0,0,0)
            totalCheckupCounts = await getCheckupCount(lastMonth,endDate)
            break;
          case "Quarter":
            const lastSixMonths=new Date()
            lastSixMonths.setMonth(endDate.getMonth()-6)
            lastSixMonths.setHours(0,0,0,0)
            totalCheckupCounts =await getCheckupCount(lastSixMonths,endDate)
            break;
          case "Year":
            const lastYear=new Date()
            lastYear.setFullYear(lastYear.getFullYear()-1)
            lastYear.setHours(0,0,0,0)
            totalCheckupCounts=await getCheckupCount(lastYear,endDate)
            break;
          default:
            throw new BadRequestException('Enter a valid query value {Week,Month,Quarter,Year}')
        }

        return {message:`Showing the count of health checkup reports based on ${query}`,totalCheckupCounts}
      } catch (err) {
        catchBlock(err)
      }
    }

    //Fetching the list of feed stock records
    async getDashboardFeedStockRecords(query:string) {
      try {
        const endDate=new Date()
        endDate.setHours(23,59,59,999)

        const getFeedStockRecords=async(startDate:any,endDate:any)=> {
          const feedRecords=await this.prisma.feedStock.findMany({
            where:{
              date:{
                gte:startDate,
                lte:endDate
              }
            },
            orderBy:{
              date:"desc"
            }
          })
          return feedRecords
        }

        let totalFeedRecords:any;
        switch(query) {
          case "Week":
            const startDate=new Date()
            startDate.setDate(endDate.getDate()-6)
            startDate.setHours(0,0,0,0)
            totalFeedRecords= await getFeedStockRecords(startDate,endDate)
            break;
          case "Month":
            const lastMonth=new Date()
            lastMonth.setDate(endDate.getMonth() - 1)
            lastMonth.setHours(0,0,0,0)
            totalFeedRecords = await getFeedStockRecords(lastMonth,endDate)
            break;
          case "Quarter":
            const lastSixMonths=new Date()
            lastSixMonths.setMonth(endDate.getMonth()-6)
            lastSixMonths.setHours(0,0,0,0)
            totalFeedRecords =await getFeedStockRecords(lastSixMonths,endDate)
            break;
          case "Year":
            const lastYear=new Date()
            lastYear.setFullYear(lastYear.getFullYear()-1)
            lastYear.setHours(0,0,0,0)
            totalFeedRecords =await getFeedStockRecords(lastYear,endDate)
            break;
          default:
            throw new BadRequestException('Enter a valid query value {Week,Month,Quarter,Year}')
        }

        return {message:`Showing the health checkup reports based on ${query}`, totalFeedRecords}
      } catch (err) {
        catchBlock(err)
      }
    }

    async addNewCalf(calfDto:AddNewCalfDto) {
      try {
        const {birthDate,cattleName,...restOfValues}=calfDto

        await this.prisma.cattle.findFirst({where:{cattleName}}) || (()=>{
          throw new BadRequestException('Enter a valid cattle name')
        })()

        await this.prisma.calf.create({
          data:{
            cattle:{
              connect:{
                cattleName:cattleName
              }
            },
            birthDate:new Date(birthDate),
            ...restOfValues
          }
        })

        const allCalfs=await this.prisma.calf.findMany({where:{cattleName:cattleName},orderBy:{birthDate:'desc'}})

        return {message:'New calf added successfully!',allCalfs}

      } catch (err) {
        
      }
    }

    async allCalfDetails(cattleName:string) {
      try {
        await this.prisma.cattle.findFirst({where:{cattleName}}) || (()=>{
          throw new BadRequestException('Enter a valid cattle name')
        })()
        const allCalfs=await this.prisma.calf.findMany({
          where:{
            cattleName:cattleName
          },
          orderBy:{
            birthDate:'desc'
          }
        })
        return {message:`Showing all the calf details for ${cattleName}`,allCalfs}
      } catch (err) {
        catchBlock(err)
      }
    }
    
}