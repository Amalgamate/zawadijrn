-- Link assessments/tests to canonical LearningArea records

-- 1) Add columns
ALTER TABLE "formative_assessments"
ADD COLUMN IF NOT EXISTS "learningAreaId" TEXT;

ALTER TABLE "summative_tests"
ADD COLUMN IF NOT EXISTS "learningAreaId" TEXT;

-- 2) Add foreign keys (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'formative_assessments_learningAreaId_fkey') THEN
    ALTER TABLE "formative_assessments"
      ADD CONSTRAINT "formative_assessments_learningAreaId_fkey"
      FOREIGN KEY ("learningAreaId") REFERENCES "learning_areas"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'summative_tests_learningAreaId_fkey') THEN
    ALTER TABLE "summative_tests"
      ADD CONSTRAINT "summative_tests_learningAreaId_fkey"
      FOREIGN KEY ("learningAreaId") REFERENCES "learning_areas"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS "formative_assessments_learningAreaId_idx" ON "formative_assessments"("learningAreaId");
CREATE INDEX IF NOT EXISTS "summative_tests_learningAreaId_idx" ON "summative_tests"("learningAreaId");

-- 4) Backfill SummativeTest.learningAreaId (prefer exact match on grade+name; then name-only)
UPDATE "summative_tests" st
SET "learningAreaId" = la.id
FROM "learning_areas" la
WHERE st."learningAreaId" IS NULL
  AND la."institutionType" = 'SECONDARY'
  AND la."gradeLevel" = st.grade
  AND lower(trim(la.name)) = lower(trim(st."learningArea"));

UPDATE "summative_tests" st
SET "learningAreaId" = la.id
FROM "learning_areas" la
WHERE st."learningAreaId" IS NULL
  AND lower(trim(la.name)) = lower(trim(st."learningArea"))
  AND la."institutionType" = 'SECONDARY'
  AND la."gradeLevel" IN ('GRADE10','GRADE11','GRADE12');

UPDATE "summative_tests" st
SET "learningAreaId" = la.id
FROM "learning_areas" la
WHERE st."learningAreaId" IS NULL
  AND lower(trim(la.name)) = lower(trim(st."learningArea"))
  AND la."institutionType" = 'PRIMARY_CBC';

-- 5) Backfill FormativeAssessment.learningAreaId (join learner for grade+institutionType)
UPDATE "formative_assessments" fa
SET "learningAreaId" = la.id
FROM "learners" l, "learning_areas" la
WHERE fa."learningAreaId" IS NULL
  AND fa."learnerId" = l.id
  AND la."institutionType" = l."institutionType"
  AND lower(trim(la.name)) = lower(trim(fa."learningArea"))
  AND (
    la."gradeLevel" = l.grade
    OR (l."institutionType" = 'PRIMARY_CBC' AND la."gradeLevel" IN ('Pre-Primary','Lower Primary','Upper Primary','Junior School'))
    OR (l."institutionType" = 'SECONDARY' AND la."gradeLevel" IN ('GRADE10','GRADE11','GRADE12'))
  );

