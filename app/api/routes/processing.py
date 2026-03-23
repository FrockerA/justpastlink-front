from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.processing import ProcessingJobResponse
from app.services.pipeline_service import run_pipeline
from app.services.processing_service import create_processing_job, get_processing_status
from app.services.video_service import get_video_by_id

router = APIRouter(prefix="/processing", tags=["Processing"])


@router.post("/{video_id}/start", response_model=ProcessingJobResponse)
def start_processing(
    video_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Start the full pipeline (transcription -> lecture -> quiz) for a video."""
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    job = create_processing_job(db=db, video_id=video_id)

    # Run pipeline in background so the response returns immediately
    background_tasks.add_task(run_pipeline, db=db, video_id=video_id, file_path=video.file_path)

    return job


@router.get("/{video_id}/status", response_model=ProcessingJobResponse)
def read_processing_status(video_id: int, db: Session = Depends(get_db)):
    """Get the current processing status for a video."""
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    job = get_processing_status(db=db, video_id=video_id)
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    return job