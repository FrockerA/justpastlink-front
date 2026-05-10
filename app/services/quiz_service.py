import json

from sqlalchemy.orm import Session

from app.models.quiz import Quiz
from app.services.qwen_client import call_qwen_json


QUIZ_SYSTEM_PROMPT = """You are an expert educator creating multiple choice quiz questions.
Given a lecture text, generate exactly 5 quiz questions in the same language as the lecture.

Respond ONLY with a valid JSON array. No explanation, no markdown, no extra text.
Each item in the array must have these fields:
{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_answer": "A" | "B" | "C" | "D",
  "explanation": "..."
}
"""


def generate_quiz(db: Session, video_id: int, lecture_text: str) -> Quiz:
    """Generate quiz questions from lecture using Qwen and save to DB."""
    questions_data = call_qwen_json(
        system_prompt=QUIZ_SYSTEM_PROMPT,
        user_prompt=f"Lecture:\n{lecture_text}",
    )

    normalized = json.dumps(questions_data, ensure_ascii=False)

    quiz = db.query(Quiz).filter(Quiz.video_id == video_id).first()
    if quiz:
        quiz.questions = normalized
    else:
        quiz = Quiz(video_id=video_id, questions=normalized)
        db.add(quiz)

    db.commit()
    db.refresh(quiz)
    return quiz


def create_quiz(db: Session, video_id: int, questions: list[str] | str) -> Quiz:
    """Manually create or update a quiz (for testing / admin use)."""
    normalized = questions if isinstance(questions, str) else json.dumps(questions, ensure_ascii=False)

    quiz = db.query(Quiz).filter(Quiz.video_id == video_id).first()
    if quiz:
        quiz.questions = normalized
    else:
        quiz = Quiz(video_id=video_id, questions=normalized)
        db.add(quiz)

    db.commit()
    db.refresh(quiz)
    return quiz


def get_quiz_by_video_id(db: Session, video_id: int) -> Quiz | None:
    return db.query(Quiz).filter(Quiz.video_id == video_id).first()


def quiz_exists(db: Session, video_id: int) -> bool:
    return get_quiz_by_video_id(db, video_id) is not None