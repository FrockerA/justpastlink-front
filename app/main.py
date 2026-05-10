from fastapi import FastAPI

from app.api.routes import (
    auth_router,
    lectures_router,
    processing_router,
    transcripts_router,
    quiz_router,
    videos_router,
)

app = FastAPI(title="justpastlink API")

app.include_router(auth_router)
app.include_router(videos_router)
app.include_router(processing_router)
app.include_router(lectures_router)
app.include_router(quiz_router)

app.include_router(transcripts_router)