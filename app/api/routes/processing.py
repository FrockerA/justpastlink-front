from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.processing import ProcessingJobResponse
from app.services.processing_service import get_processing_status
from app.services.video_service import get_video_by_id

router = APIRouter(prefix="/processing", tags=["Processing"])


@router.get("/{video_id}/status", response_model=ProcessingJobResponse)
def read_processing_status(video_id: int, db: Session = Depends(get_db)):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    job = get_processing_status(db=db, video_id=video_id)
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    return job
