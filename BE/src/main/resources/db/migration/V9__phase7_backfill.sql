-- Backfill legacy score_criteria rows (pre-V7) for Hibernate validate
UPDATE score_criteria
SET code = 'LEGACY_' || id::text
WHERE code IS NULL OR TRIM(code) = '';

UPDATE score_criteria
SET level_descriptors = '[
  {"level":"EXCELLENT","label":"Xuất sắc","minScore":9,"maxScore":10,"description":""},
  {"level":"GOOD","label":"Tốt","minScore":7,"maxScore":8.9,"description":""},
  {"level":"SATISFACTORY","label":"Đạt","minScore":5,"maxScore":6.9,"description":""},
  {"level":"UNSATISFACTORY","label":"Chưa đạt","minScore":0,"maxScore":4.9,"description":""}
]'::jsonb
WHERE level_descriptors IS NULL
   OR level_descriptors = '[]'::jsonb
   OR jsonb_array_length(level_descriptors) < 4;

-- Existing repository links treated as already submitted
UPDATE team_repositories
SET status = 'SUBMITTED',
    submitted_at = COALESCE(submitted_at, updated_at, created_at)
WHERE repository_url IS NOT NULL
  AND TRIM(repository_url) <> ''
  AND (status IS NULL OR status = 'DRAFT')
  AND submitted_at IS NULL;
