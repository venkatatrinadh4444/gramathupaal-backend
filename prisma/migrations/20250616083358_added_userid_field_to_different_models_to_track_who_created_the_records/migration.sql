/*
  Warnings:

  - The primary key for the `Cattle` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Cattle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `userId` to the `Cattle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `FeedConsumption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `FeedStock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Milk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cattle" DROP CONSTRAINT "Cattle_pkey",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Cattle_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FeedConsumption" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "FeedStock" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Milk" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Cattle" ADD CONSTRAINT "Cattle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milk" ADD CONSTRAINT "Milk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedStock" ADD CONSTRAINT "FeedStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedConsumption" ADD CONSTRAINT "FeedConsumption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
