/*
  Warnings:

  - Changed the type of `type` on the `Cattle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `breed` on the `Cattle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CattleType" AS ENUM ('COW', 'BUFFALO', 'GOAT');

-- CreateEnum
CREATE TYPE "CattleBreed" AS ENUM ('KANNI_ADU', 'SALEM_BLACK', 'TELLICHERRY', 'KANGAYAM', 'UMBLACHERY', 'BARGUR', 'HALLIKAR', 'ONGOLE', 'MURRAH', 'SURTI', 'MEHSANA', 'LOCAL_NON_DESCRIPT');

-- AlterTable
ALTER TABLE "Cattle" DROP COLUMN "type",
ADD COLUMN     "type" "CattleType" NOT NULL,
DROP COLUMN "breed",
ADD COLUMN     "breed" "CattleBreed" NOT NULL;

-- DropEnum
DROP TYPE "SelectedBreed";

-- DropEnum
DROP TYPE "SelectedType";
