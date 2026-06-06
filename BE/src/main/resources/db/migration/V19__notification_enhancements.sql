ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS link_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS dedupe_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedupe_key
    ON notifications (dedupe_key)
    WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_announcements_event_published
    ON announcements (event_id, published_at DESC);
