-- Add missing columns to events and grading_ranges tables

-- 1) Create EventType enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventType') THEN
    CREATE TYPE "EventType" AS ENUM ('GENERAL', 'ACADEMIC', 'SPORTS', 'MEETING', 'HOLIDAY', 'EXAM');
  END IF;
END $$;

-- 2) Add missing columns to events table
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "googleEventId" TEXT,
ADD COLUMN IF NOT EXISTS "meetingLink" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "type" "EventType" NOT NULL DEFAULT 'GENERAL';

-- 3) Add missing columns to grading_ranges table
ALTER TABLE "grading_ranges"
ADD COLUMN IF NOT EXISTS "parentBand" TEXT,
ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;
