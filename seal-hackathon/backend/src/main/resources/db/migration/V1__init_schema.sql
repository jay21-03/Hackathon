CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    google_sub VARCHAR(255),
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    student_id VARCHAR(100),
    university VARCHAR(255),
    avatar_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    registration_start_at TIMESTAMPTZ,
    registration_end_at TIMESTAMPTZ,
    max_teams INT NOT NULL,
    min_team_size INT NOT NULL DEFAULT 1,
    max_team_size INT NOT NULL DEFAULT 5,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_events_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT ck_events_team_size CHECK (min_team_size >= 1 AND max_team_size <= 5 AND max_team_size >= min_team_size),
    CONSTRAINT ck_events_max_teams CHECK (max_teams > 0)
);

CREATE TABLE rounds (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    name VARCHAR(255) NOT NULL,
    round_type VARCHAR(50) NOT NULL,
    round_order INT NOT NULL,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rounds_event_order UNIQUE (event_id, round_order)
);

CREATE TABLE boards (
    id BIGSERIAL PRIMARY KEY,
    round_id BIGINT NOT NULL REFERENCES rounds(id),
    name VARCHAR(255) NOT NULL,
    board_order INT NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_boards_round_name UNIQUE (round_id, name),
    CONSTRAINT uq_boards_round_order UNIQUE (round_id, board_order)
);

CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    name VARCHAR(255) NOT NULL,
    sequence_no INT,
    contact_user_id BIGINT REFERENCES users(id),
    contact_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    confirmed_at TIMESTAMPTZ,
    rejected_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE board_slots (
    id BIGSERIAL PRIMARY KEY,
    round_id BIGINT NOT NULL REFERENCES rounds(id),
    board_id BIGINT NOT NULL REFERENCES boards(id),
    team_number INT NOT NULL,
    team_id BIGINT REFERENCES teams(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_board_slots_board_team_number UNIQUE (board_id, team_number),
    CONSTRAINT uq_board_slots_round_team UNIQUE (round_id, team_id)
);

CREATE TABLE problems (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    attachment_url VARCHAR(500),
    external_link VARCHAR(500),
    release_at TIMESTAMPTZ NOT NULL,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    team_id BIGINT NOT NULL REFERENCES teams(id),
    user_id BIGINT REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(100),
    university VARCHAR(255),
    is_contact_person BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'INVITED',
    invite_token VARCHAR(255),
    invited_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ
);

CREATE TABLE check_ins (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    team_id BIGINT NOT NULL REFERENCES teams(id),
    team_member_id BIGINT NOT NULL REFERENCES team_members(id),
    user_id BIGINT REFERENCES users(id),
    photo_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_by BIGINT REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    note TEXT,
    CONSTRAINT uq_checkin_event_team_member UNIQUE (event_id, team_member_id)
);

CREATE TABLE mentor_assignments (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id),
    mentor_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mentor_assignment UNIQUE (board_id, mentor_id)
);

CREATE TABLE judge_assignments (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id),
    judge_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_judge_assignment UNIQUE (board_id, judge_id)
);

CREATE TABLE score_criteria (
    id BIGSERIAL PRIMARY KEY,
    round_id BIGINT NOT NULL REFERENCES rounds(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight NUMERIC(6,3) NOT NULL DEFAULT 1,
    min_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    max_score NUMERIC(6,2) NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE score_sheets (
    id BIGSERIAL PRIMARY KEY,
    judge_assignment_id BIGINT REFERENCES judge_assignments(id),
    board_id BIGINT NOT NULL REFERENCES boards(id),
    team_id BIGINT NOT NULL REFERENCES teams(id),
    judge_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    general_feedback TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_score_sheet_board_team_judge UNIQUE (board_id, team_id, judge_id)
);

CREATE TABLE score_items (
    id BIGSERIAL PRIMARY KEY,
    score_sheet_id BIGINT NOT NULL REFERENCES score_sheets(id) ON DELETE CASCADE,
    criteria_id BIGINT NOT NULL REFERENCES score_criteria(id),
    score_value NUMERIC(6,2) NOT NULL,
    comment TEXT,
    CONSTRAINT uq_score_items_sheet_criteria UNIQUE (score_sheet_id, criteria_id)
);

CREATE TABLE ranking_results (
    id BIGSERIAL PRIMARY KEY,
    round_id BIGINT NOT NULL REFERENCES rounds(id),
    board_id BIGINT NOT NULL REFERENCES boards(id),
    team_id BIGINT NOT NULL REFERENCES teams(id),
    rank INT NOT NULL,
    average_score NUMERIC(8,3) NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CONSTRAINT uq_ranking_board_team UNIQUE (board_id, team_id),
    CONSTRAINT uq_ranking_board_rank UNIQUE (board_id, rank)
);

CREATE TABLE advancements (
    id BIGSERIAL PRIMARY KEY,
    from_round_id BIGINT NOT NULL REFERENCES rounds(id),
    from_board_id BIGINT NOT NULL REFERENCES boards(id),
    to_round_id BIGINT NOT NULL REFERENCES rounds(id),
    to_board_id BIGINT REFERENCES boards(id),
    team_id BIGINT NOT NULL REFERENCES teams(id),
    basis_rank INT,
    basis_score NUMERIC(8,3),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_advancement_to_round_team UNIQUE (to_round_id, team_id)
);

CREATE TABLE team_repositories (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL UNIQUE REFERENCES teams(id),
    repository_url VARCHAR(500) NOT NULL,
    repository_name VARCHAR(255),
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    review_interval_minutes INT NOT NULL DEFAULT 30,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE repo_commits (
    id BIGSERIAL PRIMARY KEY,
    team_repository_id BIGINT NOT NULL REFERENCES team_repositories(id) ON DELETE CASCADE,
    commit_sha VARCHAR(100) NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    message TEXT,
    committed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_reviews (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id),
    round_id BIGINT REFERENCES rounds(id),
    repo_commit_id BIGINT REFERENCES repo_commits(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    review_score NUMERIC(8,3),
    summary TEXT,
    issues TEXT,
    suggestions TEXT,
    ai_model VARCHAR(120),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE announcements (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    email VARCHAR(255),
    event_id BIGINT REFERENCES events(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rounds_event_id ON rounds(event_id);
CREATE INDEX idx_boards_round_id ON boards(round_id);
CREATE INDEX idx_board_slots_round_id ON board_slots(round_id);
CREATE INDEX idx_board_slots_board_id ON board_slots(board_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_checkins_event_id ON check_ins(event_id);
CREATE INDEX idx_score_sheets_board_id ON score_sheets(board_id);
CREATE INDEX idx_ranking_results_board_id ON ranking_results(board_id);
CREATE INDEX idx_advancements_from_board_id ON advancements(from_board_id);
CREATE INDEX idx_team_repositories_next_review_at ON team_repositories(next_review_at);
CREATE INDEX idx_ai_reviews_team_id ON ai_reviews(team_id);
