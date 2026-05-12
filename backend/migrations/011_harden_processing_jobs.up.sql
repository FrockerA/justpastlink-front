ALTER TABLE processing_jobs
    ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50),
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS task_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS duration_ms BIGINT,
    ADD COLUMN IF NOT EXISTS error_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS stage_timings JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_processing_jobs_correlation_id
    ON processing_jobs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_task_id
    ON processing_jobs(task_id);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_current_stage
    ON processing_jobs(current_stage);
