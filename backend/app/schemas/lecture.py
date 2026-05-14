from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class LectureCreate(BaseModel):
    video_id: int
    title: str | None = None
    content: str
    summary: str | None = None
    status: str = "draft"


class LectureUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    summary: str | None = None
    status: str | None = None


class LectureAskRequest(BaseModel):
    question: str


class LectureAskResponse(BaseModel):
    answer: str
    citations: list[str] = Field(default_factory=list)


class LectureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    video_id: int
    title: str | None = None
    content: str
    summary: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
