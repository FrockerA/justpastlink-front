CREATE TABLE IF NOT EXISTS lectures (
    id BIGSERIAL PRIMARY KEY,
    video_id BIGINT NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    summary TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_lectures_status
        CHECK (status IN ('draft', 'generated', 'published'))
);

CREATE INDEX IF NOT EXISTS idx_lectures_status ON lectures(status);