from pydantic import BaseModel


class SearchResult(BaseModel):
    video_id: int
    video_title: str
    source: str
    field: str
    snippet: str
    tab: str
