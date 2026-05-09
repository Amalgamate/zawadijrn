-- Add dedicated PWA logo storage on schools
ALTER TABLE "schools"
ADD COLUMN IF NOT EXISTS "pwaLogoUrl" TEXT;
