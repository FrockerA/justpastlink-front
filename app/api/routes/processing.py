from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services import video_service

router = APIRouter(prefix="/videos", tags=["Processing"])


@router.post("/{video_id}/process")
def process_video(video_id: int, db: Session = Depends(get_db)):
    return video_service.start_video_processing(video_id=video_id, db=db)


@router.get("/{video_id}/status")
def get_video_status(video_id: int, db: Session = Depends(get_db)):
    return video_service.get_video_status(video_id=video_id, db=db)
