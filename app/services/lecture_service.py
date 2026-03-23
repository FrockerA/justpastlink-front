from sqlalchemy.orm import Session

from app.models.lecture import Lecture


def create_lecture(db: Session, video_id: int, content: str, summary: str | None = None) -> Lecture:
    lecture = Lecture(video_id=video_id, content=content, summary=summary, status="ready")
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return lecture


def get_lecture_by_video_id(db: Session, video_id: int) -> Lecture | None:
    return db.query(Lecture).filter(Lecture.video_id == video_id).first()


def lecture_exists(db: Session, video_id: int) -> bool:
    return get_lecture_by_video_id(db, video_id) is not None
