ALTER TABLE ai_reviews
    ADD COLUMN IF NOT EXISTS team_repository_id BIGINT REFERENCES team_repositories(id) ON DELETE SET NULL;

UPDATE ai_reviews ar
SET team_repository_id = rc.team_repository_id
FROM repo_commits rc
WHERE ar.repo_commit_id = rc.id
  AND ar.team_repository_id IS NULL;

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY team_repository_id, commit_sha, review_kind
            ORDER BY reviewed_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        ) AS rn
    FROM ai_reviews
    WHERE team_repository_id IS NOT NULL
      AND commit_sha IS NOT NULL
)
DELETE FROM ai_reviews ar
USING ranked r
WHERE ar.id = r.id
  AND r.rn > 1;

CREATE INDEX IF NOT EXISTS idx_ai_reviews_team_repository
    ON ai_reviews(team_repository_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_reviews_repository_commit_kind
    ON ai_reviews(team_repository_id, commit_sha, review_kind)
    WHERE team_repository_id IS NOT NULL
      AND commit_sha IS NOT NULL;
