from __future__ import annotations

from datetime import datetime, timezone
from statistics import median
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.processing_job import ProcessingJob
from app.models.video import Video


PIPELINE_STAGES = ("download", "transcribe", "summarize", "quiz")

STAGE_TO_VIDEO_STATUS = {
    "download": "processing",
    "transcribe": "processing",
    "summarize": "generating_lecture",
    "quiz": "generating_quiz",
}

DEFAULT_STAGE_SECONDS = {
    "download": 45,
    "transcribe": 180,
    "summarize": 90,
    "quiz": 45,
}

VALID_PROCESSING_STATUSES = {
    "pending",
    "queued",
    "processing",
    "generating_lecture",
    "generating_quiz",
    "completed",
    "failed",
}

ACTIVE_PROCESSING_STATUSES = {
    "pending",
    "queued",
    "processing",
    "generating_lecture",
    "generating_quiz",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _duration_ms(started_at: datetime | None, finished_at: datetime | None) -> int | None:
    if not started_at or not finished_at:
        return None
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    if finished_at.tzinfo is None:
        finished_at = finished_at.replace(tzinfo=timezone.utc)
    return max(0, int((finished_at - started_at).total_seconds() * 1000))


def _stage_timings(job: ProcessingJob) -> dict[str, dict[str, Any]]:
    raw = job.stage_timings if isinstance(job.stage_timings, dict) else {}
    return {
        str(stage): dict(value)
        for stage, value in raw.items()
        if isinstance(value, dict)
    }


def _set_video_status(db: Session, video_id: int, status: str) -> None:
    video = db.query(Video).filter(Video.id == video_id).first()
    if video:
        video.status = status
        db.add(video)


def get_processing_job_by_id(db: Session, job_id: int) -> ProcessingJob | None:
    return db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()


def get_processing_status(db: Session, video_id: int) -> ProcessingJob | None:
    return (
        db.query(ProcessingJob)
        .filter(ProcessingJob.video_id == video_id)
        .order_by(ProcessingJob.created_at.desc(), ProcessingJob.id.desc())
        .first()
    )


def create_processing_job(db: Session, video_id: int) -> ProcessingJob:
    """Create a pipeline job unless a restart would duplicate active or completed work."""
    latest = get_processing_status(db, video_id)
    if latest and latest.status in ACTIVE_PROCESSING_STATUSES:
        return latest
    if latest and latest.status == "completed":
        return latest

    job = ProcessingJob(
        video_id=video_id,
        job_type="video_pipeline",
        status="queued",
        correlation_id=f"video-{video_id}-{uuid4().hex[:12]}",
        stage_timings={},
    )
    db.add(job)
    _set_video_status(db, video_id, "queued")

    db.commit()
    db.refresh(job)
    return job


def should_enqueue_processing_job(job: ProcessingJob) -> bool:
    return job.status == "queued" and not job.task_id


def mark_job_enqueued(db: Session, job_id: int, task_id: str) -> ProcessingJob | None:
    job = get_processing_job_by_id(db, job_id)
    if not job:
        return None
    job.task_id = task_id
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_job_started(db: Session, job: ProcessingJob) -> ProcessingJob:
    if job.started_at is None:
        job.started_at = _now()
    job.status = "processing"
    db.add(job)
    _set_video_status(db, job.video_id, "processing")
    db.commit()
    db.refresh(job)
    return job


def mark_stage_started(
    db: Session,
    job: ProcessingJob,
    stage: str,
    attempt: int,
) -> ProcessingJob:
    if stage not in PIPELINE_STAGES:
        raise ValueError(f"Invalid processing stage: {stage}")

    started_at = _now()
    stages = _stage_timings(job)
    previous = stages.get(stage, {})
    stages[stage] = {
        **previous,
        "status": "processing",
        "started_at": started_at.isoformat(),
        "finished_at": None,
        "duration_ms": None,
        "error_code": None,
        "error_message": None,
        "attempts": attempt,
    }

    job.current_stage = stage
    job.stage_timings = stages
    job.status = STAGE_TO_VIDEO_STATUS[stage]
    if job.started_at is None:
        job.started_at = started_at

    db.add(job)
    _set_video_status(db, job.video_id, STAGE_TO_VIDEO_STATUS[stage])
    db.commit()
    db.refresh(job)
    return job


def mark_stage_retry(
    db: Session,
    job: ProcessingJob,
    stage: str,
    attempt: int,
    error_code: str,
    error_message: str,
) -> ProcessingJob:
    stages = _stage_timings(job)
    previous = stages.get(stage, {})
    stages[stage] = {
        **previous,
        "status": "retrying",
        "attempts": attempt,
        "error_code": error_code,
        "error_message": error_message,
    }
    job.current_stage = stage
    job.stage_timings = stages
    job.error_code = error_code
    job.error_message = error_message

    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_stage_completed(db: Session, job: ProcessingJob, stage: str) -> ProcessingJob:
    finished_at = _now()
    stages = _stage_timings(job)
    previous = stages.get(stage, {})
    started_at = _parse_datetime(previous.get("started_at"))
    stages[stage] = {
        **previous,
        "status": "completed",
        "finished_at": finished_at.isoformat(),
        "duration_ms": _duration_ms(started_at, finished_at),
        "error_code": None,
        "error_message": None,
    }
    job.stage_timings = stages
    job.error_code = None
    job.error_message = None

    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_stage_failed(
    db: Session,
    job: ProcessingJob,
    stage: str,
    error_code: str,
    error_message: str,
) -> ProcessingJob:
    finished_at = _now()
    stages = _stage_timings(job)
    previous = stages.get(stage, {})
    started_at = _parse_datetime(previous.get("started_at"))
    stages[stage] = {
        **previous,
        "status": "failed",
        "finished_at": finished_at.isoformat(),
        "duration_ms": _duration_ms(started_at, finished_at),
        "error_code": error_code,
        "error_message": error_message,
    }
    job.current_stage = stage
    job.stage_timings = stages
    job.status = "failed"
    job.error_code = error_code
    job.error_message = error_message
    job.finished_at = finished_at
    job.duration_ms = _duration_ms(job.started_at, finished_at)

    db.add(job)
    _set_video_status(db, job.video_id, "failed")
    db.commit()
    db.refresh(job)
    return job


def update_processing_status(db: Session, video_id: int, new_status: str) -> ProcessingJob | None:
    if new_status not in VALID_PROCESSING_STATUSES:
        raise ValueError(f"Invalid processing status: {new_status}")

    job = get_processing_status(db, video_id)
    if not job:
        return None

    if new_status in ACTIVE_PROCESSING_STATUSES and job.started_at is None:
        job.started_at = _now()
    job.status = new_status

    _set_video_status(db, video_id, new_status)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_processing_failed(
    db: Session,
    video_id: int,
    error_message: str,
    error_code: str = "pipeline_failed",
    stage: str | None = None,
    job_id: int | None = None,
) -> ProcessingJob | None:
    job = get_processing_job_by_id(db, job_id) if job_id else get_processing_status(db, video_id)
    if not job:
        return None

    if stage:
        return mark_stage_failed(db, job, stage, error_code, error_message)

    finished_at = _now()
    job.status = "failed"
    job.error_code = error_code
    job.error_message = error_message
    job.finished_at = finished_at
    job.duration_ms = _duration_ms(job.started_at, finished_at)

    _set_video_status(db, video_id, "failed")
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_processing_completed(
    db: Session,
    video_id: int,
    job_id: int | None = None,
) -> ProcessingJob | None:
    job = get_processing_job_by_id(db, job_id) if job_id else get_processing_status(db, video_id)
    if not job:
        return None

    finished_at = _now()
    job.status = "completed"
    job.current_stage = None
    job.finished_at = finished_at
    job.duration_ms = _duration_ms(job.started_at, finished_at)
    job.error_code = None
    job.error_message = None

    _set_video_status(db, video_id, "completed")
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_stage_index(job: ProcessingJob | None) -> int:
    if not job:
        return 0
    if job.status == "completed":
        return len(PIPELINE_STAGES)
    if job.current_stage in PIPELINE_STAGES:
        return PIPELINE_STAGES.index(job.current_stage) + 1
    return 0


def get_progress_percent(job: ProcessingJob | None) -> int:
    if not job:
        return 0
    if job.status == "completed":
        return 100
    if job.status == "failed":
        return 0

    stages = _stage_timings(job)
    completed = sum(
        1
        for stage in PIPELINE_STAGES
        if stages.get(stage, {}).get("status") == "completed"
    )
    if job.current_stage in PIPELINE_STAGES:
        completed += 0.5
    return min(99, round((completed / len(PIPELINE_STAGES)) * 100))


def _completed_jobs_for_eta(db: Session) -> list[ProcessingJob]:
    return (
        db.query(ProcessingJob)
        .filter(
            ProcessingJob.job_type == "video_pipeline",
            ProcessingJob.status == "completed",
            ProcessingJob.stage_timings.isnot(None),
        )
        .order_by(ProcessingJob.finished_at.desc(), ProcessingJob.id.desc())
        .limit(100)
        .all()
    )


def _historical_stage_seconds(db: Session) -> dict[str, float]:
    buckets: dict[str, list[float]] = {stage: [] for stage in PIPELINE_STAGES}
    for job in _completed_jobs_for_eta(db):
        stages = _stage_timings(job)
        for stage in PIPELINE_STAGES:
            duration_ms = stages.get(stage, {}).get("duration_ms")
            if isinstance(duration_ms, (int, float)) and duration_ms > 0:
                buckets[stage].append(duration_ms / 1000)

    return {
        stage: float(median(values)) if values else float(DEFAULT_STAGE_SECONDS[stage])
        for stage, values in buckets.items()
    }


def estimate_processing_eta_seconds(db: Session, job: ProcessingJob | None) -> int | None:
    if not job or job.status not in ACTIVE_PROCESSING_STATUSES:
        return None

    medians = _historical_stage_seconds(db)
    current_index = get_stage_index(job)
    if current_index <= 0:
        remaining_stages = list(PIPELINE_STAGES)
    else:
        remaining_stages = list(PIPELINE_STAGES[current_index - 1 :])

    eta = 0.0
    now = _now()
    stages = _stage_timings(job)
    for stage in remaining_stages:
        stage_eta = medians[stage]
        if stage == job.current_stage:
            started_at = _parse_datetime(stages.get(stage, {}).get("started_at"))
            if started_at:
                elapsed = (now - started_at).total_seconds()
                stage_eta = max(0.0, stage_eta - elapsed)
        eta += stage_eta

    return max(1, int(round(eta)))
