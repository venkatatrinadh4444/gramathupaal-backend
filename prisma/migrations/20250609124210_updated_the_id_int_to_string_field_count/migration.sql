/*
  Warnings:

  - The primary key for the `Cattle` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Cattle" DROP CONSTRAINT "Cattle_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Cattle_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Cattle_id_seq";
