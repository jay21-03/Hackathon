-- Optimistic locking columns
ALTER TABLE board_slots ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 0;
ALTER TABLE score_sheets ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 0;
ALTER TABLE ranking_results ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 0;

-- teams.version exists from V2; ensure NOT NULL
ALTER TABLE teams ALTER COLUMN version SET DEFAULT 0;
UPDATE teams SET version = 0 WHERE version IS NULL;
ALTER TABLE teams ALTER COLUMN version SET NOT NULL;

-- Outbox dead-letter flag
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS dead_letter boolean NOT NULL DEFAULT false;
