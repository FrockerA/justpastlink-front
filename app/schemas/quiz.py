from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuizQuestionItem(BaseModel):
    """Single quiz question parsed from the JSON blob."""
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str = ""


class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    video_id: int
    questions: str
    created_at: datetime
    updated_at: datetime
