-- Bo sung du lieu Seal HKT 2026 (event 13) — idempotent, khong ghi de team/slot da co.
-- Ho tro ca DB moi lan DB da co event 13 (team 44, boards 33/34).

-- === Users bo sung (khong doi email user 105-107 da ton tai) ===
INSERT INTO users (id, email, full_name, status, created_at, updated_at)
SELECT 108, 'hkt.team2@fpt.edu.vn', 'Le Van HKT Team2', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 108)
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'hkt.team2@fpt.edu.vn');

INSERT INTO users (id, email, full_name, status, created_at, updated_at)
SELECT 109, 'hkt.pending@fpt.edu.vn', 'Pending HKT Lead', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 109)
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'hkt.pending@fpt.edu.vn');

INSERT INTO user_roles (user_id, role, created_at)
SELECT 106, 'ORGANIZER', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = 106 AND ur.role = 'ORGANIZER'
);

-- Judge demo 104 (giu judge 106 neu BTC da tu gan)
INSERT INTO user_roles (user_id, role, created_at)
SELECT 104, 'JUDGE', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = 104 AND ur.role = 'JUDGE'
);

-- === Event 13 — tao neu chua co, cap nhat nhe neu da co ===
INSERT INTO events (
    id, name, description,
    start_date, end_date,
    registration_start_at, registration_end_at,
    max_teams, min_team_size, max_team_size,
    status, created_by, created_at, updated_at
)
SELECT
    13,
    'Seal HKT 2026',
    'Hackathon HKT — dang ky, phan bang, de thi, nop bai, cham diem.',
    DATE '2026-06-10',
    DATE '2026-06-30',
    TIMESTAMPTZ '2026-05-01 08:00:00+07',
    TIMESTAMPTZ '2026-06-25 23:59:00+07',
    30,
    1,
    5,
    'REGISTRATION_OPEN',
    106,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 13);

UPDATE events
SET registration_end_at = GREATEST(COALESCE(registration_end_at, NOW()), NOW() + INTERVAL '7 days'),
    max_teams = GREATEST(max_teams, 10),
    status = 'REGISTRATION_OPEN',
    updated_at = NOW()
WHERE id = 13;

-- === Round 22 (vong active theo NOW) ===
INSERT INTO rounds (id, event_id, name, round_type, round_order, start_at, end_at, status, created_at, updated_at)
SELECT
    22,
    13,
    'Vong Bang HKT',
    'GROUP_STAGE',
    1,
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '28 days',
    'PROBLEM_RELEASED',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM rounds WHERE id = 22);

UPDATE rounds
SET start_at = NOW() - INTERVAL '2 days',
    end_at = NOW() + INTERVAL '28 days',
    status = 'PROBLEM_RELEASED',
    updated_at = NOW()
WHERE id = 22 AND event_id = 13;

-- === Boards (neu chua co) ===
INSERT INTO boards (id, round_id, name, board_order, description, status, created_at, updated_at)
SELECT 33, 22, 'Bang HKT A', 1, 'Nhom ung dung & san pham.', 'READY', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE id = 33);

INSERT INTO boards (id, round_id, name, board_order, description, status, created_at, updated_at)
SELECT 34, 22, 'Bang HKT B', 2, 'Nhom ha tang & trien khai.', 'READY', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE id = 34);

-- === Teams bo sung (giu team 44 «HKT» neu da co) ===
INSERT INTO teams (
    id, event_id, name, sequence_no, contact_user_id, contact_email,
    status, confirmed_at, created_at, updated_at
)
SELECT 51, 13, 'HKT Pioneers', 2, 108, 'hkt.team2@fpt.edu.vn', 'CONFIRMED', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = 51);

INSERT INTO teams (
    id, event_id, name, sequence_no, contact_user_id, contact_email,
    status, confirmed_at, created_at, updated_at
)
SELECT 52, 13, 'HKT Innovators', 3, NULL, 'hkt.innovators@fpt.edu.vn', 'CONFIRMED', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = 52);

INSERT INTO teams (
    id, event_id, name, sequence_no, contact_user_id, contact_email,
    status, confirmed_at, created_at, updated_at
)
SELECT 53, 13, 'HKT Coders', 4, 109, 'hkt.pending@fpt.edu.vn', 'PENDING', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = 53);

INSERT INTO teams (
    id, event_id, name, sequence_no, contact_user_id, contact_email,
    status, confirmed_at, created_at, updated_at
)
SELECT 54, 13, 'HKT Dream Team', 5, NULL, 'hkt.waitlist@fpt.edu.vn', 'WAITLIST', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = 54);

-- Team members cho teams moi
INSERT INTO team_members (
    id, event_id, team_id, user_id, email, full_name,
    is_contact_person, status, invited_at, confirmed_at
)
SELECT 215, 13, 51, 108, 'hkt.team2@fpt.edu.vn', 'Le Van HKT Team2', TRUE, 'CONFIRMED', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE id = 215);

INSERT INTO team_members (
    id, event_id, team_id, user_id, email, full_name,
    is_contact_person, status, invited_at, confirmed_at
)
SELECT 216, 13, 52, NULL, 'hkt.innovators@fpt.edu.vn', 'Innovators Lead', TRUE, 'CONFIRMED', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE id = 216);

