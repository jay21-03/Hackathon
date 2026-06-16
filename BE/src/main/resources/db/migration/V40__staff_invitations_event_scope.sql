ALTER TABLE staff_invitations ALTER COLUMN board_id DROP NOT NULL;

ALTER TABLE staff_invitations ADD COLUMN event_id BIGINT REFERENCES events(id) ON DELETE CASCADE;

UPDATE staff_invitations si
SET event_id = (
    SELECT r.event_id
    FROM boards b
    JOIN rounds r ON r.id = b.round_id
    WHERE b.id = si.board_id
)
WHERE si.board_id IS NOT NULL;

DROP INDEX IF EXISTS uq_staff_invite_pending;

CREATE UNIQUE INDEX uq_staff_invite_pending_board
    ON staff_invitations (board_id, email, role)
    WHERE status = 'INVITED' AND board_id IS NOT NULL;

CREATE UNIQUE INDEX uq_staff_invite_pending_event
    ON staff_invitations (event_id, email, role)
    WHERE status = 'INVITED' AND board_id IS NULL AND event_id IS NOT NULL;

CREATE INDEX idx_staff_invitations_event_id ON staff_invitations (event_id);
