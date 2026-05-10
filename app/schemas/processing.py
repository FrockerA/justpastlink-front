from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ProcessingJobCreate(BaseModel):
    video_id: int
    job_type: str
    status: str = "pending"


class ProcessingStatusUpdate(BaseModel):
    status: str


class ProcessingJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    video_id: int
    job_type: str
    status: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class ProcessingJobItem(BaseModel):
    """Single job item for the aggregated status response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_type: str
    status: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class ProcessingStatusResponse(BaseModel):
    """Aggregated processing status matching the frontend interface."""
    video_id: int
    video_status: str
    jobs: list[ProcessingJobItem]
    transcript_ready: bool
    lecture_ready: bool
    quiz_ready: bool