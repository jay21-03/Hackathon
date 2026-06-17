ALTER TABLE repo_commits
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'scheduler';

CREATE INDEX IF NOT EXISTS idx_repo_commits_source ON repo_commits(source);
