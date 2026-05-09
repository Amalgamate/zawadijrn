-- Migration: add git-update fields to user_notifications
-- Adds: showAsPopup (popup modal flag), metadata (JSON for branch/commit/pushedBy),
--       and the GIT_UPDATE value to the NotificationType enum.
-- Safe to re-run: all statements use IF NOT EXISTS guards.

-- 1. Add showAsPopup column (defaults false — existing rows unaffected)
ALTER TABLE "user_notifications"
  ADD COLUMN IF NOT EXISTS "showAsPopup" BOOLEAN NOT NULL DEFAULT false;

-- 2. Add metadata column (nullable JSONB — existing rows unaffected)
ALTER TABLE "user_notifications"
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- 3. Create NotificationType enum if it doesn't exist, then add GIT_UPDATE value
DO $$
BEGIN
  -- First, check if the enum type exists at all
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'NotificationType'
  ) THEN
    -- Create the enum with all expected values
    CREATE TYPE "NotificationType" AS ENUM (
      'INFO', 'WARNING', 'ERROR', 'SUCCESS', 'GIT_UPDATE'
    );
  ELSE
    -- If enum exists but doesn't have GIT_UPDATE, add it
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'NotificationType'
        AND e.enumlabel = 'GIT_UPDATE'
    ) THEN
      ALTER TYPE "NotificationType" ADD VALUE 'GIT_UPDATE';
    END IF;
  END IF;
END$$;

-- 4. Composite index: fastest path for unread-count queries
CREATE INDEX IF NOT EXISTS "user_notifications_userId_isRead_idx"
  ON "user_notifications"("userId", "isRead");
