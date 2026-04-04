/*
  Warnings:

  - The `testType` column on the `summative_tests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `grade` on the `summative_results` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SummativeTestType" AS ENUM ('OPENER', 'MID_TERM', 'END_TERM', 'CAT', 'ASSESSMENT', 'OTHER');

-- AlterTable
ALTER TABLE "summative_results" DROP COLUMN "grade",
ADD COLUMN     "grade" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "summative_tests" DROP COLUMN "testType",
ADD COLUMN     "testType" "SummativeTestType";

-- CreateIndex
CREATE INDEX "summative_results_grade_idx" ON "summative_results"("grade");

-- CreateIndex
CREATE INDEX "summative_results_testId_grade_marksObtained_idx" ON "summative_results"("testId", "grade", "marksObtained");

-- CreateIndex
CREATE INDEX "summative_tests_testType_idx" ON "summative_tests"("testType");

-- CreateIndex
CREATE UNIQUE INDEX "summative_tests_grade_learningArea_term_academicYear_testTy_key" ON "summative_tests"("grade", "learningArea", "term", "academicYear", "testType");
