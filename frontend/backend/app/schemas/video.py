from datetime import datetime
from pydantic import BaseModel, ConfigDict


class VideoCreate(BaseModel):
    pass


class VideoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None = None
    original_filename: str
    stored_filename: str
    file_path: str
    file_size: int | None = None
    mime_type: str | None = None
    duration_seconds: int | None = None
    status: str
    created_at: datetime
    updated_at: datetime