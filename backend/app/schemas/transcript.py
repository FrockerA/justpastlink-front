from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TranscriptCreate(BaseModel):
    video_id: int
    full_text: str
    language: str | None = None


class TranscriptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    video_id: int
    full_text: str
    language: str | None = None
    created_at: datetime
    updated_at: datetime