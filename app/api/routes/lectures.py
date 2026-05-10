from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.lecture import LectureResponse
from app.services.lecture_service import get_lecture_by_video_id
from app.services.video_service import get_video_by_id

router = APIRouter(prefix="/lectures", tags=["Lectures"])


@router.get("/{video_id}", response_model=LectureResponse)
def read_lecture(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← добавили авторизацию
):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Проверка владельца
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    lecture = get_lecture_by_video_id(db=db, video_id=video_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture is not ready yet")

    return lecture