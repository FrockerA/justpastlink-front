from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.search import SearchResult
from app.services.search_service import search_library

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=list[SearchResult])
def search_my_library(
    q: str = Query(default=""),
    limit: int = Query(default=30, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return search_library(
        db=db,
        user_id=current_user.id,
        query=q,
        limit=limit,
    )
