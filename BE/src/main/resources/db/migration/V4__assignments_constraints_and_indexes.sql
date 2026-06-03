-- Add created_by audit columns for assignment tables (nullable by default)
ALTER TABLE IF EXISTS mentor_assignments ADD COLUMN IF NOT EXISTS created_by bigint;
ALTER TABLE IF EXISTS judge_assignments ADD COLUMN IF NOT EXISTS created_by bigint;

-- Create unique indexes to enforce one (board, user) per role
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_assignments_board_mentor_unique
    ON mentor_assignments(board_id, mentor_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_judge_assignments_board_judge_unique
    ON judge_assignments(board_id, judge_id);

-- Helpful indexes for lookups
CREATE INDEX IF NOT EXISTS idx_problems_board_id ON problems(board_id);
CREATE INDEX IF NOT EXISTS idx_problems_release_at ON problems(release_at);
CREATE INDEX IF NOT EXISTS idx_rounds_start_end ON rounds(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_mentor_id ON mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_board_id ON mentor_assignments(board_id);
CREATE INDEX IF NOT EXISTS idx_judge_assignments_judge_id ON judge_assignments(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_assignments_board_id ON judge_assignments(board_id);
CREATE INDEX IF NOT EXISTS idx_board_slots_board_team ON board_slots(board_id, team_id);

-- Add a check constraint to ensure round start is before end when both present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rounds_start_before_end') THEN
        ALTER TABLE rounds
            ADD CONSTRAINT chk_rounds_start_before_end CHECK (start_at IS NULL OR end_at IS NULL OR start_at < end_at);
    END IF;
END$$;
