-- DropForeignKey
ALTER TABLE "public"."Employee" DROP CONSTRAINT "Employee_roleName_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoleModuleAccess" DROP CONSTRAINT "RoleModuleAccess_moduleName_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoleModuleAccess" DROP CONSTRAINT "RoleModuleAccess_roleName_fkey";

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "public"."Role"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleModuleAccess" ADD CONSTRAINT "RoleModuleAccess_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "public"."Role"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleModuleAccess" ADD CONSTRAINT "RoleModuleAccess_moduleName_fkey" FOREIGN KEY ("moduleName") REFERENCES "public"."Module"("name") ON DELETE CASCADE ON UPDATE CASCADE;
