CREATE TABLE academic_terms (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    term_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_academic_terms_code UNIQUE (code),
    CONSTRAINT uq_academic_terms_year_type UNIQUE (year, term_type),
    CONSTRAINT ck_academic_terms_type CHECK (term_type IN ('SPRING', 'SUMMER', 'FALL')),
    CONSTRAINT ck_academic_terms_status CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    CONSTRAINT ck_academic_terms_date_range CHECK (end_date > start_date)
);

CREATE INDEX idx_academic_terms_status ON academic_terms (status);
CREATE INDEX idx_academic_terms_year_type ON academic_terms (year, term_type);

ALTER TABLE events
    ADD COLUMN academic_term_id BIGINT REFERENCES academic_terms (id);

CREATE INDEX idx_events_academic_term_id ON events (academic_term_id);
