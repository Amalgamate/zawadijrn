-- Add metadata fields for learning areas (used for CBC Senior Secondary pathways)

ALTER TABLE "learning_areas"
ADD COLUMN IF NOT EXISTS "isCore" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "learning_areas"
ADD COLUMN IF NOT EXISTS "pathway" TEXT;

ALTER TABLE "learning_areas"
ADD COLUMN IF NOT EXISTS "category" TEXT;

