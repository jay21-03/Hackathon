CREATE TABLE IF NOT EXISTS ai_review_bulk_jobs (
    id              VARCHAR(36) PRIMARY KEY,
    event_id        BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL,
    total           INT NOT NULL DEFAULT 0,
    processed       INT NOT NULL DEFAULT 0,
    succeeded_count INT NOT NULL DEFAULT 0,
    failed_count    INT NOT NULL DEFAULT 0,
    result_json     JSONB,
    error_message   TEXT,
    started_by      BIGINT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_review_bulk_jobs_event_started
    ON ai_review_bulk_jobs(event_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_review_bulk_jobs_status
    ON ai_review_bulk_jobs(status)
    WHERE status = 'RUNNING';
