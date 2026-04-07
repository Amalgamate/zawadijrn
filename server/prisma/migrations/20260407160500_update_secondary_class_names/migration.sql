-- Ensure SECONDARY class names display "Grade 10–12" (not "FORM 1–3")

UPDATE "classes"
SET "name" = regexp_replace("name", '^FORM\\s*1\\s+', 'Grade 10 ', 1, 1, 'i')
WHERE "institutionType" = 'SECONDARY' AND "name" ~* '^FORM\\s*1\\s+';

UPDATE "classes"
SET "name" = regexp_replace("name", '^FORM\\s*2\\s+', 'Grade 11 ', 1, 1, 'i')
WHERE "institutionType" = 'SECONDARY' AND "name" ~* '^FORM\\s*2\\s+';

UPDATE "classes"
SET "name" = regexp_replace("name", '^FORM\\s*3\\s+', 'Grade 12 ', 1, 1, 'i')
WHERE "institutionType" = 'SECONDARY' AND "name" ~* '^FORM\\s*3\\s+';

