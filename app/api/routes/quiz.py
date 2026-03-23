from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.quiz import QuizResponse
from app.services.quiz_service import get_quiz_by_video_id
from app.services.video_service import get_video_by_id

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.get("/{video_id}", response_model=QuizResponse)
def read_quiz(video_id: int, db: Session = Depends(get_db)):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    quiz = get_quiz_by_video_id(db=db, video_id=video_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz is not ready yet")

    return quiz
