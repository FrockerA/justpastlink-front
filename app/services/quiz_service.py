import json

from sqlalchemy.orm import Session

from app.models.quiz import Quiz


def create_quiz(db: Session, video_id: int, questions: list[str] | str) -> Quiz:
    normalized_questions = questions
    if isinstance(questions, list):
        normalized_questions = json.dumps(questions, ensure_ascii=False)

    quiz = db.query(Quiz).filter(Quiz.video_id == video_id).first()
    if quiz:
        quiz.questions = normalized_questions
    else:
        quiz = Quiz(video_id=video_id, questions=normalized_questions)

    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def get_quiz_by_video_id(db: Session, video_id: int) -> Quiz | None:
    return db.query(Quiz).filter(Quiz.video_id == video_id).first()


def quiz_exists(db: Session, video_id: int) -> bool:
    return get_quiz_by_video_id(db, video_id) is not None
