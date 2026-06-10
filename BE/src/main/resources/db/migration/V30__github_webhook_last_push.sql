ALTER TABLE team_repositories
    ADD COLUMN IF NOT EXISTS last_push_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_team_repositories_github_repo
    ON team_repositories (github_repo_id)
    WHERE github_repo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_repositories_github_owner_name
    ON team_repositories (LOWER(github_owner), LOWER(github_repo_name))
    WHERE github_owner IS NOT NULL AND github_repo_name IS NOT NULL;
