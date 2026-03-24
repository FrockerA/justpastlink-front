from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.processing_job import ProcessingJob
from app.models.video import Video


VALID_PROCESSING_STATUSES = {
    "uploaded",
    "queued",
    "processing",
    "generating_lecture",
    "generating_quiz",
    "completed",
    "failed",
}

ACTIVE_PROCESSING_STATUSES = {"queued", "processing", "generating_lecture", "generating_quiz"}


def create_processing_job(db: Session, video_id: int) -> ProcessingJob:
    existing_active = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.video_id == video_id, ProcessingJob.status.in_(ACTIVE_PROCESSING_STATUSES))
        .order_by(desc(ProcessingJob.created_at))
        .first()
    )
    if existing_active:
        return existing_active

    job = ProcessingJob(video_id=video_id, job_type="video_pipeline", status="queued")
    db.add(job)

    video = db.query(Video).filter(Video.id == video_id).first()
    if video:
        video.status = "queued"
        db.add(video)

    db.commit()
    db.refresh(job)
    return job


def get_processing_status(db: Session, video_id: int) -> ProcessingJob | None:
    return (
        db.query(ProcessingJob)
        .filter(ProcessingJob.video_id == video_id)
        .order_by(ProcessingJob.created_at.desc())
        .first()
    )


def update_processing_status(db: Session, video_id: int, new_status: str) -> ProcessingJob | None:
    if new_status not in VALID_PROCESSING_STATUSES:
        raise ValueError(f"Invalid processing status: {new_status}")

    job = get_processing_status(db, video_id)
    if not job:
        return None

    job.status = new_status
    if new_status == "processing" and not job.started_at:
        job.started_at = datetime.now(timezone.utc)

    video = db.query(Video).filter(Video.id == video_id).first()
    if video:
        video.status = new_status
        db.add(video)

    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_processing_failed(db: Session, video_id: int, error_message: str) -> ProcessingJob | None:
    job = get_processing_status(db, video_id)
    if not job:
        return None

    job.status = "failed"
    job.error_message = error_message
    job.finished_at = datetime.now(timezone.utc)

    video = db.query(Video).filter(Video.id == video_id).first()
    if video:
        video.status = "failed"
        db.add(video)

    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_processing_completed(db: Session, video_id: int) -> ProcessingJob | None:
    job = get_processing_status(db, video_id)
    if not job:
        return None

    job.status = "completed"
    job.finished_at = datetime.now(timezone.utc)

    video = db.query(Video).filter(Video.id == video_id).first()
    if video:
        video.status = "completed"
        db.add(video)

    db.add(job)
    db.commit()
    db.refresh(job)
    return job
