from threading import Lock
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.transcript import Transcript


_model = None
_model_lock = Lock()


def _get_model():
    """Load Whisper model once and reuse."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                import whisper

                _model = whisper.load_model("base")
    return _model


def transcribe_video(db: Session, video_id: int, file_path: str) -> Transcript:
    """Transcribe video file using local Whisper and save to DB."""
    source = Path(file_path)
    if not source.exists() or source.stat().st_size == 0:
        raise ValueError("Audio file is missing or empty")

    model = _get_model()
    result = model.transcribe(
        str(source),
        fp16=False,
        condition_on_previous_text=False,
    )

    full_text = result.get("text", "").strip()
    if not full_text:
        raise ValueError("Whisper did not detect any speech in this audio")

    language = result.get("language", None)

    # Upsert: update if exists, create if not
    transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
    if transcript:
        transcript.full_text = full_text
        transcript.language = language
    else:
        transcript = Transcript(
            video_id=video_id,
            full_text=full_text,
            language=language,
        )
        db.add(transcript)

    db.commit()
    db.refresh(transcript)
    return transcript


def get_transcript_by_video_id(db: Session, video_id: int) -> Transcript | None:
    return db.query(Transcript).filter(Transcript.video_id == video_id).first()
