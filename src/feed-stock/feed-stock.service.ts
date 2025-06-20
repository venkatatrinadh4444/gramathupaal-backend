import { Injectable } from '@nestjs/common';
import { AddFeedStock } from './dto/add-feed-stock.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { catchBlock } from 'src/common/catch-block';

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
  async gettingAllFeedRecords() {
    try {
        const allRecords=await this.prisma.feedStock.findMany({orderBy:{date:'desc'}})

        return {message:'Showing all feed stock records',allRecords}
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
