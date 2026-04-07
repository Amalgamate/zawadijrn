-- Unify CBC grading systems: remove usage of type='SECONDARY'
-- Keep data by migrating SECONDARY -> CBC.

UPDATE "grading_systems"
SET "type" = 'CBC'
WHERE "type" = 'SECONDARY';

-- Rename any legacy hybrid-named CBC system
UPDATE "grading_systems"
SET "name" = 'Senior Secondary CBC 8-Level Scale'
WHERE "name" = 'Senior High CBC-KCSE Hybrid';

