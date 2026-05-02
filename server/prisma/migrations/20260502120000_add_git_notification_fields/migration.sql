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

-- 3. Add GIT_UPDATE to the NotificationType enum.
--    pg_enum check prevents duplicate-value errors on re-run.
--    Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction in PG < 12;
--    Prisma runs migrations in a transaction, so we use a DO block to safely
--    check before adding.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'NotificationType'
      AND e.enumlabel = 'GIT_UPDATE'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'GIT_UPDATE';
  END IF;
END$$;

-- 4. Composite index: fastest path for unread-count queries
CREATE INDEX IF NOT EXISTS "user_notifications_userId_isRead_idx"
  ON "user_notifications"("userId", "isRead");