INSERT INTO team_members (
    id, event_id, team_id, user_id, email, full_name,
    is_contact_person, status, invited_at
)
SELECT 217, 13, 53, 109, 'hkt.pending@fpt.edu.vn', 'Pending HKT Lead', TRUE, 'INVITED', NOW()
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE id = 217);

-- === Gan doi vao slot TRONG (khong dung id co dinh) ===
UPDATE board_slots bs
SET team_id = 51,
    assigned_at = NOW(),
    assigned_by = 106
FROM teams t
WHERE bs.board_id = 33
  AND bs.team_id IS NULL
  AND bs.id = (
      SELECT MIN(s.id)
      FROM board_slots s
      WHERE s.board_id = 33 AND s.team_id IS NULL
  )
  AND t.id = 51
  AND NOT EXISTS (
      SELECT 1 FROM board_slots x
      WHERE x.round_id = bs.round_id AND x.team_id = 51
  );

UPDATE board_slots bs
SET team_id = 52,
    assigned_at = NOW(),
    assigned_by = 106
FROM teams t
WHERE bs.board_id = 33
  AND bs.team_id IS NULL
  AND bs.id = (
      SELECT MIN(s.id)
      FROM board_slots s
      WHERE s.board_id = 33 AND s.team_id IS NULL
  )
  AND t.id = 52
  AND NOT EXISTS (
      SELECT 1 FROM board_slots x
      WHERE x.round_id = bs.round_id AND x.team_id = 52
  );

UPDATE board_slots bs
SET team_id = 53,
    assigned_at = NOW(),
    assigned_by = 106
FROM teams t
WHERE bs.board_id = 34
  AND bs.team_id IS NULL
  AND bs.id = (
      SELECT MIN(s.id)
      FROM board_slots s
      WHERE s.board_id = 34 AND s.team_id IS NULL
  )
  AND t.id = 53
  AND NOT EXISTS (
      SELECT 1 FROM board_slots x
      WHERE x.round_id = bs.round_id AND x.team_id = 53
  );

-- Tao slot trong neu bang chua co slot nao
INSERT INTO board_slots (round_id, board_id, team_number, team_id, assigned_at, assigned_by, created_at)
SELECT 22, 33, COALESCE((SELECT MAX(team_number) FROM board_slots WHERE board_id = 33), 0) + 1, NULL, NULL, NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM board_slots WHERE board_id = 33);

INSERT INTO board_slots (round_id, board_id, team_number, team_id, assigned_at, assigned_by, created_at)
SELECT 22, 34, COALESCE((SELECT MAX(team_number) FROM board_slots WHERE board_id = 34), 0) + 1, NULL, NULL, NULL, NOW()
WHERE (SELECT COUNT(*) FROM board_slots WHERE board_id = 34) < 2;

-- === Mentor / Judge (104 + 103) ===
INSERT INTO mentor_assignments (board_id, mentor_id, created_by, created_at)
SELECT 33, 103, 106, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments ma WHERE ma.board_id = 33 AND ma.mentor_id = 103
);

INSERT INTO judge_assignments (board_id, judge_id, created_by, created_at)
SELECT 33, 104, 106, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM judge_assignments ja WHERE ja.board_id = 33 AND ja.judge_id = 104
);

INSERT INTO judge_assignments (board_id, judge_id, created_by, created_at)
SELECT 34, 104, 106, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM judge_assignments ja WHERE ja.board_id = 34 AND ja.judge_id = 104
);

-- === Problems — mo de neu da co ===
UPDATE problems
SET release_at = LEAST(release_at, NOW() - INTERVAL '30 minutes'),
    close_at = GREATEST(COALESCE(close_at, NOW()), NOW() + INTERVAL '14 days'),
    updated_at = NOW()
WHERE board_id IN (33, 34);

INSERT INTO problems (board_id, title, description, release_at, close_at, created_by, created_at, updated_at)
SELECT
    33,
    'San pham so cho doanh nghiep HKT',
    'Xay dung MVP giai quyet bai toan noi bo. Nop GitHub/GitLab truoc deadline.',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '14 days',
    106,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM problems WHERE board_id = 33);

INSERT INTO problems (board_id, title, description, release_at, close_at, created_by, created_at, updated_at)
SELECT
    34,
    'He thong trien khai & van hanh',
    'Bai toan ha tang cho bang HKT B.',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '14 days',
    106,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM problems WHERE board_id = 34);

-- === Rubric round 22 — bo sung 5 tieu chi chuan ===
INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    22, 'HKT_01', 'Y tuong & sang tao', 'Muc do doc dao.', 30.000, 0, 10, 1,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 22 AND code = 'HKT_01');

INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    22, 'HKT_02', 'Ky thuat & trien khai', 'Chat luong code.', 25.000, 0, 10, 2,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 22 AND code = 'HKT_02');

INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    22, 'HKT_03', 'Trinh bay & tai lieu', 'README, slide.', 20.000, 0, 10, 3,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 22 AND code = 'HKT_03');

INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    22, 'HKT_04', 'Hoan thien san pham', 'UI/UX, demo.', 15.000, 0, 10, 4,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 22 AND code = 'HKT_04');

INSERT INTO score_criteria (
    round_id, code, name, description, weight, min_score, max_score, sort_order, level_descriptors, created_at
)
SELECT
    22, 'HKT_05', 'Doi moi & mo rong', 'Kha nang mo rong.', 10.000, 0, 10, 5,
    '[{"level":"EXCELLENT","label":"Xuat sac","minScore":9,"maxScore":10,"description":""},{"level":"GOOD","label":"Tot","minScore":7,"maxScore":8.9,"description":""},{"level":"SATISFACTORY","label":"Dat","minScore":5,"maxScore":6.9,"description":""},{"level":"UNSATISFACTORY","label":"Chua dat","minScore":0,"maxScore":4.9,"description":""}]'::jsonb,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM score_criteria WHERE round_id = 22 AND code = 'HKT_05');

UPDATE score_criteria
SET weight = 30.000, sort_order = 1
WHERE round_id = 22 AND code = 'HKT_01';
UPDATE score_criteria
SET weight = 25.000, sort_order = 2
WHERE round_id = 22 AND code = 'HKT_02';
UPDATE score_criteria
SET weight = 20.000, sort_order = 3
WHERE round_id = 22 AND code = 'HKT_03';
UPDATE score_criteria
SET weight = 15.000, sort_order = 4
WHERE round_id = 22 AND code = 'HKT_04';
UPDATE score_criteria
SET weight = 10.000, sort_order = 5
WHERE round_id = 22 AND code = 'HKT_05';

-- === Bai nop: team 44 (HKT hien co) + teams moi ===
INSERT INTO team_repositories (
    team_id, repository_url, repository_name, review_interval_minutes,
    status, submitted_at, created_by, created_at, updated_at
)
SELECT
    44,
    'https://github.com/seal-hackathon/hkt-main',
    'hkt-main',
    30,
    'DRAFT',
    NULL,
    105,
    NOW(),
    NOW()
WHERE EXISTS (SELECT 1 FROM teams WHERE id = 44)
  AND NOT EXISTS (SELECT 1 FROM team_repositories WHERE team_id = 44);

INSERT INTO team_repositories (
    team_id, repository_url, repository_name, review_interval_minutes,
    status, submitted_at, created_by, created_at, updated_at
)
SELECT
    51,
    'https://github.com/seal-hackathon/hkt-pioneers',
    'hkt-pioneers',
    30,
    'DRAFT',
    NULL,
    108,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM team_repositories WHERE team_id = 51);

INSERT INTO team_repositories (
    team_id, repository_url, repository_name, review_interval_minutes,
    status, submitted_at, created_by, created_at, updated_at
)
SELECT
    52,
    'https://github.com/seal-hackathon/hkt-innovators',
    'hkt-innovators',
    30,
    'SUBMITTED',
    NOW() - INTERVAL '2 hours',
    106,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM team_repositories WHERE team_id = 52);

UPDATE team_repositories
SET status = 'DRAFT', submitted_at = NULL,
    repository_url = COALESCE(NULLIF(TRIM(repository_url), ''), 'https://github.com/seal-hackathon/hkt-main'),
    updated_at = NOW()
WHERE team_id = 44;

-- === Phieu cham mau (team 44 tren bang 33, judge 104 hoac 106) ===
INSERT INTO score_sheets (
    judge_assignment_id, board_id, team_id, judge_id, status, general_feedback, submitted_at, created_at, updated_at
)
SELECT
    ja.id, 33, 44, ja.judge_id, 'DRAFT', 'HKT — can bo sung demo.', NULL, NOW(), NOW()
FROM judge_assignments ja
WHERE ja.board_id = 33
  AND EXISTS (SELECT 1 FROM teams WHERE id = 44)
  AND NOT EXISTS (
      SELECT 1 FROM score_sheets ss
      WHERE ss.board_id = 33 AND ss.team_id = 44 AND ss.judge_id = ja.judge_id
  )
LIMIT 1;

INSERT INTO score_items (score_sheet_id, criteria_id, score_value)
SELECT ss.id, sc.id, 8.0
FROM score_sheets ss
JOIN score_criteria sc ON sc.round_id = 22 AND sc.code = 'HKT_01'
WHERE ss.board_id = 33 AND ss.team_id = 44 AND ss.status = 'DRAFT'
  AND NOT EXISTS (
      SELECT 1 FROM score_items si WHERE si.score_sheet_id = ss.id AND si.criteria_id = sc.id
  );

-- Thong bao
INSERT INTO announcements (event_id, title, content, published_at, created_by, created_at)
SELECT 13, 'Mo dang ky HKT', 'Dang ky doi Seal HKT 2026 da mo.', NOW(), 106, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM announcements a WHERE a.event_id = 13 AND a.title = 'Mo dang ky HKT'
);

-- Sequences
SELECT setval('users_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 109));
SELECT setval('teams_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM teams), 54));
SELECT setval('team_members_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM team_members), 217));
