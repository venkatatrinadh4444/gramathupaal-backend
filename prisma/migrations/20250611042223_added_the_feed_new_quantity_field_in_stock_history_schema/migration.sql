/*
  Warnings:

  - Added the required column `newQuantity` to the `FeedStockHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FeedStockHistory" ADD COLUMN     "newQuantity" DECIMAL(10,2) NOT NULL;
