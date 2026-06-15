ALTER TABLE ai_reviews
    ADD COLUMN IF NOT EXISTS structured_output JSONB,
    ADD COLUMN IF NOT EXISTS rag_level VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_ai_reviews_reviewed_at ON ai_reviews(reviewed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_repo_commits_team_repo_sha
    ON repo_commits(team_repository_id, commit_sha);
