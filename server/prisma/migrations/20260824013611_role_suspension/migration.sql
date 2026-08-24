-- AlterTable
ALTER TABLE "identity"."RoleAssignment" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedBy" TEXT;
