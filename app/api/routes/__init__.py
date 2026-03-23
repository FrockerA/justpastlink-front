from app.api.routes.auth import router as auth_router
from app.api.routes.processing import router as processing_router
from app.api.routes.projects import router as projects_router
from app.api.routes.videos import router as videos_router

__all__ = [
    "auth_router",
    "processing_router",
    "projects_router",
    "videos_router",
]
