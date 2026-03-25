CREATE TABLE IF NOT EXISTS quizzes (
    id BIGSERIAL PRIMARY KEY,
    video_id BIGINT NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
    questions TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_video_id ON quizzes(video_id);
