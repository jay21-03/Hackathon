CREATE TABLE email_templates (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    template_key VARCHAR(40) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_email_template_key CHECK (
        template_key IN ('STAFF_INVITATION', 'TEAM_INVITATION', 'STAFF_REMINDER', 'TEAM_REMINDER')
    )
);

CREATE UNIQUE INDEX uq_email_template_global
    ON email_templates (template_key)
    WHERE event_id IS NULL;

CREATE UNIQUE INDEX uq_email_template_event
    ON email_templates (event_id, template_key)
    WHERE event_id IS NOT NULL;

CREATE TABLE invitation_email_deliveries (
    id BIGSERIAL PRIMARY KEY,
    invitation_type VARCHAR(10) NOT NULL CHECK (invitation_type IN ('STAFF', 'TEAM')),
    staff_invitation_id BIGINT REFERENCES staff_invitations(id) ON DELETE CASCADE,
    team_member_id BIGINT REFERENCES team_members(id) ON DELETE CASCADE,
    tracking_token VARCHAR(64) NOT NULL,
    accept_url TEXT NOT NULL,
    decline_url TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    open_count INT NOT NULL DEFAULT 0,
    accept_clicked_at TIMESTAMPTZ,
    decline_clicked_at TIMESTAMPTZ,
    is_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_invitation_delivery_target CHECK (
        (invitation_type = 'STAFF' AND staff_invitation_id IS NOT NULL AND team_member_id IS NULL)
        OR (invitation_type = 'TEAM' AND team_member_id IS NOT NULL AND staff_invitation_id IS NULL)
    )
);

CREATE UNIQUE INDEX uq_invitation_email_tracking_token ON invitation_email_deliveries (tracking_token);
CREATE INDEX idx_invitation_email_staff ON invitation_email_deliveries (staff_invitation_id, sent_at DESC);
CREATE INDEX idx_invitation_email_team ON invitation_email_deliveries (team_member_id, sent_at DESC);

ALTER TABLE staff_invitations
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

ALTER TABLE team_members
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
