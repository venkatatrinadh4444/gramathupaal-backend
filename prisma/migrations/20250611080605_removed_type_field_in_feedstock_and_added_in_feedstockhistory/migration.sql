/*
  Warnings:

  - You are about to drop the column `type` on the `FeedStock` table. All the data in the column will be lost.
  - Added the required column `type` to the `FeedStockHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FeedStock" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "FeedStockHistory" ADD COLUMN     "type" TEXT NOT NULL;
