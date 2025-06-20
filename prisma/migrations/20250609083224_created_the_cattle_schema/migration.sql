-- CreateEnum
CREATE TYPE "SelectedRole" AS ENUM ('SuperAdmin', 'Admin', 'Doctor');

-- CreateEnum
CREATE TYPE "SelectedType" AS ENUM ('COW', 'BUFFALO', 'GOAT');

-- CreateEnum
CREATE TYPE "SelectedBreed" AS ENUM ('KANNI_ADU', 'SALEM_BLACK', 'TELLICHERRY', 'KANGAYAM', 'UMBLACHERY', 'BARGUR', 'HALLIKAR', 'ONGOLE', 'MURRAH', 'SURTI', 'MEHSANA', 'LOCAL_NON_DESCRIPT');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'INJURED');

-- CreateEnum
CREATE TYPE "InseminationType" AS ENUM ('NATURAL_SERVICE', 'ARTIFICIAL_INSEMINATION', 'EMBRYO_TRANSFER', 'IN_VITRO_FERTILIZATION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ParentOrigin" AS ENUM ('FARM_OWNED', 'FARM_BORN', 'PURCHASED', 'GOVT_BREEDING_CENTER', 'PRIVATE_CENTER', 'UNKNOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "SelectedRole" NOT NULL,
    "otp" TEXT,
    "expiresIn" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cattle" (
    "id" TEXT NOT NULL,
    "cattleId" TEXT NOT NULL,
    "healthStatus" "HealthStatus" NOT NULL,
    "type" "SelectedType" NOT NULL,
    "weight" INTEGER NOT NULL,
    "snf" DECIMAL(5,2) NOT NULL,
    "image" TEXT NOT NULL,
    "fatherInsemination" "InseminationType" NOT NULL,
    "parent" "ParentOrigin" NOT NULL,
    "breed" "SelectedBreed" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "farmEntryDate" TIMESTAMP(3) NOT NULL,
    "purchaseAmount" DECIMAL(10,2) NOT NULL,
    "vendorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cattle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cattle_cattleId_key" ON "Cattle"("cattleId");
