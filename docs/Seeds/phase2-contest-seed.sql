\set ON_ERROR_STOP on
BEGIN;

INSERT INTO users (email, google_sub, password_hash, full_name, status, created_at, updated_at)
VALUES (
    'seed.organizer@example.com',
    NULL,
    NULL,
    'Seed Organizer',
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role, created_at)
SELECT u.id, 'ORGANIZER', NOW()
FROM users u
WHERE u.email = 'seed.organizer@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = u.id
        AND ur.role = 'ORGANIZER'
  );

WITH seed_events(seed_key, name, description, max_teams, start_date, end_date, registration_start_at, registration_end_at) AS (
    VALUES
        (1, 'SEAL Hackathon Seed 1', 'Seed event for Swagger testing', 30, CURRENT_DATE + 14, CURRENT_DATE + 16, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days'),
        (2, 'SEAL Hackathon Seed 2', 'Seed event for Swagger testing', 40, CURRENT_DATE + 21, CURRENT_DATE + 23, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days'),
        (3, 'SEAL Hackathon Seed 3', 'Seed event for Swagger testing', 50, CURRENT_DATE + 28, CURRENT_DATE + 30, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days')
)
INSERT INTO events (
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
    s.name,
    s.description,
    s.start_date,
    s.end_date,
    s.registration_start_at,
    s.registration_end_at,
    s.max_teams,
    1,
    5,
    'DRAFT',
    o.id,
    NOW(),
    NOW()
FROM seed_events s
CROSS JOIN (SELECT id FROM users WHERE email = 'seed.organizer@example.com' LIMIT 1) o
WHERE NOT EXISTS (
    SELECT 1
    FROM events e
    WHERE e.name = s.name
);

WITH seed_rounds(seed_key, event_name, round_name, round_type, round_order) AS (
    VALUES
        (1, 'SEAL Hackathon Seed 1', 'Vòng bảng - Event 1', 'GROUP_STAGE', 1),
        (2, 'SEAL Hackathon Seed 1', 'Chung kết - Event 1', 'FINAL', 2),
        (3, 'SEAL Hackathon Seed 2', 'Vòng bảng - Event 2', 'GROUP_STAGE', 1),
        (4, 'SEAL Hackathon Seed 2', 'Chung kết - Event 2', 'FINAL', 2),
        (5, 'SEAL Hackathon Seed 3', 'Vòng bảng - Event 3', 'GROUP_STAGE', 1),
        (6, 'SEAL Hackathon Seed 3', 'Chung kết - Event 3', 'FINAL', 2)
)
INSERT INTO rounds (
    event_id,
    name,
    round_type,
    round_order,
    start_at,
    end_at,
    status,
    created_at,
    updated_at
)
SELECT
    e.id,
    s.round_name,
    s.round_type,
    s.round_order,
    NULL,
    NULL,
    'DRAFT',
    NOW(),
    NOW()
FROM seed_rounds s
JOIN events e ON e.name = s.event_name
ON CONFLICT ON CONSTRAINT uq_rounds_event_order DO NOTHING;

WITH seed_boards(event_name, round_order, board_name, board_order, description) AS (
    VALUES
        ('SEAL Hackathon Seed 1', 1, 'Bảng A', 1, 'Seed board A'),
        ('SEAL Hackathon Seed 1', 1, 'Bảng B', 2, 'Seed board B'),
        ('SEAL Hackathon Seed 1', 1, 'Bảng C', 3, 'Seed board C'),
        ('SEAL Hackathon Seed 1', 2, 'Bảng A', 1, 'Seed board A'),
        ('SEAL Hackathon Seed 1', 2, 'Bảng B', 2, 'Seed board B'),
        ('SEAL Hackathon Seed 1', 2, 'Bảng C', 3, 'Seed board C'),
        ('SEAL Hackathon Seed 2', 1, 'Bảng A', 1, 'Seed board A'),
        ('SEAL Hackathon Seed 2', 1, 'Bảng B', 2, 'Seed board B'),
        ('SEAL Hackathon Seed 2', 1, 'Bảng C', 3, 'Seed board C'),
        ('SEAL Hackathon Seed 2', 2, 'Bảng A', 1, 'Seed board A'),
        ('SEAL Hackathon Seed 2', 2, 'Bảng B', 2, 'Seed board B'),
        ('SEAL Hackathon Seed 2', 2, 'Bảng C', 3, 'Seed board C'),
        ('SEAL Hackathon Seed 3', 1, 'Bảng A', 1, 'Seed board A'),
        ('SEAL Hackathon Seed 3', 1, 'Bảng B', 2, 'Seed board B'),
        ('SEAL Hackathon Seed 3', 1, 'Bảng C', 3, 'Seed board C'),
        ('SEAL Hackathon Seed 3', 2, 'Bảng A', 1, 'Seed board A'),
        ('SEAL Hackathon Seed 3', 2, 'Bảng B', 2, 'Seed board B'),
        ('SEAL Hackathon Seed 3', 2, 'Bảng C', 3, 'Seed board C')
)
INSERT INTO boards (
    round_id,
    name,
    board_order,
    description,
    status,
    created_at,
    updated_at
)
SELECT
    r.id,
    s.board_name,
    s.board_order,
    s.description,
    'DRAFT',
    NOW(),
    NOW()
FROM seed_boards s
JOIN events e ON e.name = s.event_name
JOIN rounds r ON r.event_id = e.id AND r.round_order = s.round_order
ON CONFLICT ON CONSTRAINT uq_boards_round_order DO NOTHING;

INSERT INTO board_slots (round_id, board_id, team_number, team_id, created_at)
SELECT
    r.id,
    b.id,
    gs.team_number,
    NULL,
    NOW()
FROM events e
JOIN rounds r ON r.event_id = e.id
JOIN boards b ON b.round_id = r.id
CROSS JOIN generate_series(1, 5) AS gs(team_number)
WHERE e.name LIKE 'SEAL Hackathon Seed %'
ON CONFLICT ON CONSTRAINT uq_board_slots_board_team_number DO NOTHING;

WITH seed_problems(event_name, round_order, board_name, title) AS (
    VALUES
        ('SEAL Hackathon Seed 1', 1, 'Bảng A', 'Đề SEAL Hackathon Seed 1 - Vòng bảng - Event 1 - Bảng A'),
        ('SEAL Hackathon Seed 1', 1, 'Bảng B', 'Đề SEAL Hackathon Seed 1 - Vòng bảng - Event 1 - Bảng B'),
        ('SEAL Hackathon Seed 1', 1, 'Bảng C', 'Đề SEAL Hackathon Seed 1 - Vòng bảng - Event 1 - Bảng C'),
        ('SEAL Hackathon Seed 1', 2, 'Bảng A', 'Đề SEAL Hackathon Seed 1 - Chung kết - Event 1 - Bảng A'),
        ('SEAL Hackathon Seed 1', 2, 'Bảng B', 'Đề SEAL Hackathon Seed 1 - Chung kết - Event 1 - Bảng B'),
        ('SEAL Hackathon Seed 1', 2, 'Bảng C', 'Đề SEAL Hackathon Seed 1 - Chung kết - Event 1 - Bảng C'),
        ('SEAL Hackathon Seed 2', 1, 'Bảng A', 'Đề SEAL Hackathon Seed 2 - Vòng bảng - Event 2 - Bảng A'),
        ('SEAL Hackathon Seed 2', 1, 'Bảng B', 'Đề SEAL Hackathon Seed 2 - Vòng bảng - Event 2 - Bảng B'),
        ('SEAL Hackathon Seed 2', 1, 'Bảng C', 'Đề SEAL Hackathon Seed 2 - Vòng bảng - Event 2 - Bảng C'),
        ('SEAL Hackathon Seed 2', 2, 'Bảng A', 'Đề SEAL Hackathon Seed 2 - Chung kết - Event 2 - Bảng A'),
        ('SEAL Hackathon Seed 2', 2, 'Bảng B', 'Đề SEAL Hackathon Seed 2 - Chung kết - Event 2 - Bảng B'),
        ('SEAL Hackathon Seed 2', 2, 'Bảng C', 'Đề SEAL Hackathon Seed 2 - Chung kết - Event 2 - Bảng C'),
        ('SEAL Hackathon Seed 3', 1, 'Bảng A', 'Đề SEAL Hackathon Seed 3 - Vòng bảng - Event 3 - Bảng A'),
        ('SEAL Hackathon Seed 3', 1, 'Bảng B', 'Đề SEAL Hackathon Seed 3 - Vòng bảng - Event 3 - Bảng B'),
        ('SEAL Hackathon Seed 3', 1, 'Bảng C', 'Đề SEAL Hackathon Seed 3 - Vòng bảng - Event 3 - Bảng C'),
        ('SEAL Hackathon Seed 3', 2, 'Bảng A', 'Đề SEAL Hackathon Seed 3 - Chung kết - Event 3 - Bảng A'),
        ('SEAL Hackathon Seed 3', 2, 'Bảng B', 'Đề SEAL Hackathon Seed 3 - Chung kết - Event 3 - Bảng B'),
        ('SEAL Hackathon Seed 3', 2, 'Bảng C', 'Đề SEAL Hackathon Seed 3 - Chung kết - Event 3 - Bảng C')
)
INSERT INTO problems (
    board_id,
    title,
    description,
    attachment_url,
    external_link,
    release_at,
    created_by,
    created_at,
    updated_at
)
SELECT
    b.id,
    s.title,
    'Seed problem for Swagger testing',
    'https://example.com/problem.pdf',
    'https://example.com/problem',
    NOW() + INTERVAL '1 day',
    o.id,
    NOW(),
    NOW()
FROM seed_problems s
JOIN events e ON e.name = s.event_name
JOIN rounds r ON r.event_id = e.id AND r.round_order = s.round_order
JOIN boards b ON b.round_id = r.id AND b.name = s.board_name
CROSS JOIN (SELECT id FROM users WHERE email = 'seed.organizer@example.com' LIMIT 1) o
WHERE NOT EXISTS (
    SELECT 1
    FROM problems p
    WHERE p.board_id = b.id
);

COMMIT;
