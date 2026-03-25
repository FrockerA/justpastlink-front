from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth_router,
    lectures_router,
    processing_router,
    quiz_router,
    transcripts_router,
    videos_router,
)

app = FastAPI(title="justpastlink API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(videos_router)
app.include_router(processing_router)
app.include_router(transcripts_router)
app.include_router(lectures_router)
app.include_router(quiz_router)