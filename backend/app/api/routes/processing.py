from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.processing_job import ProcessingJob
from app.models.user import User
from app.schemas.processing import (
    ProcessingDiagnosticsResponse,
    ProcessingJobItem,
    ProcessingJobResponse,
    ProcessingStatusResponse,
)
from app.services.lecture_service import get_lecture_by_video_id
from app.services.processing_service import (
    PIPELINE_STAGES,
    create_processing_job,
    estimate_processing_eta_seconds,
    get_progress_percent,
    get_stage_index,
)
from app.services.quiz_service import get_quiz_by_video_id
from app.services.task_queue import enqueue_job_if_needed
from app.services.transcription_service import get_transcript_by_video_id
from app.services.video_service import get_video_by_id

router = APIRouter(prefix="/processing", tags=["Processing"])


def _get_owned_video(db: Session, video_id: int, current_user: User):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")
    return video


def _jobs_for_video(db: Session, video_id: int) -> list[ProcessingJob]:
    return (
        db.query(ProcessingJob)
        .filter(ProcessingJob.video_id == video_id)
        .order_by(ProcessingJob.created_at.desc(), ProcessingJob.id.desc())
        .all()
    )


@router.post("/{video_id}/start", response_model=ProcessingJobResponse)
def start_processing(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start the full pipeline for a video."""
    video = _get_owned_video(db, video_id, current_user)

    job = create_processing_job(db=db, video_id=video_id)
    try:
        job = enqueue_job_if_needed(db=db, video=video, job=job)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return job


@router.get("/{video_id}/status", response_model=ProcessingStatusResponse)
def read_processing_status(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the aggregated processing status for a video."""
    video = _get_owned_video(db, video_id, current_user)
    jobs = _jobs_for_video(db, video_id)
    latest_job = jobs[0] if jobs else None

    transcript_ready = get_transcript_by_video_id(db=db, video_id=video_id) is not None
    lecture_ready = get_lecture_by_video_id(db=db, video_id=video_id) is not None
    quiz_ready = get_quiz_by_video_id(db=db, video_id=video_id) is not None

    return ProcessingStatusResponse(
        video_id=video_id,
        video_status=video.status,
        jobs=[ProcessingJobItem.model_validate(j) for j in jobs],
        transcript_ready=transcript_ready,
        lecture_ready=lecture_ready,
        quiz_ready=quiz_ready,
        current_stage=latest_job.current_stage if latest_job else None,
        stage_index=get_stage_index(latest_job),
        stage_count=len(PIPELINE_STAGES),
        progress_percent=get_progress_percent(latest_job),
        eta_seconds=estimate_processing_eta_seconds(db, latest_job),
        latest_error_code=latest_job.error_code if latest_job else None,
    )


@router.get("/{video_id}/diagnostics", response_model=ProcessingDiagnosticsResponse)
def read_processing_diagnostics(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detailed job diagnostics for support/admin UI."""
    video = _get_owned_video(db, video_id, current_user)
    jobs = _jobs_for_video(db, video_id)
    latest_job = jobs[0] if jobs else None

    return ProcessingDiagnosticsResponse(
        video_id=video.id,
        video_status=video.status,
        latest_job=ProcessingJobItem.model_validate(latest_job) if latest_job else None,
        jobs=[ProcessingJobItem.model_validate(j) for j in jobs],
        stage_order=list(PIPELINE_STAGES),
        progress_percent=get_progress_percent(latest_job),
        eta_seconds=estimate_processing_eta_seconds(db, latest_job),
    )
