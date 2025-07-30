/*
  Warnings:

  - You are about to drop the column `moduleId` on the `RoleModuleAccess` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `RoleModuleAccess` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roleName,moduleName]` on the table `RoleModuleAccess` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `moduleName` to the `RoleModuleAccess` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleName` to the `RoleModuleAccess` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."RoleModuleAccess" DROP CONSTRAINT "RoleModuleAccess_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoleModuleAccess" DROP CONSTRAINT "RoleModuleAccess_roleId_fkey";

-- DropIndex
DROP INDEX "public"."RoleModuleAccess_roleId_moduleId_key";

-- AlterTable
ALTER TABLE "public"."RoleModuleAccess" DROP COLUMN "moduleId",
DROP COLUMN "roleId",
ADD COLUMN     "moduleName" TEXT NOT NULL,
ADD COLUMN     "roleName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RoleModuleAccess_roleName_moduleName_key" ON "public"."RoleModuleAccess"("roleName", "moduleName");

-- AddForeignKey
ALTER TABLE "public"."RoleModuleAccess" ADD CONSTRAINT "RoleModuleAccess_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "public"."Role"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleModuleAccess" ADD CONSTRAINT "RoleModuleAccess_moduleName_fkey" FOREIGN KEY ("moduleName") REFERENCES "public"."Module"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
