-- Ensure events.allDay exists for Prisma runtime queries.
-- Some live databases were created with "isAllDay" instead.

DO $$
BEGIN
    -- If legacy column exists and new column does not, rename it.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'isAllDay'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'allDay'
    ) THEN
        ALTER TABLE "events" RENAME COLUMN "isAllDay" TO "allDay";
    END IF;

    -- If neither exists, add the expected column.
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'allDay'
    ) THEN
        ALTER TABLE "events" ADD COLUMN "allDay" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;
