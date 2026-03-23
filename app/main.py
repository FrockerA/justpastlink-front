from fastapi import FastAPI

from app.api.routes import auth_router, processing_router, projects_router, videos_router
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Video Processing API")

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(videos_router)
app.include_router(processing_router)
