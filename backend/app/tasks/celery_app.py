from celery import Celery

from app.core.config import settings
from app.core.observability import init_observability


init_observability()

celery_app = Celery(
    "justpastlink",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.video_pipeline"],
)

celery_app.conf.update(
    task_default_queue=settings.processing_queue_name,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_always_eager=settings.processing_task_always_eager,
    broker_connection_retry_on_startup=True,
)
