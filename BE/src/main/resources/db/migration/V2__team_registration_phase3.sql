-- Phase 3: Team Registration additions
-- Add columns to teams and team_members, and create supporting tables

-- Add audit/versioning to teams
ALTER TABLE IF EXISTS teams
  ADD COLUMN IF NOT EXISTS created_by bigint,
  ADD COLUMN IF NOT EXISTS updated_by bigint,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_changed_by bigint,
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;

-- Add token fields and audit to team_members
ALTER TABLE IF EXISTS team_members
  ADD COLUMN IF NOT EXISTS created_by bigint,
  ADD COLUMN IF NOT EXISTS updated_by bigint,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invite_token_hash varchar(512),
  ADD COLUMN IF NOT EXISTS invite_nonce varchar(64),
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_consumed_at timestamptz;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS ux_team_members_event_email ON team_members (event_id, lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS ux_teams_event_lower_name ON teams (event_id, lower(name));

-- Event counters table to help with quota locking or counters
CREATE TABLE IF NOT EXISTS event_counters (
  event_id bigint PRIMARY KEY,
  confirmed_count int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Slot reservations table
CREATE TABLE IF NOT EXISTS slot_reservations (
  reservation_id BIGSERIAL PRIMARY KEY,
  event_id bigint NOT NULL,
  team_id bigint NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status varchar(32) NOT NULL DEFAULT 'RESERVED',
  metadata jsonb,
  CONSTRAINT fk_res_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_slot_reservations_event_status ON slot_reservations (event_id, status);

-- Outbox table for transactional outbox pattern
CREATE TABLE IF NOT EXISTS outbox (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type varchar(128) NOT NULL,
  aggregate_id bigint,
  event_type varchar(128) NOT NULL,
  payload jsonb NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_processed_created ON outbox (processed, created_at);

-- Domain events append-only table
CREATE TABLE IF NOT EXISTS domain_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  aggregate_type varchar(128) NOT NULL,
  aggregate_id bigint,
  event_type varchar(128) NOT NULL,
  payload jsonb NOT NULL
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id bigint,
  actor_email varchar(320),
  action varchar(128) NOT NULL,
  entity_type varchar(128) NOT NULL,
  entity_id bigint,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotency keys table (skeleton)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id BIGSERIAL PRIMARY KEY,
  key varchar(255) NOT NULL,
  user_id bigint,
  request_method varchar(16),
  request_path varchar(1024),
  request_hash varchar(128),
  response_code int,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_keys (key);

CREATE UNIQUE INDEX IF NOT EXISTS ux_idempotency_key_scope
  ON idempotency_keys (key, user_id, request_method, request_path);
