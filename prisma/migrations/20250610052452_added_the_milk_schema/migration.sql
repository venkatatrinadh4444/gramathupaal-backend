/*
  Warnings:

  - You are about to drop the column `cattleId` on the `Cattle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cattleName]` on the table `Cattle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cattleName` to the `Cattle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SelectedSession" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "SelectedMilkGrade" AS ENUM ('A1', 'A2', 'A3');

-- DropIndex
DROP INDEX "Cattle_cattleId_key";

-- AlterTable
ALTER TABLE "Cattle" DROP COLUMN "cattleId",
ADD COLUMN     "cattleName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Milk" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "milkGrade" "SelectedMilkGrade" NOT NULL,
    "morningMilk" DECIMAL(5,2) NOT NULL,
    "afternoonMilk" DECIMAL(5,2) NOT NULL,
    "eveningMilk" DECIMAL(5,2) NOT NULL,
    "cattleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cattle_cattleName_key" ON "Cattle"("cattleName");

-- AddForeignKey
ALTER TABLE "Milk" ADD CONSTRAINT "Milk_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
