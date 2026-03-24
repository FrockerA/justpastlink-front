from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.video import VideoResponse
from app.services.processing_service import create_processing_job
from app.services.video_service import get_video_by_id, save_video

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/upload", response_model=VideoResponse)
def upload_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← добавили авторизацию
):
    try:
        video = save_video(db=db, file=file, user_id=current_user.id)  # ← передаём user_id
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    create_processing_job(db=db, video_id=video.id)
    db.refresh(video)
    return video


@router.get("/{video_id}", response_model=VideoResponse)
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← добавили авторизацию
):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Проверка, что видео принадлежит текущему пользователю
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    return video


@router.get("/", response_model=list[VideoResponse])
def list_my_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить все видео текущего пользователя."""
    from app.services.video_service import get_user_videos
    return get_user_videos(db=db, user_id=current_user.id)