CREATE TABLE IF NOT EXISTS demo_seed_runs (
    id VARCHAR(36) PRIMARY KEY,
    seed_key VARCHAR(255) NOT NULL UNIQUE,
    seed_type VARCHAR(50) NOT NULL,
    scope_id BIGINT,
    entity_ids JSONB,
    summary JSONB,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_demo_seed_runs_type_scope
    ON demo_seed_runs (seed_type, scope_id);
