from app.api.routes.auth import router as auth_router
from app.api.routes.lectures import router as lectures_router
from app.api.routes.processing import router as processing_router
from app.api.routes.projects import router as projects_router
from app.api.routes.quiz import router as quiz_router
from app.api.routes.videos import router as videos_router

__all__ = [
    "auth_router",
    "lectures_router",
    "processing_router",
    "projects_router",
    "quiz_router",
    "videos_router",
]
