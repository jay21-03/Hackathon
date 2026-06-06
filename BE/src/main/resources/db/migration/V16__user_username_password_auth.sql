ALTER TABLE users
    ADD COLUMN username VARCHAR(50),
    ADD COLUMN profile_completed BOOLEAN NOT NULL DEFAULT TRUE;

CREATE UNIQUE INDEX uq_users_username ON users (username) WHERE username IS NOT NULL;
