-- CreateTable
CREATE TABLE "Checkup" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "prescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cattleName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Checkup" ADD CONSTRAINT "Checkup_cattleName_fkey" FOREIGN KEY ("cattleName") REFERENCES "Cattle"("cattleName") ON DELETE CASCADE ON UPDATE CASCADE;
