ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS close_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_problems_close_at ON problems(close_at);
