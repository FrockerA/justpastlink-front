import whisper
from sqlalchemy.orm import Session

from app.models.transcript import Transcript


_model = None


def _get_model():
    """Load Whisper model once and reuse."""
    global _model
    if _model is None:
        _model = whisper.load_model("base")
    return _model


def transcribe_video(db: Session, video_id: int, file_path: str) -> Transcript:
    """Transcribe video file using local Whisper and save to DB."""
    model = _get_model()
    result = model.transcribe(file_path)

    full_text = result["text"].strip()
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