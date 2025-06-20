/*
  Warnings:

  - You are about to drop the column `image` on the `Cattle` table. All the data in the column will be lost.
  - Added the required column `image1` to the `Cattle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image2` to the `Cattle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cattle" DROP COLUMN "image",
ADD COLUMN     "image1" TEXT NOT NULL,
ADD COLUMN     "image2" TEXT NOT NULL;
