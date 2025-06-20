/*
  Warnings:

  - Added the required column `unit` to the `FeedConsumption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FeedConsumption" ADD COLUMN     "unit" TEXT NOT NULL;
