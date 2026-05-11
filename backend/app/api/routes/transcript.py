from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.transcript import TranscriptResponse
from app.services.transcription_service import get_transcript_by_video_id
from app.services.video_service import get_video_by_id

router = APIRouter(prefix="/transcripts", tags=["Transcripts"])


@router.get("/{video_id}", response_model=TranscriptResponse)
def read_transcript(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    transcript = get_transcript_by_video_id(db=db, video_id=video_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript is not ready yet")

    return transcript