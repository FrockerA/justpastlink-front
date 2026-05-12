from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.processing_job import ProcessingJob
from app.models.video import Video
from app.services.processing_service import mark_job_enqueued, should_enqueue_processing_job


def enqueue_video_pipeline(video: Video, job: ProcessingJob) -> str | None:
    if not should_enqueue_processing_job(job):
        return job.task_id

    try:
        from app.tasks.video_pipeline import process_video_pipeline
    except ImportError as exc:
        raise RuntimeError(
            "Celery is not installed. Install backend requirements and run a Celery worker."
        ) from exc

    correlation_id = job.correlation_id or f"video-{video.id}-{uuid4().hex[:12]}"
    try:
        result = process_video_pipeline.apply_async(
            args=[video.id, video.file_path, job.id, correlation_id],
            queue=settings.processing_queue_name,
        )
    except Exception as exc:
        raise RuntimeError("Could not enqueue processing job. Check Redis and Celery.") from exc
    return result.id


def enqueue_job_if_needed(db: Session, video: Video, job: ProcessingJob) -> ProcessingJob:
    if not job.correlation_id:
        job.correlation_id = f"video-{video.id}-{uuid4().hex[:12]}"
        db.add(job)
        db.commit()
        db.refresh(job)

    task_id = enqueue_video_pipeline(video=video, job=job)
    if task_id and task_id != job.task_id:
        refreshed = mark_job_enqueued(db, job.id, task_id)
        if refreshed:
            return refreshed
    return job
