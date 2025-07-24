/*
  Warnings:

  - You are about to alter the column `weight` on the `Cattle` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE "Cattle" ALTER COLUMN "weight" SET DATA TYPE DECIMAL(5,2);
