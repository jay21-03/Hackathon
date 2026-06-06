-- Seed data for local development to avoid empty public/protected screens.
-- All inserts are idempotent and keep existing records untouched.

-- Users for role-based testing and default local demo accounts
INSERT INTO users (id, email, full_name, status, created_at, updated_at)
SELECT 101, 'participant@seal.edu.vn', 'Thi sinh Demo', 'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 101);

INSERT INTO users (id, email, full_name, status, created_at, updated_at)
SELECT 102, 'organizer@seal.edu.vn', 'Ban To Chuc Demo', 'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 102);

INSERT INTO users (id, email, full_name, status, created_at, updated_at)
SELECT 103, 'mentor@seal.edu.vn', 'Mentor Demo', 'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 103);

INSERT INTO users (id, email, full_name, status, created_at, updated_at)
SELECT 104, 'judge@seal.edu.vn', 'Giam Khao Demo', 'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 104);

INSERT INTO user_roles (user_id, role, created_at)
SELECT 102, 'ORGANIZER', now()
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = 102 AND ur.role = 'ORGANIZER'
);

INSERT INTO user_roles (user_id, role, created_at)
SELECT 103, 'MENTOR', now()
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = 103 AND ur.role = 'MENTOR'
);

INSERT INTO user_roles (user_id, role, created_at)
SELECT 104, 'JUDGE', now()
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = 104 AND ur.role = 'JUDGE'
);

-- Events
INSERT INTO events (
    id,
    name,
    description,
    start_date,
    end_date,
    registration_start_at,
    registration_end_at,
    max_teams,
    min_team_size,
    max_team_size,
    status,
    created_by,
    created_at,
    updated_at
)
SELECT
    11,
    'SEAL Hackathon 2026',
    'Su kien hackathon chinh voi bai toan AI va he thong phan tan.',
    DATE '2026-07-12',
    DATE '2026-07-14',
    TIMESTAMPTZ '2026-06-10 08:00:00+07',
    TIMESTAMPTZ '2026-07-05 23:59:00+07',
    50,
    1,
    5,
    'REGISTRATION_OPEN',
    102,
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 11);

INSERT INTO events (
    id,
    name,
    description,
    start_date,
    end_date,
    registration_start_at,
    registration_end_at,
    max_teams,
    min_team_size,
    max_team_size,
    status,
    created_by,
    created_at,
    updated_at
)
SELECT
    12,
    'AI Innovation Challenge',
    'Su kien phu danh cho cac doi thu nghiem san pham AI ung dung.',
    DATE '2026-08-02',
    DATE '2026-08-03',
    TIMESTAMPTZ '2026-06-20 08:00:00+07',
    TIMESTAMPTZ '2026-07-25 23:59:00+07',
    40,
    1,
    5,
    'DRAFT',
    102,
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 12);

-- Round + boards for event 11
INSERT INTO rounds (id, event_id, name, round_type, round_order, start_at, end_at, status, created_at, updated_at)
SELECT
    21,
    11,
    'Vong Bang',
    'GROUP_STAGE',
    1,
    TIMESTAMPTZ '2026-07-12 09:00:00+07',
    TIMESTAMPTZ '2026-07-13 18:00:00+07',
    'PROBLEM_RELEASED',
    now(),
    now()
WHERE NOT EXISTS (SELECT 1 FROM rounds WHERE id = 21);

INSERT INTO boards (id, round_id, name, board_order, description, status, created_at, updated_at)
SELECT 31, 21, 'Bang Alpha', 1, 'Bang cham chinh cho nhom AI/ML.', 'READY', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE id = 31);

INSERT INTO boards (id, round_id, name, board_order, description, status, created_at, updated_at)
SELECT 32, 21, 'Bang Beta', 2, 'Bang cham cho nhom backend va systems.', 'READY', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM boards WHERE id = 32);

-- Teams
INSERT INTO teams (
    id,
    event_id,
    name,
    sequence_no,
    contact_user_id,
    contact_email,
    status,
    confirmed_at,
    created_at,
    updated_at
)
SELECT 41, 11, 'Quantum Nexus', 1, 101, 'participant@seal.edu.vn', 'CONFIRMED', now(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = 41);

