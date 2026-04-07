-- CBC Senior Secondary pathways module
-- Adds Pathway + SubjectCategory models and links to LearningArea and Learner.

-- 1) Core tables
CREATE TABLE IF NOT EXISTS "pathways" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pathways_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pathways_code_key" ON "pathways"("code");

CREATE TABLE IF NOT EXISTS "subject_categories" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "pathwayId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "minSelect" INTEGER NOT NULL DEFAULT 0,
  "maxSelect" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subject_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subject_categories_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "pathways"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "subject_categories_pathwayId_code_key" ON "subject_categories"("pathwayId", "code");
CREATE INDEX IF NOT EXISTS "subject_categories_pathwayId_idx" ON "subject_categories"("pathwayId");

-- 2) Link LearningArea -> pathway/category (optional)
ALTER TABLE "learning_areas"
ADD COLUMN IF NOT EXISTS "pathwayId" TEXT;

ALTER TABLE "learning_areas"
ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'learning_areas_pathwayId_fkey'
  ) THEN
    ALTER TABLE "learning_areas"
      ADD CONSTRAINT "learning_areas_pathwayId_fkey"
      FOREIGN KEY ("pathwayId") REFERENCES "pathways"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'learning_areas_categoryId_fkey'
  ) THEN
    ALTER TABLE "learning_areas"
      ADD CONSTRAINT "learning_areas_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "subject_categories"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "learning_areas_pathwayId_idx" ON "learning_areas"("pathwayId");
CREATE INDEX IF NOT EXISTS "learning_areas_categoryId_idx" ON "learning_areas"("categoryId");

-- 3) Learner -> pathway selection (optional; required by business rules for SS but enforced in API)
ALTER TABLE "learners"
ADD COLUMN IF NOT EXISTS "pathwayId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'learners_pathwayId_fkey'
  ) THEN
    ALTER TABLE "learners"
      ADD CONSTRAINT "learners_pathwayId_fkey"
      FOREIGN KEY ("pathwayId") REFERENCES "pathways"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "learners_institutionType_pathwayId_idx" ON "learners"("institutionType", "pathwayId");

-- 4) Learner subject selection
CREATE TABLE IF NOT EXISTS "learner_subject_selections" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "learnerId" TEXT NOT NULL,
  "learningAreaId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learner_subject_selections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learner_subject_selections_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "learner_subject_selections_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES "learning_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "learner_subject_selections_learnerId_learningAreaId_key" ON "learner_subject_selections"("learnerId","learningAreaId");
CREATE INDEX IF NOT EXISTS "learner_subject_selections_learnerId_idx" ON "learner_subject_selections"("learnerId");
CREATE INDEX IF NOT EXISTS "learner_subject_selections_learningAreaId_idx" ON "learner_subject_selections"("learningAreaId");

