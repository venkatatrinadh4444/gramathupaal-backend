-- CreateTable
CREATE TABLE "WaterConsumption" (
    "id" SERIAL NOT NULL,
    "session" "SelectedSession" NOT NULL,
    "quantity" DECIMAL(5,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cattleName" TEXT NOT NULL,

    CONSTRAINT "WaterConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedConsumption" (
    "id" SERIAL NOT NULL,
    "session" "SelectedSession" NOT NULL,
    "quantity" DECIMAL(5,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "feedName" TEXT NOT NULL,
    "cattleName" TEXT NOT NULL,

    CONSTRAINT "FeedConsumption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WaterConsumption" ADD CONSTRAINT "WaterConsumption_cattleName_fkey" FOREIGN KEY ("cattleName") REFERENCES "Cattle"("cattleName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedConsumption" ADD CONSTRAINT "FeedConsumption_cattleName_fkey" FOREIGN KEY ("cattleName") REFERENCES "Cattle"("cattleName") ON DELETE CASCADE ON UPDATE CASCADE;
