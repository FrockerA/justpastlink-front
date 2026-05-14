from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Callable, TypeVar

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.processing_job import ProcessingJob
from app.models.video import Video
from app.services.lecture_service import generate_lecture, get_lecture_by_video_id
from app.services.processing_service import (
    mark_job_started,
    mark_processing_completed,
    mark_processing_failed,
    mark_stage_completed,
    mark_stage_failed,
    mark_stage_retry,
    mark_stage_started,
    get_processing_job_by_id,
    get_processing_status,
)
from app.services.quiz_service import generate_quiz, get_quiz_by_video_id
from app.services.storage_service import (
    materialize_media_file,
    media_upload_dir,
    store_media_file,
    temp_media_dir,
)
from app.services.transcription_service import get_transcript_by_video_id, transcribe_video
from app.services.youtube_service import download_youtube_audio, is_youtube_url

logger = logging.getLogger(__name__)

T = TypeVar("T")


def _error_code(stage: str, exc: Exception) -> str:
    explicit_code = getattr(exc, "code", None)
    if isinstance(explicit_code, str) and explicit_code:
        return explicit_code

    message = str(exc).lower()
    if "timeout" in message or "timed out" in message:
        return f"{stage}_timeout"
    if "private" in message:
        return "youtube_private"
    if "region" in message or "geo" in message or "blocked" in message:
        return "youtube_region_blocked"
    if "too long" in message or "duration" in message:
        return f"{stage}_too_long"
    if "json" in message:
        return f"{stage}_invalid_response"
    if isinstance(exc, ValueError):
        return f"{stage}_validation_failed"
    return f"{stage}_failed"


def _stage_backoff(attempt: int) -> float:
    raw = settings.processing_stage_backoff_seconds * (2 ** max(0, attempt - 1))
    return min(raw, settings.processing_stage_backoff_max_seconds)


def _log_extra(job: ProcessingJob, stage: str | None = None) -> dict[str, object]:
    extra: dict[str, object] = {
        "correlation_id": job.correlation_id,
        "video_id": job.video_id,
        "job_id": job.id,
    }
    if stage:
        extra["stage"] = stage
    return extra


def _run_stage(
    db,
    job: ProcessingJob,
    stage: str,
    operation: Callable[[], T],
) -> tuple[T, ProcessingJob]:
    max_attempts = max(1, settings.processing_stage_max_attempts)

    for attempt in range(1, max_attempts + 1):
        job = mark_stage_started(db, job, stage, attempt)
        logger.info("processing stage started", extra=_log_extra(job, stage))

        try:
            result = operation()
        except Exception as exc:
            db.rollback()
            refreshed = get_processing_job_by_id(db, job.id)
            if refreshed:
                job = refreshed

            code = _error_code(stage, exc)
            message = str(exc)

            if attempt < max_attempts:
                job = mark_stage_retry(db, job, stage, attempt, code, message)
                logger.warning(
                    "processing stage failed; retrying",
                    extra={**_log_extra(job, stage), "error_code": code},
                    exc_info=True,
                )
                time.sleep(_stage_backoff(attempt))
                continue

            job = mark_stage_failed(db, job, stage, code, message)
            logger.exception(
                "processing stage failed permanently",
                extra={**_log_extra(job, stage), "error_code": code},
            )
            raise

        job = mark_stage_completed(db, job, stage)
        logger.info("processing stage completed", extra=_log_extra(job, stage))
        return result, job

    raise RuntimeError(f"Stage {stage} exhausted retries")


def _prepare_source(db, video_id: int, file_path: str) -> str:
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise ValueError("Video not found")

    source = video.file_path or file_path
    if is_youtube_url(source):
        output_dir = temp_media_dir() if settings.storage_backend == "s3" else media_upload_dir()
        yt_data = download_youtube_audio(source, str(output_dir))
        local_path = Path(yt_data["file_path"])
        stored_path = store_media_file(local_path, yt_data["stored_filename"])
        video.original_filename = yt_data["original_filename"]
        video.stored_filename = yt_data["stored_filename"]
        video.file_path = stored_path
        video.file_size = yt_data["file_size"]
        video.mime_type = yt_data["mime_type"]
        video.duration_seconds = yt_data.get("duration_seconds")
        db.add(video)
        db.commit()
        db.refresh(video)
        return str(local_path)

    local_path = materialize_media_file(source, stored_filename=video.stored_filename)
    if not local_path.exists() or local_path.stat().st_size == 0:
        raise ValueError("Media file is missing or empty")
    return str(local_path)


def _job_for_pipeline(db, video_id: int, job_id: int | None) -> ProcessingJob:
    job = get_processing_job_by_id(db, job_id) if job_id else get_processing_status(db, video_id)
    if not job:
        raise ValueError("Processing job not found")
    return job


def run_pipeline(
    video_id: int,
    file_path: str,
    job_id: int | None = None,
    correlation_id: str | None = None,
) -> None:
    """
    Full processing pipeline:
    1. Download/prepare source
    2. Transcribe media
    3. Generate lecture
    4. Generate quiz
    """
    db = SessionLocal()
    job: ProcessingJob | None = None
    current_stage: str | None = None

    try:
        job = _job_for_pipeline(db, video_id, job_id)
        if correlation_id and not job.correlation_id:
            job.correlation_id = correlation_id
            db.add(job)
            db.commit()
            db.refresh(job)

        if job.status == "completed":
            logger.info("pipeline already completed", extra=_log_extra(job))
            return

        job = mark_job_started(db, job)
        logger.info("video pipeline started", extra=_log_extra(job))

        current_stage = "download"
        prepared_path, job = _run_stage(
            db,
            job,
            current_stage,
            lambda: _prepare_source(db, video_id, file_path),
        )

        current_stage = "transcribe"
        transcript, job = _run_stage(
            db,
            job,
            current_stage,
            lambda: get_transcript_by_video_id(db, video_id)
            or transcribe_video(db=db, video_id=video_id, file_path=prepared_path),
        )

        current_stage = "summarize"
        lecture, job = _run_stage(
            db,
            job,
            current_stage,
            lambda: get_lecture_by_video_id(db, video_id)
            or generate_lecture(db=db, video_id=video_id, transcript_text=transcript.full_text),
        )

        current_stage = "quiz"
        _quiz, job = _run_stage(
            db,
            job,
            current_stage,
            lambda: get_quiz_by_video_id(db, video_id)
            or generate_quiz(db=db, video_id=video_id, lecture_text=lecture.content),
        )

        mark_processing_completed(db, video_id, job_id=job.id)
        logger.info("video pipeline completed", extra=_log_extra(job))

    except Exception as exc:
        db.rollback()
        if job is not None and job.status != "failed":
            code = _error_code(current_stage or "pipeline", exc)
            mark_processing_failed(
                db,
                video_id,
                error_message=str(exc),
                error_code=code,
                stage=current_stage,
                job_id=job.id,
            )
        logger.exception(
            "video pipeline failed",
            extra={
                "correlation_id": getattr(job, "correlation_id", correlation_id),
                "video_id": video_id,
                "job_id": getattr(job, "id", job_id),
                "stage": current_stage,
            },
        )
        raise
    finally:
        db.close()
