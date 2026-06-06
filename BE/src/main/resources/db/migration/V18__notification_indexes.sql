CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at
    ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_email_created_at
    ON notifications (email, created_at DESC);
