/*
  Warnings:

  - A unique constraint covering the columns `[grade,stream,academicYear,term,schoolId]` on the table `classes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[academicYear,term,schoolId]` on the table `term_configs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "classes_grade_stream_academicYear_term_key";

-- DropIndex
DROP INDEX "term_configs_academicYear_term_key";

-- CreateIndex
CREATE UNIQUE INDEX "classes_grade_stream_academicYear_term_schoolId_key" ON "classes"("grade", "stream", "academicYear", "term", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "term_configs_academicYear_term_schoolId_key" ON "term_configs"("academicYear", "term", "schoolId");
