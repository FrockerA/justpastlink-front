from __future__ import annotations

import json
import subprocess
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.video import Video
from app.services.storage_service import delete_media_file, store_media_file, upload_destination
from app.services.youtube_service import get_youtube_metadata

ALLOWED_MIME_TYPES = {
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
}

SUPPORTED_CODECS = {
    "aac",
    "av1",
    "h264",
    "h265",
    "hevc",
    "m4a",
    "mp3",
    "mpeg4",
    "opus",
    "pcm_s16le",
    "vorbis",
    "vp8",
    "vp9",
}


class VideoValidationError(ValueError):
    def __init__(self, message: str, code: str = "video_validation_failed") -> None:
        super().__init__(message)
        self.code = code


def _probe_media(path: Path) -> dict | None:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration:stream=codec_name,codec_type",
                "-of",
                "json",
                str(path),
            ],
            capture_output=True,
            check=True,
            text=True,
            timeout=20,
        )
    except (FileNotFoundError, subprocess.SubprocessError):
        if settings.require_ffprobe_validation:
            raise VideoValidationError(
                "Media validation is unavailable because ffprobe is not installed",
                "ffprobe_unavailable",
            )
        return None

    try:
        return json.loads(result.stdout or "{}")
    except json.JSONDecodeError as exc:
        raise VideoValidationError("Could not read media metadata", "media_metadata_invalid") from exc


def _validate_media_file(path: Path) -> int | None:
    if not path.exists() or path.stat().st_size == 0:
        raise VideoValidationError("Uploaded file is empty", "file_empty")
    if path.stat().st_size > settings.max_upload_bytes:
        raise VideoValidationError("File size must be less than 500MB", "file_too_large")

    metadata = _probe_media(path)
    if metadata is None:
        return None

    streams = metadata.get("streams") or []
    if not streams:
        raise VideoValidationError("No playable audio or video stream was found", "media_no_streams")

    codecs = {
        stream.get("codec_name")
        for stream in streams
        if stream.get("codec_type") in {"audio", "video"} and stream.get("codec_name")
    }
    unsupported = codecs - SUPPORTED_CODECS
    if unsupported:
        raise VideoValidationError(
            f"Unsupported media codec: {', '.join(sorted(unsupported))}",
            "media_codec_unsupported",
        )

    raw_duration = (metadata.get("format") or {}).get("duration")
    if raw_duration is None:
        return None

    try:
        duration_seconds = int(float(raw_duration))
    except (TypeError, ValueError):
        return None

    if duration_seconds > settings.max_video_duration_seconds:
        raise VideoValidationError("Video is too long for processing", "video_too_long")

    return duration_seconds


def _copy_upload_with_limit(file: UploadFile, destination: Path) -> int:
    total = 0
    with destination.open("wb") as buffer:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > settings.max_upload_bytes:
                raise VideoValidationError("File size must be less than 500MB", "file_too_large")
            buffer.write(chunk)
    return total


def save_video(db: Session, file: UploadFile, user_id: int) -> Video:
    if file is None or not file.filename:
        raise ValueError("Uploaded file is required")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise VideoValidationError(
            f"Invalid file type: {file.content_type}. "
            f"Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
            "file_mime_unsupported",
        )

    extension = Path(file.filename).suffix
    stored_filename = f"{uuid4().hex}{extension}"
    destination = upload_destination(stored_filename)
    saved_file_path: str | None = None

    try:
        file_size = _copy_upload_with_limit(file, destination)
        duration_seconds = _validate_media_file(destination)
        saved_file_path = store_media_file(destination, stored_filename)

        video = Video(
            user_id=user_id,
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_path=saved_file_path,
            file_size=file_size,
            mime_type=file.content_type,
            duration_seconds=duration_seconds,
            status="uploaded",
        )

        db.add(video)
        db.commit()
        db.refresh(video)
        return video

    except Exception:
        db.rollback()
        if saved_file_path:
            try:
                delete_media_file(saved_file_path)
            except Exception:
                pass
        elif destination.exists():
            destination.unlink()
        raise

    finally:
        if destination.exists() and settings.storage_backend != "local":
            destination.unlink()
        file.file.close()


def get_video_by_id(db: Session, video_id: int) -> Video | None:
    return db.query(Video).filter(Video.id == video_id).first()


def get_user_videos(db: Session, user_id: int) -> list[Video]:
    """Return all videos owned by a user."""
    return (
        db.query(Video)
        .filter(Video.user_id == user_id)
        .order_by(Video.created_at.desc(), Video.id.desc())
        .all()
    )


def delete_video(db: Session, video: Video) -> None:
    """Delete a video row and best-effort remove its stored media file."""
    file_path = video.file_path
    db.delete(video)
    db.commit()

    if file_path:
        try:
            delete_media_file(file_path)
        except Exception:
            pass


def save_youtube_video(db: Session, youtube_url: str, user_id: int) -> Video:
    if not youtube_url:
        raise ValueError("YouTube URL is required")

    metadata = get_youtube_metadata(youtube_url)
    stored_filename = f"youtube-{uuid4().hex}.url"

    try:
        video = Video(
            user_id=user_id,
            original_filename=metadata["title"],
            stored_filename=stored_filename,
            file_path=metadata["webpage_url"],
            file_size=None,
            mime_type="application/x.youtube-url",
            duration_seconds=metadata.get("duration_seconds"),
            status="uploaded",
        )

        db.add(video)
        db.commit()
        db.refresh(video)
        return video

    except Exception:
        db.rollback()
        raise
