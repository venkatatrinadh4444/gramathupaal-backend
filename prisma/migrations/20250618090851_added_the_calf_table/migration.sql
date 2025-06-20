/*
  Warnings:

  - Added the required column `doctorName` to the `Checkup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorPhone` to the `Checkup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorName` to the `Vaccination` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorPhone` to the `Vaccination` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SelectGender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "Checkup" ADD COLUMN     "doctorName" TEXT NOT NULL,
ADD COLUMN     "doctorPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vaccination" ADD COLUMN     "doctorName" TEXT NOT NULL,
ADD COLUMN     "doctorPhone" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Calf" (
    "id" SERIAL NOT NULL,
    "calfId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "SelectGender" NOT NULL,
    "healthStatus" "HealthStatus" NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "cattleName" TEXT NOT NULL,

    CONSTRAINT "Calf_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Calf" ADD CONSTRAINT "Calf_cattleName_fkey" FOREIGN KEY ("cattleName") REFERENCES "Cattle"("cattleName") ON DELETE CASCADE ON UPDATE CASCADE;
