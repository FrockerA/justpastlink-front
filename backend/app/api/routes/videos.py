from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.video import VideoResponse
from app.services.processing_service import create_processing_job
from app.services.task_queue import enqueue_job_if_needed
from app.services.video_service import delete_video, get_video_by_id, save_video, save_youtube_video

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/upload", response_model=VideoResponse)
def upload_video(
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file and not youtube_url:
        raise HTTPException(
            status_code=400,
            detail="Upload a file or paste a YouTube link",
        )

    try:
        if youtube_url:
            video = save_youtube_video(db=db, youtube_url=youtube_url, user_id=current_user.id)
        else:
            video = save_video(db=db, file=file, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Video upload failed: {str(exc)}") from exc

    job = create_processing_job(db=db, video_id=video.id)
    try:
        enqueue_job_if_needed(db=db, video=video, job=job)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    db.refresh(video)
    return video


@router.get("/{video_id}", response_model=VideoResponse)
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    return video


@router.get("", response_model=list[VideoResponse])
@router.get("/", response_model=list[VideoResponse], include_in_schema=False)
def list_my_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.video_service import get_user_videos

    return get_user_videos(db=db, user_id=current_user.id)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    delete_video(db=db, video=video)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
