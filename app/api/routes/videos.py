from typing import Optional
from threading import Thread

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.video import VideoResponse
from app.services.pipeline_service import run_pipeline
from app.services.processing_service import create_processing_job
from app.services.video_service import delete_video, get_video_by_id, save_video, save_youtube_video

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/upload", response_model=VideoResponse)
def upload_video(
        # ↓ СДЕЛАЛИ file НЕОБЯЗАТЕЛЬНЫМ И ДОБАВИЛИ youtube_url ↓
        file: Optional[UploadFile] = File(None),
        youtube_url: Optional[str] = Form(None),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    # Проверка: юзер должен дать либо файл, либо ссылку
    if not file and not youtube_url:
        raise HTTPException(
            status_code=400,
            detail="Пожалуйста, загрузите файл или укажите ссылку на YouTube"
        )

    try:
        if youtube_url:
            # Сценарий 1: Обрабатываем ссылку с ютуба
            video = save_youtube_video(db=db, youtube_url=youtube_url, user_id=current_user.id)
        else:
            # Сценарий 2: Обрабатываем обычный файл (твой старый надежный код)
            video = save_video(db=db, file=file, user_id=current_user.id)

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        # Ловим непредвиденные ошибки yt-dlp или сети
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка обработки: {str(exc)}") from exc

    create_processing_job(db=db, video_id=video.id)
    Thread(
        target=run_pipeline,
        kwargs={"video_id": video.id, "file_path": video.file_path},
        daemon=True,
    ).start()
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
