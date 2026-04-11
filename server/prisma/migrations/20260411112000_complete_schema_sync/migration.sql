-- Complete Schema Synchronization
-- Adds all missing columns and fixes type mismatches

-- 1. Fix SummativeTestType enum: ensure it exists and testType column is correct type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SummativeTestType') THEN
    CREATE TYPE "SummativeTestType" AS ENUM ('OPENER', 'MID_TERM', 'END_TERM', 'CAT', 'ASSESSMENT', 'OTHER');
  END IF;
END $$;

-- Convert testType to ENUM if it's currently TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'summative_tests' AND column_name = 'testType' 
    AND data_type = 'character varying'
  ) THEN
    -- Column exists as text, convert to enum
    ALTER TABLE "summative_tests" 
    ALTER COLUMN "testType" TYPE "SummativeTestType" USING "testType"::"SummativeTestType";
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'summative_tests' AND column_name = 'testType'
  ) THEN
    -- Column doesn't exist, create it
    ALTER TABLE "summative_tests"
    ADD COLUMN "testType" "SummativeTestType";
  END IF;
END $$;

-- Create or recreate index on testType
DROP INDEX IF EXISTS "summative_tests_testType_idx";
CREATE INDEX "summative_tests_testType_idx" ON "summative_tests"("testType");

-- 2. Add missing level_id column to summative_results
ALTER TABLE "summative_results"
ADD COLUMN IF NOT EXISTS "level_id" TEXT;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'summative_results_level_id_fkey'
  ) THEN
    ALTER TABLE "summative_results"
    ADD CONSTRAINT "summative_results_level_id_fkey"
    FOREIGN KEY ("level_id") REFERENCES "grading_ranges"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on level_id
CREATE INDEX IF NOT EXISTS "summative_results_level_id_idx" ON "summative_results"("level_id");

-- 3. Ensure all Event and EventType setup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventType') THEN
    CREATE TYPE "EventType" AS ENUM ('GENERAL', 'ACADEMIC', 'SPORTS', 'MEETING', 'HOLIDAY', 'EXAM');
  END IF;
END $$;

ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "googleEventId" TEXT,
ADD COLUMN IF NOT EXISTS "meetingLink" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "type" "EventType" NOT NULL DEFAULT 'GENERAL';

-- 4. Ensure all GradingRange columns
ALTER TABLE "grading_ranges"
ADD COLUMN IF NOT EXISTS "parentBand" TEXT,
ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- 5. Create any missing indexes
CREATE INDEX IF NOT EXISTS "grading_ranges_parentBand_idx" ON "grading_ranges"("parentBand");
