-- Add institutionType to users for portal scoping.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "institutionType" "InstitutionType" NOT NULL DEFAULT 'PRIMARY_CBC';

