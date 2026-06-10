UPDATE events
SET academic_term_id = (
    SELECT id FROM academic_terms WHERE code = 'SPRING_2026' ORDER BY id LIMIT 1
)
WHERE academic_term_id IS NULL;

ALTER TABLE events
    ALTER COLUMN academic_term_id SET NOT NULL;