INSERT INTO teams (
    id,
    event_id,
    name,
    sequence_no,
    contact_user_id,
    contact_email,
    status,
    confirmed_at,
    created_at,
    updated_at
)
SELECT 42, 11, 'DataStream Pro', 2, NULL, 'team2@seal.edu.vn', 'PENDING', NULL, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = 42);

INSERT INTO teams (
    id,
    event_id,
    name,
    sequence_no,
    contact_user_id,
    contact_email,
    status,
    confirmed_at,
    created_at,
    updated_at
)
SELECT 43, 11, 'Neural Net Ninjas', 3, NULL, 'team3@seal.edu.vn', 'WAITLIST', NULL, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = 43);

-- Team members
INSERT INTO team_members (
    id,
    event_id,
    team_id,
    user_id,
    email,
    full_name,
    is_contact_person,
    status,
    invited_at,
    confirmed_at
)
SELECT 201, 11, 41, 101, 'participant@seal.edu.vn', 'Thi sinh Demo', true, 'CONFIRMED', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE id = 201);

INSERT INTO team_members (
    id,
    event_id,
    team_id,
    user_id,
    email,
    full_name,
    is_contact_person,
    status,
    invited_at
)
SELECT 202, 11, 42, NULL, 'team2.lead@seal.edu.vn', 'Team 2 Lead', true, 'INVITED', now()
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE id = 202);

INSERT INTO team_members (
    id,
    event_id,
    team_id,
    user_id,
    email,
    full_name,
    is_contact_person,
    status,
    invited_at
)
SELECT 203, 11, 43, NULL, 'team3.lead@seal.edu.vn', 'Team 3 Lead', true, 'INVITED', now()
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE id = 203);

-- Board slots and assignments
INSERT INTO board_slots (id, round_id, board_id, team_number, team_id, assigned_at, assigned_by, created_at)
SELECT 301, 21, 31, 1, 41, now(), 102, now()
WHERE NOT EXISTS (SELECT 1 FROM board_slots WHERE id = 301);

INSERT INTO board_slots (id, round_id, board_id, team_number, team_id, assigned_at, assigned_by, created_at)
SELECT 302, 21, 31, 2, 42, now(), 102, now()
WHERE NOT EXISTS (SELECT 1 FROM board_slots WHERE id = 302);

INSERT INTO board_slots (id, round_id, board_id, team_number, team_id, assigned_at, assigned_by, created_at)
SELECT 303, 21, 32, 1, 43, now(), 102, now()
WHERE NOT EXISTS (SELECT 1 FROM board_slots WHERE id = 303);

INSERT INTO mentor_assignments (board_id, mentor_id, created_by, created_at)
SELECT 31, 103, 102, now()
WHERE NOT EXISTS (
    SELECT 1 FROM mentor_assignments ma WHERE ma.board_id = 31 AND ma.mentor_id = 103
);

INSERT INTO judge_assignments (board_id, judge_id, created_by, created_at)
SELECT 31, 104, 102, now()
WHERE NOT EXISTS (
    SELECT 1 FROM judge_assignments ja WHERE ja.board_id = 31 AND ja.judge_id = 104
);

-- Public communication sample
INSERT INTO announcements (event_id, title, content, published_at, created_by, created_at)
SELECT 11, 'Mo dang ky', 'Dang ky doi da mo cho SEAL Hackathon 2026.', now(), 102, now()
WHERE NOT EXISTS (
    SELECT 1 FROM announcements a WHERE a.event_id = 11 AND a.title = 'Mo dang ky'
);

INSERT INTO notifications (user_id, email, event_id, title, content, is_read, created_at)
SELECT 101, 'participant@seal.edu.vn', 11, 'Dang ky thanh cong', 'Ho so doi cua ban da duoc tiep nhan.', false, now()
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = 101 AND n.title = 'Dang ky thanh cong'
);

-- Keep serial sequences ahead of seeded IDs
SELECT setval('users_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 104));
SELECT setval('events_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM events), 12));
SELECT setval('rounds_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM rounds), 21));
SELECT setval('boards_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM boards), 32));
SELECT setval('teams_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM teams), 43));
SELECT setval('team_members_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM team_members), 203));
SELECT setval('board_slots_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM board_slots), 303));
