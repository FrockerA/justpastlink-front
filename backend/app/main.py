import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import (
    auth_router,
    catalogs_router,
    lectures_router,
    processing_router,
    quiz_router,
    search_router,
    transcripts_router,
    videos_router,
)
from app.core.observability import init_observability


init_observability()

app = FastAPI(title="justpastlink API")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(catalogs_router)
app.include_router(videos_router)
app.include_router(processing_router)
app.include_router(transcripts_router)
app.include_router(lectures_router)
app.include_router(quiz_router)
app.include_router(search_router)


@app.get("/healthz", include_in_schema=False)
def healthz():
    return {"status": "ok"}


FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        api_prefixes = {
            "auth",
            "catalogs",
            "videos",
            "processing",
            "transcripts",
            "lectures",
            "quiz",
            "search",
        }
        first_segment = full_path.split("/", 1)[0]
        if first_segment in api_prefixes:
            raise HTTPException(status_code=404, detail="API route not found")

        requested_path = FRONTEND_DIST / full_path
        if full_path and requested_path.is_file():
            return FileResponse(requested_path)
        return FileResponse(FRONTEND_DIST / "index.html")
