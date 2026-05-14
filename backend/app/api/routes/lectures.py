from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.lecture import (
    LectureAskRequest,
    LectureAskResponse,
    LectureResponse,
    LectureUpdate,
)
from app.services.lecture_service import (
    answer_lecture_question,
    get_lecture_by_video_id,
    update_lecture,
)
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


@router.post("/{video_id}/ask", response_model=LectureAskResponse)
def ask_lecture(
    video_id: int,
    payload: LectureAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty")

    lecture = get_lecture_by_video_id(db=db, video_id=video_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture is not ready yet")

    answer, citations = answer_lecture_question(
        lecture_title=lecture.title,
        lecture_summary=lecture.summary,
        lecture_content=lecture.content,
        question=question,
    )

    return LectureAskResponse(answer=answer, citations=citations)


@router.put("/{video_id}", response_model=LectureResponse)
def update_video_lecture(
    video_id: int,
    payload: LectureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = get_video_by_id(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    lecture = update_lecture(
        db=db,
        video_id=video_id,
        title=payload.title,
        content=payload.content,
        summary=payload.summary,
        status=payload.status,
    )
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture is not ready yet")

    return lecture
