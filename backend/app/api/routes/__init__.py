from app.api.routes.auth import router as auth_router
from app.api.routes.lectures import router as lectures_router
from app.api.routes.processing import router as processing_router
from app.api.routes.quiz import router as quiz_router
from app.api.routes.search import router as search_router
from app.api.routes.transcript import router as transcripts_router  # ← НОВОЕ
from app.api.routes.videos import router as videos_router

__all__ = [
    "auth_router",
    "lectures_router",
    "processing_router",
    "quiz_router",
    "search_router",
    "transcripts_router",  # ← НОВОЕ
    "videos_router",
]
