/*
  Warnings:

  - The `summativeGrade` column on the `grading_ranges` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `grade` on the `classes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `learners` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `schemes_of_work` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `summative_tests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "classes" DROP COLUMN "grade",
ADD COLUMN     "grade" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "grading_ranges" DROP COLUMN "summativeGrade",
ADD COLUMN     "summativeGrade" TEXT;

-- AlterTable
ALTER TABLE "learners" DROP COLUMN "grade",
ADD COLUMN     "grade" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "schemes_of_work" DROP COLUMN "grade",
ADD COLUMN     "grade" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "summative_tests" DROP COLUMN "grade",
ADD COLUMN     "grade" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "classes_grade_stream_idx" ON "classes"("grade", "stream");

-- CreateIndex
CREATE UNIQUE INDEX "classes_grade_stream_academicYear_term_key" ON "classes"("grade", "stream", "academicYear", "term");

-- CreateIndex
CREATE INDEX "learners_grade_stream_idx" ON "learners"("grade", "stream");

-- CreateIndex
CREATE INDEX "learners_grade_status_archived_idx" ON "learners"("grade", "status", "archived");

-- CreateIndex
CREATE INDEX "schemes_of_work_grade_term_academicYear_idx" ON "schemes_of_work"("grade", "term", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "schemes_of_work_teacherId_grade_learningArea_term_academicY_key" ON "schemes_of_work"("teacherId", "grade", "learningArea", "term", "academicYear");

-- CreateIndex
CREATE INDEX "summative_tests_grade_learningArea_term_idx" ON "summative_tests"("grade", "learningArea", "term");

-- CreateIndex
CREATE INDEX "summative_tests_grade_term_academicYear_idx" ON "summative_tests"("grade", "term", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "summative_tests_grade_learningArea_term_academicYear_testTy_key" ON "summative_tests"("grade", "learningArea", "term", "academicYear", "testType");
