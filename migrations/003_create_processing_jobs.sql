CREATE TABLE IF NOT EXISTS processing_jobs (
    id BIGSERIAL PRIMARY KEY,
    video_id BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_processing_jobs_type
        CHECK (job_type IN ('transcription', 'lecture_generation', 'quiz_generation')),

    CONSTRAINT chk_processing_jobs_status
        CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_video_id ON processing_jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_job_type ON processing_jobs(job_type);