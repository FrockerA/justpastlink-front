from threading import Thread

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.processing import ProcessingJobResponse, ProcessingStatusResponse, ProcessingJobItem
from app.services.pipeline_service import run_pipeline
from app.services.processing_service import create_processing_job, get_processing_status
from app.services.video_service import get_video_by_id
from app.services.transcription_service import get_transcript_by_video_id
from app.services.lecture_service import get_lecture_by_video_id
from app.services.quiz_service import get_quiz_by_video_id

router = APIRouter(prefix="/processing", tags=["Processing"])


@router.post("/{video_id}/start", response_model=ProcessingJobResponse)
def start_processing(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start the full pipeline (transcription -> lecture -> quiz) for a video."""
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    job = create_processing_job(db=db, video_id=video_id)
    Thread(
        target=run_pipeline,
        kwargs={"video_id": video_id, "file_path": video.file_path},
        daemon=True,
    ).start()
    return job


@router.get("/{video_id}/status", response_model=ProcessingStatusResponse)
def read_processing_status(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the aggregated processing status for a video."""
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    # Gather all processing jobs for this video
    from app.models.processing_job import ProcessingJob
    jobs = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.video_id == video_id)
        .order_by(ProcessingJob.created_at.desc())
        .all()
    )

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
    )
