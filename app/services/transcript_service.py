"""Transcript service compatibility layer.

This module keeps transcript-related operations in one place and delegates
speech-to-text work to ``transcription_service``.
"""

from sqlalchemy.orm import Session

from app.models.transcript import Transcript
from app.services.transcription_service import transcribe_video as _transcribe_video


def transcribe_video(db: Session, video_id: int, file_path: str) -> Transcript:
    return _transcribe_video(db=db, video_id=video_id, file_path=file_path)


def get_transcript_by_video_id(db: Session, video_id: int) -> Transcript | None:
    return db.query(Transcript).filter(Transcript.video_id == video_id).first()