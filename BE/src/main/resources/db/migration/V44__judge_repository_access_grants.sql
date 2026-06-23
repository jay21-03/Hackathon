CREATE TABLE judge_repository_access_grants (
    id BIGSERIAL PRIMARY KEY,
    team_repository_id BIGINT NOT NULL REFERENCES team_repositories (id) ON DELETE CASCADE,
    judge_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    judge_github_username VARCHAR(39) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_judge_repo_access UNIQUE (team_repository_id, judge_id)
);

CREATE INDEX idx_judge_repo_access_judge ON judge_repository_access_grants (judge_id);
CREATE INDEX idx_judge_repo_access_repo ON judge_repository_access_grants (team_repository_id);
