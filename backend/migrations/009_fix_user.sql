BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS username VARCHAR(100);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'password_hash'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'hashed_password'
    )
    THEN
        ALTER TABLE users RENAME COLUMN password_hash TO hashed_password;
    END IF;
END $$;

ALTER TABLE users
ALTER COLUMN hashed_password TYPE VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
ALTER COLUMN created_at SET DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);

COMMIT;