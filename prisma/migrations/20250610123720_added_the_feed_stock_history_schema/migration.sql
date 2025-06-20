/*
  Warnings:

  - Added the required column `type` to the `FeedStock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FeedStock" ADD COLUMN     "type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "FeedStockHistory" (
    "id" SERIAL NOT NULL,
    "feedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedStockHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedStockHistory" ADD CONSTRAINT "FeedStockHistory_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "FeedStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
