from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CatalogCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("Catalog name must not be empty")
        return normalized


class CatalogUpdate(CatalogCreate):
    pass


class CatalogLectureResponse(BaseModel):
    video_id: int
    title: str
    video_title: str
    summary: str | None = None
    added_at: datetime


class CatalogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    lectures: list[CatalogLectureResponse] = Field(default_factory=list)
