DROP INDEX IF EXISTS idx_processing_jobs_current_stage;
DROP INDEX IF EXISTS idx_processing_jobs_task_id;
DROP INDEX IF EXISTS idx_processing_jobs_correlation_id;

ALTER TABLE processing_jobs
    DROP COLUMN IF EXISTS stage_timings,
    DROP COLUMN IF EXISTS error_code,
    DROP COLUMN IF EXISTS duration_ms,
    DROP COLUMN IF EXISTS task_id,
    DROP COLUMN IF EXISTS correlation_id,
    DROP COLUMN IF EXISTS current_stage;
