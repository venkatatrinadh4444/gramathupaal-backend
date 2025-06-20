/*
  Warnings:

  - Added the required column `feedType` to the `FeedConsumption` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('WATER', 'FEED');

-- AlterTable
ALTER TABLE "FeedConsumption" ADD COLUMN     "feedType" "FeedType" NOT NULL;
