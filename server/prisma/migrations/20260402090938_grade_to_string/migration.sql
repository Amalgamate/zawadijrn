/*
  Warnings:

  - The `summativeGrade` column on the `grading_ranges` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `grade` on the `classes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `learners` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `schemes_of_work` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `summative_tests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "classes" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;

-- AlterTable
ALTER TABLE "grading_ranges" ALTER COLUMN "summativeGrade" TYPE TEXT USING "summativeGrade"::TEXT;

-- AlterTable
ALTER TABLE "learners" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;

-- AlterTable
ALTER TABLE "schemes_of_work" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;

-- AlterTable
ALTER TABLE "summative_tests" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "classes_grade_stream_idx" ON "classes"("grade", "stream");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "classes_grade_stream_academicYear_term_key" ON "classes"("grade", "stream", "academicYear", "term");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "learners_grade_stream_idx" ON "learners"("grade", "stream");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "learners_grade_status_archived_idx" ON "learners"("grade", "status", "archived");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "schemes_of_work_grade_term_academicYear_idx" ON "schemes_of_work"("grade", "term", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "schemes_of_work_teacherId_grade_learningArea_term_academicY_key" ON "schemes_of_work"("teacherId", "grade", "learningArea", "term", "academicYear");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "summative_tests_grade_learningArea_term_idx" ON "summative_tests"("grade", "learningArea", "term");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "summative_tests_grade_term_academicYear_idx" ON "summative_tests"("grade", "term", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "summative_tests_grade_learningArea_term_academicYear_testTy_key" ON "summative_tests"("grade", "learningArea", "term", "academicYear", "testType");
