/*
  Warnings:

  - A unique constraint covering the columns `[calfId]` on the table `Calf` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Calf_calfId_key" ON "Calf"("calfId");
