-- CreateEnum
CREATE TYPE "SelectedUnit" AS ENUM ('KG', 'PIECES', 'PACKETS');

-- CreateTable
CREATE TABLE "FeedStock" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "unit" "SelectedUnit" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "FeedStock_pkey" PRIMARY KEY ("id")
);
