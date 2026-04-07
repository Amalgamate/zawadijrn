-- Rename Senior School grade codes from FORM_1–FORM_3 to GRADE10–GRADE12
-- This is a data migration only (no schema changes).

-- Classes
UPDATE "classes"
SET "grade" = 'GRADE10'
WHERE "institutionType" = 'SECONDARY' AND "grade" = 'FORM_1';

UPDATE "classes"
SET "grade" = 'GRADE11'
WHERE "institutionType" = 'SECONDARY' AND "grade" = 'FORM_2';

UPDATE "classes"
SET "grade" = 'GRADE12'
WHERE "institutionType" = 'SECONDARY' AND "grade" = 'FORM_3';

-- Learners
UPDATE "learners"
SET "grade" = 'GRADE10'
WHERE "institutionType" = 'SECONDARY' AND "grade" = 'FORM_1';

UPDATE "learners"
SET "grade" = 'GRADE11'
WHERE "institutionType" = 'SECONDARY' AND "grade" = 'FORM_2';

UPDATE "learners"
SET "grade" = 'GRADE12'
WHERE "institutionType" = 'SECONDARY' AND "grade" = 'FORM_3';

-- Learning areas
UPDATE "learning_areas"
SET "gradeLevel" = 'GRADE10'
WHERE "institutionType" = 'SECONDARY' AND "gradeLevel" = 'FORM_1';

UPDATE "learning_areas"
SET "gradeLevel" = 'GRADE11'
WHERE "institutionType" = 'SECONDARY' AND "gradeLevel" = 'FORM_2';

UPDATE "learning_areas"
SET "gradeLevel" = 'GRADE12'
WHERE "institutionType" = 'SECONDARY' AND "gradeLevel" = 'FORM_3';

-- Summative tests (if present and still using strings)
UPDATE "summative_tests"
SET "grade" = 'GRADE10'
WHERE "grade" = 'FORM_1';

UPDATE "summative_tests"
SET "grade" = 'GRADE11'
WHERE "grade" = 'FORM_2';

UPDATE "summative_tests"
SET "grade" = 'GRADE12'
WHERE "grade" = 'FORM_3';

-- Subject assignments (if present and still using strings)
UPDATE "subject_assignments"
SET "grade" = 'GRADE10'
WHERE "grade" = 'FORM_1';

UPDATE "subject_assignments"
SET "grade" = 'GRADE11'
WHERE "grade" = 'FORM_2';

UPDATE "subject_assignments"
SET "grade" = 'GRADE12'
WHERE "grade" = 'FORM_3';

