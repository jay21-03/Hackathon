ALTER TABLE users
    ADD COLUMN IF NOT EXISTS github_username VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_github_username
    ON users (LOWER(github_username))
    WHERE github_username IS NOT NULL;

CREATE TABLE IF NOT EXISTS problem_repository_templates (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT NOT NULL REFERENCES problems(id),
    template_owner VARCHAR(100) NOT NULL,
    template_repo VARCHAR(100) NOT NULL,
    default_branch VARCHAR(100) NOT NULL DEFAULT 'main',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_problem_repository_templates_problem UNIQUE (problem_id)
);

ALTER TABLE team_repositories
    ALTER COLUMN repository_url DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS round_id BIGINT REFERENCES rounds(id),
    ADD COLUMN IF NOT EXISTS board_id BIGINT REFERENCES boards(id),
    ADD COLUMN IF NOT EXISTS problem_id BIGINT REFERENCES problems(id),
    ADD COLUMN IF NOT EXISTS github_owner VARCHAR(100),
    ADD COLUMN IF NOT EXISTS github_repo_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS github_repo_id BIGINT,
    ADD COLUMN IF NOT EXISTS access_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS provision_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE team_repositories
    DROP CONSTRAINT IF EXISTS team_repositories_team_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_repositories_team_problem
    ON team_repositories (team_id, problem_id)
    WHERE problem_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_repositories_team_legacy
    ON team_repositories (team_id)
    WHERE problem_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_team_repositories_problem_id
    ON team_repositories (problem_id);

CREATE INDEX IF NOT EXISTS idx_team_repositories_round_access
    ON team_repositories (round_id, access_status);
