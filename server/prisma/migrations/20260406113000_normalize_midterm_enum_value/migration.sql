-- Normalize legacy SummativeTestType values that break Prisma enum decoding.
-- Legacy data used MIDTERM; current enum value is MID_TERM.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'summative_tests' AND column_name = 'testType'
    ) THEN
        UPDATE "summative_tests"
        SET "testType" = 'MID_TERM'
        WHERE "testType"::text IN ('MIDTERM', 'MID TERM');
    END IF;
END $$;
