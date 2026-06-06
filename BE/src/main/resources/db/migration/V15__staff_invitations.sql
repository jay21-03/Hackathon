CREATE TABLE staff_invitations (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('MENTOR', 'JUDGE')),
    status VARCHAR(20) NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED')),
    invite_token_hash VARCHAR(128),
    invite_nonce VARCHAR(64),
    invite_expires_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    accepted_user_id BIGINT REFERENCES users(id),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_invitations_board_id ON staff_invitations (board_id);
CREATE INDEX idx_staff_invitations_status ON staff_invitations (status);
CREATE UNIQUE INDEX uq_staff_invite_pending
    ON staff_invitations (board_id, email, role)
    WHERE status = 'INVITED';
