-- Phase 7: rubric code, sort order, level descriptors JSON
ALTER TABLE score_criteria
    ADD COLUMN IF NOT EXISTS code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS level_descriptors JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS uq_score_criteria_round_code
    ON score_criteria (round_id, code)
    WHERE code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_score_criteria_round_id ON score_criteria (round_id);

CREATE INDEX IF NOT EXISTS idx_score_sheets_board_judge ON score_sheets (board_id, judge_id);
CREATE INDEX IF NOT EXISTS idx_score_sheets_board_status ON score_sheets (board_id, status);
