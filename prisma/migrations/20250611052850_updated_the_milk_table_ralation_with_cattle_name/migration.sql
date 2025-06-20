-- DropForeignKey
ALTER TABLE "Milk" DROP CONSTRAINT "Milk_cattleId_fkey";

-- AddForeignKey
ALTER TABLE "Milk" ADD CONSTRAINT "Milk_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("cattleName") ON DELETE CASCADE ON UPDATE CASCADE;
