import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.video import Video
from app.services.youtube_service import download_youtube_audio

UPLOAD_DIR = Path("uploads")

# Разрешённые MIME типы для видео
ALLOWED_MIME_TYPES = {
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",  # .mkv
    "video/webm",
}


def save_video(db: Session, file: UploadFile, user_id: int) -> Video:  # ← добавили user_id
    if file is None or not file.filename:
        raise ValueError("Uploaded file is required")

    # Валидация MIME типа
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(
            f"Invalid file type: {file.content_type}. "
            f"Allowed types: {', '.join(ALLOWED_MIME_TYPES)}"
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    extension = Path(file.filename).suffix
    stored_filename = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / stored_filename

    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        video = Video(
            user_id=user_id,  # ← устанавливаем user_id
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_path=str(destination),
            file_size=destination.stat().st_size,
            mime_type=file.content_type,
            status="uploaded",
        )

        db.add(video)
        db.commit()
        db.refresh(video)
        return video

    except Exception:
        db.rollback()
        if destination.exists():
            destination.unlink()
        raise

    finally:
        file.file.close()


def get_video_by_id(db: Session, video_id: int) -> Video | None:
    return db.query(Video).filter(Video.id == video_id).first()


def get_user_videos(db: Session, user_id: int) -> list[Video]:
    """Получить все видео пользователя."""
    return (
        db.query(Video)
        .filter(Video.user_id == user_id)
        .order_by(Video.created_at.desc(), Video.id.desc())
        .all()
    )


def delete_video(db: Session, video: Video) -> None:
    """Delete a video row and best-effort remove its stored media file."""
    file_path = Path(video.file_path) if video.file_path else None
    db.delete(video)
    db.commit()

    if file_path and file_path.exists():
        try:
            file_path.unlink()
        except OSError:
            pass


def save_youtube_video(db: Session, youtube_url: str, user_id: int) -> Video:
    """
    Сохраняет видео из YouTube.
    Использует ту же папку UPLOAD_DIR, что и save_video.
    """
    if not youtube_url:
        raise ValueError("YouTube URL is required")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    try:
        # Скачиваем аудио
        yt_data = download_youtube_audio(youtube_url, str(UPLOAD_DIR))

        # Создаем запись в БД точно так же, как в save_video
        video = Video(
            user_id=user_id,
            original_filename=yt_data["original_filename"],
            stored_filename=yt_data["stored_filename"],
            file_path=yt_data["file_path"],
            file_size=yt_data["file_size"],
            mime_type=yt_data["mime_type"],
            status="uploaded",
        )

        db.add(video)
        db.commit()
        db.refresh(video)
        return video

    except Exception:
        db.rollback()
        raise
