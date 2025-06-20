/*
  Warnings:

  - You are about to drop the `WaterConsumption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WaterConsumption" DROP CONSTRAINT "WaterConsumption_cattleName_fkey";

-- DropTable
DROP TABLE "WaterConsumption";
