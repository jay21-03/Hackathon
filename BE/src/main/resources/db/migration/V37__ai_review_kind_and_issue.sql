ALTER TABLE ai_reviews
    ADD COLUMN IF NOT EXISTS review_kind VARCHAR(50) NOT NULL DEFAULT 'PER_PUSH',
    ADD COLUMN IF NOT EXISTS commit_sha VARCHAR(64),
    ADD COLUMN IF NOT EXISTS github_issue_url TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_reviews_review_kind ON ai_reviews(review_kind);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_team_kind_reviewed ON ai_reviews(team_id, review_kind, reviewed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_reviews_team_commit_kind
    ON ai_reviews(team_id, commit_sha, review_kind)
    WHERE commit_sha IS NOT NULL;
