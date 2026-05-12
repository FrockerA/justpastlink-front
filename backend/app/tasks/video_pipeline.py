import logging

from app.services.pipeline_service import run_pipeline
from app.tasks.celery_app import celery_app


logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.video_pipeline.process_video_pipeline", bind=True)
def process_video_pipeline(
    self,
    video_id: int,
    file_path: str,
    job_id: int,
    correlation_id: str,
) -> None:
    logger.info(
        "video pipeline task started",
        extra={
            "correlation_id": correlation_id,
            "video_id": video_id,
            "job_id": job_id,
        },
    )
    run_pipeline(
        video_id=video_id,
        file_path=file_path,
        job_id=job_id,
        correlation_id=correlation_id,
    )
