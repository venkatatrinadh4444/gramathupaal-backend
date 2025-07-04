import { BadRequestException, Injectable } from '@nestjs/common';
import { AddFeedStock } from './dto/add-feed-stock.dto';
import { PrismaService } from '../prisma/prisma.service';
import { catchBlock } from '../common/catch-block';
import { SelectedUnit } from '@prisma/client';

@Injectable()
export class FeedStockService {
  constructor(private readonly prisma: PrismaService) {}

  //Add new feed stock record
  async addNewStock(feedDto: AddFeedStock,userId:number) {
    try {
      const { name, unit, date, notes, quantity } = feedDto;
      const feedRecord = await this.prisma.feedStock.findFirst({
        where: {
          AND: {
            name,
            unit,
          },
        },
      });
      if (feedRecord) {
        await this.prisma.feedStock.update({
          where: { id: feedRecord.id },
          data: {
            date: new Date(date),
            notes,
            quantity: Number(feedRecord.quantity) + Number(quantity),
          },
        });

        await this.prisma.feedStockHistory.create({data:{
          newQuantity:quantity,
          type:"Added",
            feedStock:{
                connect:{
                    id:feedRecord.id
                }
            }
        }})
        return {
          message: 'Feed stock updated successfully!',
          allFeedDetails: await this.prisma.feedStock.findMany({
            orderBy: { date: 'desc' },
          }),
        };
      }
      const newRecord=await this.prisma.feedStock.create({
        data: {
          name,
          date: new Date(date),
          unit,
          quantity,
          notes,
          user:{
            connect:{
              id:userId
            }
          }
        },
      });

      await this.prisma.feedStockHistory.create({data:{
        newQuantity:quantity,
        type:"Added",
        feedStock:{
            connect:{
                id:newRecord.id
            }
        }
      }})
      
      return {
        message: 'New feed stock added successfully!',
        allFeedDetails: await this.prisma.feedStock.findMany({
          orderBy: { date: 'desc' },
        }),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetch all feed records
  async gettingAllFeedRecords(page:number,sortBy:string,filter:string,search:string) {
    try {

      const skip = (page - 1) * 25;
      const limit = 25;
      let message = 'showing initial feed stock data';

      let totalCount = await this.prisma.feedStock.count()

      let allRecords=await this.prisma.feedStock.findMany({orderBy:{date:'desc'},skip:skip,take:limit})

      if(sortBy) {
        message="showing the filtered feed stock data"
        switch(sortBy) {
          case "name-asc":
            allRecords = await this.prisma.feedStock.findMany({orderBy:{name:'asc'},skip:skip,take:limit})
            break;
          case "name-desc":
            allRecords = await this.prisma.feedStock.findMany({orderBy:{name:'desc'},skip:skip,take:limit})
            break;
          case "newest":
            allRecords = await this.prisma.feedStock.findMany({orderBy:{date:'desc'},skip:skip,take:limit})
            break;
          case "oldest":
            allRecords = await this.prisma.feedStock.findMany({orderBy:{date:'asc'},skip:skip,take:limit})
            break;
        }
      }

      if(filter) {
        message=`showing the filtered data based on ${filter}`
        switch(filter) {
          case filter as SelectedUnit:
            if (!Object.values(SelectedUnit).includes(filter as SelectedUnit)) {
                throw new BadRequestException('please enter a valid feed stock unit');
            }
            totalCount = await this.prisma.feedStock.count({where:{unit:filter}})
            allRecords = await this.prisma.feedStock.findMany({where:{
              unit:filter
            },skip:skip,take:limit})
            break;
          default :
              throw new BadRequestException('Please enter a valid query value')
        }
      }

      if(search) {
        message=`Showing the feed stock based on the ${search}`
        totalCount = await this.prisma.feedStock.count({where:{
          name:{
            contains:search,
            mode:'insensitive'
          }
        }})
        allRecords = await this.prisma.feedStock.findMany({
          where:{
            name:{
              contains:search,
              mode:'insensitive'
            }
          },
          skip:skip,
          take:limit
        })
      }

      const allStockData={
        allRecords,
        totalPages: Math.ceil(totalCount / 25),
        totalRecordsCount: totalCount
      }

        return {message,allStockData}
    } catch (err) {
        catchBlock(err)
    }
  }

  //Fetch specific feed record history
  async gettingParticularStockRecordHistory(id:number) {
    try {
        const allStockRecords=await this.prisma.feedStockHistory.findMany({where:{feedId:id},select:{
          id:true,
          feedId:true,
          newQuantity:true,
          type:true,
          createdAt:true,
          updatedAt:true,
          feedStock:{
            select:{
              name:true,
              quantity:true,
              unit:true
            }
          }
        },orderBy:{updatedAt:'desc'}})

        return {message:`Showing all history of feed ${allStockRecords?.[0].feedStock.name}`,allStockRecords}
    } catch (error) {
        catchBlock(error)
    }
  }

  //Get all the stock names
  async gettingAllFeedStockNames() {
    try {
      const allStockNames=await this.prisma.feedStock.findMany({
        where:{quantity:{gt:0}},
        select:{
          name:true
        }
      })
      return {message:'Showing all the stock names quantity greater than 0',allStockNames}
    } catch (err) {
      catchBlock(err)
    }
  }

}
