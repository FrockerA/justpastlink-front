from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    video_id: int
    questions: str
    created_at: datetime
    updated_at: datetime
