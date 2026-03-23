from datetime import datetime
from pydantic import BaseModel, ConfigDict


class QuizQuestionCreate(BaseModel):
    lecture_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str | None = None
    option_d: str | None = None
    correct_answer: str
    explanation: str | None = None
    question_order: int


class QuizQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lecture_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str | None = None
    option_d: str | None = None
    correct_answer: str
    explanation: str | None = None
    question_order: int
    created_at: datetime
    updated_at: datetime