-- Migration: add audit table, assignment metadata, and indexes for board assignment phase
-- Add assigned_at and assigned_by to board_slots
ALTER TABLE board_slots
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS assigned_by bigint NULL;

-- Ensure team_id column exists (it does in current schema), but keep idempotent
ALTER TABLE board_slots
  ADD COLUMN IF NOT EXISTS team_id bigint NULL;

-- Add unique index to prevent a team being assigned to multiple slots in same round
-- board_slots.round_id is assumed present; create if needed
ALTER TABLE board_slots
  ADD COLUMN IF NOT EXISTS round_id bigint NULL;

-- Backfill round_id from boards if null
UPDATE board_slots bs SET round_id = b.round_id FROM boards b WHERE bs.board_id = b.id AND bs.round_id IS NULL;

ALTER TABLE board_slots ALTER COLUMN round_id SET NOT NULL;

-- Create unique index on (team_id, round_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'ux_team_per_round') THEN
        CREATE UNIQUE INDEX ux_team_per_round ON board_slots(team_id, round_id) WHERE team_id IS NOT NULL;
    END IF;
END$$;

-- Create audit table for assignments
CREATE TABLE IF NOT EXISTS board_slot_assignments_audit (
  id bigserial PRIMARY KEY,
  round_id bigint NOT NULL,
  board_id bigint NOT NULL,
  slot_id bigint NOT NULL,
  team_id_before bigint NULL,
  team_id_after bigint NULL,
  action varchar(32) NOT NULL,
  performed_by bigint NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  reason text NULL
);

CREATE INDEX IF NOT EXISTS idx_board_slot_assignments_audit_round ON board_slot_assignments_audit(round_id);
CREATE INDEX IF NOT EXISTS idx_board_slot_assignments_audit_slot ON board_slot_assignments_audit(slot_id);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_board_slots_team_id ON board_slots(team_id);
CREATE INDEX IF NOT EXISTS idx_board_slots_board_id_slot ON board_slots(board_id, team_number);
CREATE INDEX IF NOT EXISTS idx_teams_status_registration ON teams(status, created_at);
