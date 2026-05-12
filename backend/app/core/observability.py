import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for key in ("correlation_id", "video_id", "job_id", "stage", "error_code"):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def configure_logging() -> None:
    root = logging.getLogger()
    if root.handlers:
        for handler in root.handlers:
            handler.setFormatter(JsonFormatter())
        return

    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root.addHandler(handler)
    root.setLevel(logging.INFO)


def init_sentry() -> None:
    if not settings.sentry_dsn:
        return

    try:
        import sentry_sdk
    except ImportError:
        logging.getLogger(__name__).warning(
            "SENTRY_DSN is configured but sentry-sdk is not installed"
        )
        return

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_environment,
        traces_sample_rate=0.05,
    )


def init_observability() -> None:
    configure_logging()
    init_sentry()
