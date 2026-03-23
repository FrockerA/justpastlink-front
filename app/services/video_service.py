import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.video import Video

UPLOAD_DIR = Path("uploads")


def save_video(db: Session, file: UploadFile) -> Video:
    if file is None or not file.filename:
        raise ValueError("Uploaded file is required")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    extension = Path(file.filename).suffix
    stored_filename = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / stored_filename

    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        video = Video(
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