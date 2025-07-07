/*
  Warnings:

  - The values [A3] on the enum `SelectedMilkGrade` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SelectedMilkGrade_new" AS ENUM ('A1', 'A2', 'OneCowA1', 'OneCowA2');
ALTER TABLE "Milk" ALTER COLUMN "milkGrade" TYPE "SelectedMilkGrade_new" USING ("milkGrade"::text::"SelectedMilkGrade_new");
ALTER TYPE "SelectedMilkGrade" RENAME TO "SelectedMilkGrade_old";
ALTER TYPE "SelectedMilkGrade_new" RENAME TO "SelectedMilkGrade";
DROP TYPE "SelectedMilkGrade_old";
COMMIT;
