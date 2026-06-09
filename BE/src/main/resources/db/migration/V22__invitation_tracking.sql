ALTER TABLE staff_invitations
    ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ;

ALTER TABLE team_members
    ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_team_members_event_status ON team_members (event_id, status);
