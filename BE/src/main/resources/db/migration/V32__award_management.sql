CREATE TABLE award_categories (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_id BIGINT REFERENCES rounds(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    award_type VARCHAR(20) NOT NULL DEFAULT 'CUSTOM',
    rank_order INT,
    max_winners INT NOT NULL DEFAULT 1,
    prize_value VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_award_categories_max_winners CHECK (max_winners >= 1),
    CONSTRAINT ck_award_categories_type CHECK (award_type IN ('RANK', 'CUSTOM')),
    CONSTRAINT uq_award_categories_event_code UNIQUE (event_id, code)
);

CREATE TABLE team_awards (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_id BIGINT REFERENCES rounds(id) ON DELETE SET NULL,
    award_category_id BIGINT NOT NULL REFERENCES award_categories(id) ON DELETE CASCADE,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    awarded_by BIGINT REFERENCES users(id),
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_team_awards_category_team UNIQUE (award_category_id, team_id)
);

CREATE INDEX idx_award_categories_event ON award_categories(event_id);
CREATE INDEX idx_award_categories_event_active ON award_categories(event_id, is_active);
CREATE INDEX idx_team_awards_event ON team_awards(event_id);
CREATE INDEX idx_team_awards_category ON team_awards(award_category_id);
CREATE INDEX idx_team_awards_event_published ON team_awards(event_id, published);
