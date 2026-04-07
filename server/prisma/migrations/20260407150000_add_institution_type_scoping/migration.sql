-- Add institutionType scoping for multi-portal (Junior vs Senior School).
-- Generated via `prisma migrate diff` (DB -> schema) and committed as a standard migration.

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('PRIMARY_CBC', 'SECONDARY');

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "institutionType" "InstitutionType" NOT NULL DEFAULT 'PRIMARY_CBC';

-- AlterTable
ALTER TABLE "learners" ADD COLUMN     "institutionType" "InstitutionType" NOT NULL DEFAULT 'PRIMARY_CBC';

-- AlterTable
ALTER TABLE "learning_areas" ADD COLUMN     "institutionType" "InstitutionType" NOT NULL DEFAULT 'PRIMARY_CBC';

-- CreateIndex
CREATE INDEX "classes_institutionType_grade_stream_idx" ON "classes"("institutionType", "grade", "stream");

-- CreateIndex
CREATE INDEX "learners_institutionType_grade_stream_idx" ON "learners"("institutionType", "grade", "stream");

-- CreateIndex
CREATE INDEX "learning_areas_institutionType_gradeLevel_idx" ON "learning_areas"("institutionType", "gradeLevel");

