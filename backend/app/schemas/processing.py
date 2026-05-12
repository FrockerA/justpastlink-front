from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


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
    current_stage: str | None = None
    correlation_id: str | None = None
    task_id: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    duration_ms: int | None = None
    error_code: str | None = None
    error_message: str | None = None
    stage_timings: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class ProcessingJobItem(BaseModel):
    """Single job item for the aggregated status response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_type: str
    status: str
    current_stage: str | None = None
    correlation_id: str | None = None
    task_id: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    duration_ms: int | None = None
    error_code: str | None = None
    error_message: str | None = None
    stage_timings: dict[str, Any] = Field(default_factory=dict)
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
    current_stage: str | None = None
    stage_index: int = 0
    stage_count: int = 4
    progress_percent: int = 0
    eta_seconds: int | None = None
    latest_error_code: str | None = None


class ProcessingDiagnosticsResponse(BaseModel):
    """Detailed processing diagnostics for support/admin surfaces."""

    video_id: int
    video_status: str
    latest_job: ProcessingJobItem | None = None
    jobs: list[ProcessingJobItem]
    stage_order: list[str]
    progress_percent: int = 0
    eta_seconds: int | None = None
