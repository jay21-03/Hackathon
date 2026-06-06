ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS audience VARCHAR(32) DEFAULT 'ALL',
    ADD COLUMN IF NOT EXISTS recipient_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_notifications_event_id_created_at
    ON notifications (event_id, created_at DESC);
