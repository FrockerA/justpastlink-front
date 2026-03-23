from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services import video_service

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/upload")
def upload_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return video_service.upload_video(file=file, db=db)


@router.get("")
def list_videos(db: Session = Depends(get_db)):
    return video_service.list_videos(db=db)


@router.get("/{video_id}")
def get_video(video_id: int, db: Session = Depends(get_db)):
    return video_service.get_video(video_id=video_id, db=db)


@router.get("/{video_id}/lecture")
def get_video_lecture(video_id: int, db: Session = Depends(get_db)):
    return video_service.get_video_lecture(video_id=video_id, db=db)


@router.get("/{video_id}/quiz")
def get_video_quiz(video_id: int, db: Session = Depends(get_db)):
    return video_service.get_video_quiz(video_id=video_id, db=db)
