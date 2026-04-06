-- Enforce CBC 8-level grading (EE1..BE2) for summative data.
-- 1) Normalize legacy A-E values in existing summative_results.
-- 2) Align default SUMMATIVE grading ranges to the 8-level CBC rubric.

-- 1) Normalize stored result grades
UPDATE "summative_results"
SET "grade" = COALESCE(
  CASE
    WHEN "cbcGrade"::text IN ('EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2') THEN "cbcGrade"::text
    WHEN "grade"::text = 'A' THEN 'EE1'
    WHEN "grade"::text = 'B' THEN 'EE2'
    WHEN "grade"::text = 'C' THEN 'ME2'
    WHEN "grade"::text = 'D' THEN 'AE2'
    WHEN "grade"::text = 'E' THEN 'BE2'
    WHEN "grade"::text IN ('EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2') THEN "grade"::text
    ELSE NULL
  END,
  'BE2'
);

-- Keep cbcGrade in sync and valid as text
UPDATE "summative_results"
SET "cbcGrade" = CASE
  WHEN "cbcGrade"::text IN ('EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2') THEN "cbcGrade"::text
  WHEN "grade"::text IN ('EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2') THEN "grade"::text
  ELSE 'BE2'
END;

-- 2) Replace default SUMMATIVE grading ranges with CBC 8-level rows
WITH default_summative AS (
  SELECT id
  FROM "grading_systems"
  WHERE type = 'SUMMATIVE' AND "isDefault" = true
  ORDER BY "createdAt" ASC
  LIMIT 1
)
DELETE FROM "grading_ranges"
WHERE "systemId" IN (SELECT id FROM default_summative);

INSERT INTO "grading_ranges" (
  id, "systemId", label, "minPercentage", "maxPercentage",
  "summativeGrade", "rubricRating", points, color, description, "createdAt", "updatedAt", archived
)
SELECT
  gen_random_uuid()::text,
  ds.id,
  s.label,
  s.min_pct,
  s.max_pct,
  s.label,
  s.label::"DetailedRubricRating",
  s.points,
  s.color,
  s.description,
  NOW(),
  NOW(),
  false
FROM (
  VALUES
    ('EE1', 90, 100, 8, '#10b981', 'Outstanding'),
    ('EE2', 75, 89, 7, '#34d399', 'Very High'),
    ('ME1', 58, 74, 6, '#3b82f6', 'High Average'),
    ('ME2', 41, 57, 5, '#60a5fa', 'Average'),
    ('AE1', 31, 40, 4, '#f59e0b', 'Low Average'),
    ('AE2', 21, 30, 3, '#fbbf24', 'Below Average'),
    ('BE1', 11, 20, 2, '#ef4444', 'Low'),
    ('BE2', 0, 10, 1, '#b91c1c', 'Very Low')
) AS s(label, min_pct, max_pct, points, color, description)
JOIN (
  SELECT id
  FROM "grading_systems"
  WHERE type = 'SUMMATIVE' AND "isDefault" = true
  ORDER BY "createdAt" ASC
  LIMIT 1
) ds ON true
;
