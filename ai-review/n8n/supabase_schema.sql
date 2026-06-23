-- Schema Supabase cho pipeline n8n (xem SETUP.md)
-- Chạy trong Supabase SQL Editor nếu triển khai workflow n8n

CREATE TABLE IF NOT EXISTS team_commits (
  id              BIGSERIAL PRIMARY KEY,
  team_id         TEXT NOT NULL,
  commit_sha      TEXT NOT NULL,
  repo_name       TEXT,
  author          TEXT,
  commit_message  TEXT,
  committed_at    TIMESTAMPTZ,
  source          TEXT DEFAULT 'webhook',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_team_commits UNIQUE (team_id, commit_sha)
);

CREATE INDEX IF NOT EXISTS idx_tc_team_id ON team_commits(team_id);
CREATE INDEX IF NOT EXISTS idx_tc_committed_at ON team_commits(committed_at DESC);

CREATE TABLE IF NOT EXISTS ai_reviews (
  id                  BIGSERIAL PRIMARY KEY,
  team_id             TEXT NOT NULL,
  repo_name           TEXT,
  commit_sha          TEXT NOT NULL,
  review_kind         TEXT NOT NULL,
  status              TEXT,
  push_summary        TEXT,
  rag_level           TEXT,
  structured_output   JSONB,
  input_code_length   INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_ai_reviews UNIQUE (team_id, commit_sha, review_kind)
);

CREATE INDEX IF NOT EXISTS idx_ar_team_id ON ai_reviews(team_id);
CREATE INDEX IF NOT EXISTS idx_ar_review_kind ON ai_reviews(review_kind);
CREATE INDEX IF NOT EXISTS idx_ar_status ON ai_reviews(status);
CREATE INDEX IF NOT EXISTS idx_ar_updated_at ON ai_reviews(updated_at DESC);
