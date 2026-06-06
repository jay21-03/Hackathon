-- Bo sung / chuan hoa du lieu Phase 7 cho test local (idempotent).
-- Chay sau V5 + V10 (neu co). Khong xoa du lieu cu.

-- De thi (neu chua co)
INSERT INTO problems (board_id, title, description, release_at, close_at, created_by, created_at, updated_at)
SELECT
    31,
    'Xay dung AI Agent cho doanh nghiep',
    'Thiet ke AI agent ho tro quy trinh noi bo. Nop GitHub/GitLab truoc deadline.',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '14 days',
    102,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM problems WHERE board_id = 31);

INSERT INTO problems (board_id, title, description, release_at, close_at, created_by, created_at, updated_at)
SELECT
    32,
    'He thong phan tan thoi gian thuc',
    'Bai toan backend event-driven cho bang Beta.',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '14 days',
    102,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM problems WHERE board_id = 32);

-- Mo de cho submission test (doi 41 con nhap duoc)
UPDATE problems
SET release_at = LEAST(release_at, NOW() - INTERVAL '1 hour'),
    close_at = GREATEST(close_at, NOW() + INTERVAL '7 days'),
    updated_at = NOW()
WHERE board_id IN (31, 32);

UPDATE teams
SET status = 'CONFIRMED', confirmed_at = COALESCE(confirmed_at, NOW()), updated_at = NOW()
WHERE id = 42 AND status <> 'CONFIRMED';

INSERT INTO judge_assignments (board_id, judge_id, created_by, created_at)
SELECT 32, 104, 102, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM judge_assignments ja WHERE ja.board_id = 32 AND ja.judge_id = 104
);

-- Rubric du 5 tieu chi (bo sung neu thieu)
INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    21, 'R1_01', 'Y tuong & sang tao', 'Muc do doc dao.', 30.000, 0, 10, 1,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 21 AND code = 'R1_01');

INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    21, 'R1_02', 'Ky thuat & trien khai', 'Chat luong code.', 25.000, 0, 10, 2,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 21 AND code = 'R1_02');

INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    21, 'R1_03', 'Trinh bay & tai lieu', 'README, slide.', 20.000, 0, 10, 3,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 21 AND code = 'R1_03');

INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    21, 'R1_04', 'Hoan thien san pham', 'UI/UX, demo.', 15.000, 0, 10, 4,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 21 AND code = 'R1_04');

INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    21, 'R1_05', 'Doi moi & mo rong', 'Kha nang mo rong.', 10.000, 0, 10, 5,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 21 AND code = 'R1_05');

-- Bai nop: reset ve DRAFT de thi sinh test nut Nop
UPDATE team_repositories
SET status = 'DRAFT',
    submitted_at = NULL,
    repository_url = COALESCE(NULLIF(TRIM(repository_url), ''), 'https://github.com/seal-hackathon/quantum-nexus'),
    updated_at = NOW()
WHERE team_id = 41;

INSERT INTO team_repositories (
    team_id, repository_url, repository_name, review_interval_minutes,
    status, submitted_at, created_by, created_at, updated_at
)
SELECT
    41,
    'https://github.com/seal-hackathon/quantum-nexus',
    'quantum-nexus',
    30,
    'DRAFT',
    NULL,
    101,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM team_repositories WHERE team_id = 41);

-- Phieu cham demo: doi 41 nhap (DRAFT), doi 42 da nop (SUBMITTED)
INSERT INTO score_sheets (
    judge_assignment_id, board_id, team_id, judge_id, status, general_feedback, submitted_at, created_at, updated_at
)
SELECT
    ja.id, 31, 41, 104, 'DRAFT', 'Can bo sung demo.', NULL, NOW(), NOW()
FROM judge_assignments ja
WHERE ja.board_id = 31 AND ja.judge_id = 104
  AND NOT EXISTS (
      SELECT 1 FROM score_sheets ss WHERE ss.board_id = 31 AND ss.team_id = 41 AND ss.judge_id = 104
  );

INSERT INTO score_sheets (
    judge_assignment_id, board_id, team_id, judge_id, status, general_feedback, submitted_at, created_at, updated_at
)
SELECT
    ja.id, 31, 42, 104, 'SUBMITTED', 'Bai nop on dinh.', NOW() - INTERVAL '1 hour', NOW(), NOW()
FROM judge_assignments ja
WHERE ja.board_id = 31 AND ja.judge_id = 104
  AND NOT EXISTS (
      SELECT 1 FROM score_sheets ss WHERE ss.board_id = 31 AND ss.team_id = 42 AND ss.judge_id = 104
  );

UPDATE score_sheets
SET status = 'DRAFT', submitted_at = NULL, updated_at = NOW()
WHERE board_id = 31 AND team_id = 41 AND judge_id = 104;

UPDATE score_sheets
SET status = 'SUBMITTED', submitted_at = COALESCE(submitted_at, NOW()), updated_at = NOW()
WHERE board_id = 31 AND team_id = 42 AND judge_id = 104;

-- Diem mau cho doi 41 (thieu tieu chi — test INCOMPLETE)
INSERT INTO score_items (score_sheet_id, criteria_id, score_value)
SELECT ss.id, sc.id, 7.5
FROM score_sheets ss
JOIN score_criteria sc ON sc.round_id = 21 AND sc.code = 'R1_01'
WHERE ss.board_id = 31 AND ss.team_id = 41 AND ss.judge_id = 104 AND ss.status = 'DRAFT'
  AND NOT EXISTS (
      SELECT 1 FROM score_items si WHERE si.score_sheet_id = ss.id AND si.criteria_id = sc.id
  );

INSERT INTO score_items (score_sheet_id, criteria_id, score_value)
SELECT ss.id, sc.id, 8.0
FROM score_sheets ss
JOIN score_criteria sc ON sc.round_id = 21 AND sc.code = 'R1_02'
WHERE ss.board_id = 31 AND ss.team_id = 41 AND ss.judge_id = 104 AND ss.status = 'DRAFT'
  AND NOT EXISTS (
      SELECT 1 FROM score_items si WHERE si.score_sheet_id = ss.id AND si.criteria_id = sc.id
  );

-- Diem day du cho doi 42 da nop
INSERT INTO score_items (score_sheet_id, criteria_id, score_value)
SELECT ss.id, sc.id,
    CASE sc.code
        WHEN 'R1_01' THEN 8.0
        WHEN 'R1_02' THEN 7.5
        WHEN 'R1_03' THEN 8.5
        WHEN 'R1_04' THEN 7.0
        WHEN 'R1_05' THEN 9.0
        ELSE 7.0
    END
FROM score_sheets ss
CROSS JOIN score_criteria sc
WHERE ss.board_id = 31 AND ss.team_id = 42 AND ss.judge_id = 104 AND ss.status = 'SUBMITTED'
  AND sc.round_id = 21
  AND NOT EXISTS (
      SELECT 1 FROM score_items si WHERE si.score_sheet_id = ss.id AND si.criteria_id = sc.id
  );
