-- Migration: add readAt to user_notifications
-- Reason: readAt records the exact timestamp when a notification was read.
-- This allows the frontend to reliably display "read X minutes ago" and lets
-- the backend set it atomically with isRead, eliminating the race where
-- isRead=true but readAt is NULL.

ALTER TABLE "user_notifications"
  ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

-- Backfill: any notification already marked read gets readAt = now().
-- This is a safe one-time backfill and does not affect correctness going forward.
UPDATE "user_notifications"
  SET "readAt" = NOW()
  WHERE "isRead" = true AND "readAt" IS NULL;

-- Composite index: (userId, isRead) — the most common query pattern.
CREATE INDEX IF NOT EXISTS "user_notifications_userId_isRead_idx"
  ON "user_notifications"("userId", "isRead");
