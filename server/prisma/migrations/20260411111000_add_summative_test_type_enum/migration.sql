-- Create SummativeTestType enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SummativeTestType') THEN
    CREATE TYPE "SummativeTestType" AS ENUM ('OPENER', 'MID_TERM', 'END_TERM', 'CAT', 'ASSESSMENT', 'OTHER');
  END IF;
END $$;

-- Add testType column to summative_tests if it doesn't exist
ALTER TABLE "summative_tests"
ADD COLUMN IF NOT EXISTS "testType" "SummativeTestType";

-- Create index on testType
CREATE INDEX IF NOT EXISTS "summative_tests_testType_idx" ON "summative_tests"("testType");
