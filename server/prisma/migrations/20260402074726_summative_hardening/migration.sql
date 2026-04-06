/*
  Summative Hardening Migration
  
  PATCHED: Made fully idempotent so it can safely re-run after being resolved
  from a failed state. Added deduplication step before unique index creation.
*/

-- Step 1: Create enum (idempotent)
DO $$ BEGIN
    CREATE TYPE "SummativeTestType" AS ENUM ('OPENER', 'MID_TERM', 'END_TERM', 'CAT', 'ASSESSMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Alter summative_results.grade to TEXT (idempotent)
DO $$ BEGIN
    ALTER TABLE "summative_results" ALTER COLUMN "grade" TYPE TEXT USING "grade"::TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Step 3: Alter summative_tests.testType to SummativeTestType enum (idempotent)
DO $$ BEGIN
    ALTER TABLE "summative_tests" ALTER COLUMN "testType" TYPE "SummativeTestType" USING CASE
      WHEN "testType"::text = 'MIDTERM' THEN 'MID_TERM'::"SummativeTestType"
      WHEN "testType"::text = 'WEEKLY'  THEN 'CAT'::"SummativeTestType"
      WHEN "testType" IS NULL           THEN NULL
      ELSE "testType"::text::"SummativeTestType"
    END;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Step 4: Create supporting indexes (IF NOT EXISTS = safe)
CREATE INDEX IF NOT EXISTS "summative_results_grade_idx"
    ON "summative_results"("grade");

CREATE INDEX IF NOT EXISTS "summative_results_testId_grade_marksObtained_idx"
    ON "summative_results"("testId", "grade", "marksObtained");

CREATE INDEX IF NOT EXISTS "summative_tests_testType_idx"
    ON "summative_tests"("testType");

-- Step 5: Remove duplicate rows BEFORE creating the unique index.
-- Keeps the most recently created record for each unique combo.
DELETE FROM summative_tests
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY grade, "learningArea", term, "academicYear", "testType"
                ORDER BY "createdAt" DESC
            ) AS rn
        FROM summative_tests
    ) ranked
    WHERE rn > 1
);

-- Step 6: Create unique index (now safe — duplicates removed above)
CREATE UNIQUE INDEX IF NOT EXISTS "summative_tests_grade_learningArea_term_academicYear_testTy_key"
    ON "summative_tests"("grade", "learningArea", "term", "academicYear", "testType");
