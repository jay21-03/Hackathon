-- Student classification + account approval
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_type VARCHAR(20);

UPDATE users
SET student_type = 'EXTERNAL'
WHERE student_type IS NULL;

-- Criteria templates (reusable across events)
CREATE TABLE IF NOT EXISTS criteria_templates (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS criteria_template_items (
    id                  BIGSERIAL PRIMARY KEY,
    template_id         BIGINT NOT NULL REFERENCES criteria_templates(id) ON DELETE CASCADE,
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    weight              NUMERIC(6, 2) NOT NULL,
    min_score           NUMERIC(6, 2) NOT NULL DEFAULT 0,
    max_score           NUMERIC(6, 2) NOT NULL DEFAULT 10,
    sort_order          INT NOT NULL DEFAULT 1,
    level_descriptors   JSONB NOT NULL DEFAULT '[]'::jsonb,
    CONSTRAINT uq_criteria_template_items_template_code UNIQUE (template_id, code)
);

CREATE INDEX IF NOT EXISTS idx_criteria_template_items_template
    ON criteria_template_items(template_id, sort_order);

INSERT INTO criteria_templates (name, description, is_system_default, created_at, updated_at)
SELECT
    'Hackathon SEAL — 5 tiêu chí',
    'Mẫu rubric mặc định: chức năng, AI, kiến trúc, demo, teamwork.',
    TRUE,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM criteria_templates WHERE is_system_default = TRUE
);

INSERT INTO criteria_template_items (template_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors)
SELECT t.id, v.code, v.name, '', v.weight, 0, 10, v.sort_order, v.level_descriptors::jsonb
FROM criteria_templates t
CROSS JOIN (VALUES
    ('R1_01', 'Tính đúng đắn & Hoàn thiện chức năng', 30, 1,
     '[{"level":1,"label":"Yếu","minScore":0,"maxScore":2},{"level":2,"label":"Trung bình","minScore":3,"maxScore":5},{"level":3,"label":"Khá","minScore":6,"maxScore":8},{"level":4,"label":"Xuất sắc","minScore":9,"maxScore":10}]'),
    ('R1_02', 'Ứng dụng AI trong giải pháp', 25, 2,
     '[{"level":1,"label":"Yếu","minScore":0,"maxScore":2},{"level":2,"label":"Trung bình","minScore":3,"maxScore":5},{"level":3,"label":"Khá","minScore":6,"maxScore":8},{"level":4,"label":"Xuất sắc","minScore":9,"maxScore":10}]'),
    ('R1_03', 'Thiết kế & Kiến trúc phần mềm', 15, 3,
     '[{"level":1,"label":"Yếu","minScore":0,"maxScore":2},{"level":2,"label":"Trung bình","minScore":3,"maxScore":5},{"level":3,"label":"Khá","minScore":6,"maxScore":8},{"level":4,"label":"Xuất sắc","minScore":9,"maxScore":10}]'),
    ('R1_04', 'Thuyết trình & Demo', 20, 4,
     '[{"level":1,"label":"Yếu","minScore":0,"maxScore":2},{"level":2,"label":"Trung bình","minScore":3,"maxScore":5},{"level":3,"label":"Khá","minScore":6,"maxScore":8},{"level":4,"label":"Xuất sắc","minScore":9,"maxScore":10}]'),
    ('R1_05', 'Teamwork & Tinh thần làm việc', 10, 5,
     '[{"level":1,"label":"Yếu","minScore":0,"maxScore":2},{"level":2,"label":"Trung bình","minScore":3,"maxScore":5},{"level":3,"label":"Khá","minScore":6,"maxScore":8},{"level":4,"label":"Xuất sắc","minScore":9,"maxScore":10}]')
) AS v(code, name, weight, sort_order, level_descriptors)
WHERE t.is_system_default = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM criteria_template_items i WHERE i.template_id = t.id
  );
