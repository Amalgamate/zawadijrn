/*
  Warnings:

  - The `summativeGrade` column on the `grading_ranges` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `grade` on the `classes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `learners` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `schemes_of_work` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `grade` on the `summative_tests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- Step 1: Safe Alter Columns (idempotent)
DO $$ BEGIN
    ALTER TABLE "classes" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "grading_ranges" ALTER COLUMN "summativeGrade" TYPE TEXT USING "summativeGrade"::TEXT;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "learners" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "schemes_of_work" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "summative_tests" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;
EXCEPTION WHEN others THEN null; END $$;

-- Step 2: Supporting Indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "classes_grade_stream_idx" ON "classes"("grade", "stream");
CREATE INDEX IF NOT EXISTS "learners_grade_stream_idx" ON "learners"("grade", "stream");
CREATE INDEX IF NOT EXISTS "learners_grade_status_archived_idx" ON "learners"("grade", "status", "archived");
CREATE INDEX IF NOT EXISTS "schemes_of_work_grade_term_academicYear_idx" ON "schemes_of_work"("grade", "term", "academicYear");
CREATE INDEX IF NOT EXISTS "summative_tests_grade_learningArea_term_idx" ON "summative_tests"("grade", "learningArea", "term");
CREATE INDEX IF NOT EXISTS "summative_tests_grade_term_academicYear_idx" ON "summative_tests"("grade", "term", "academicYear");

-- Step 3: Deduplicate before creating unique indexes

-- Deduplicate classes
DELETE FROM "classes"
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "grade", "stream", "academicYear", "term" ORDER BY "createdAt" DESC) as rn
        FROM "classes"
    ) t WHERE rn > 1
);

-- Deduplicate schemes_of_work
DELETE FROM "schemes_of_work"
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "teacherId", "grade", "learningArea", "term", "academicYear" ORDER BY "createdAt" DESC) as rn
        FROM "schemes_of_work"
    ) t WHERE rn > 1
);

-- Deduplicate summative_tests
DELETE FROM "summative_tests"
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "grade", "learningArea", "term", "academicYear", "testType" ORDER BY "createdAt" DESC) as rn
        FROM "summative_tests"
    ) t WHERE rn > 1
);

-- Step 4: Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "classes_grade_stream_academicYear_term_key" ON "classes"("grade", "stream", "academicYear", "term");
CREATE UNIQUE INDEX IF NOT EXISTS "schemes_of_work_teacherId_grade_learningArea_term_academicY_key" ON "schemes_of_work"("teacherId", "grade", "learningArea", "term", "academicYear");
CREATE UNIQUE INDEX IF NOT EXISTS "summative_tests_grade_learningArea_term_academicYear_testTy_key" ON "summative_tests"("grade", "learningArea", "term", "academicYear", "testType");
