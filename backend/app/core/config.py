import os
import logging
from pathlib import Path

from dotenv import load_dotenv

# Always load the backend env file regardless of the current working directory.
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=str(ENV_PATH), override=True)
logger = logging.getLogger(__name__)


class Settings:
    def __init__(self) -> None:
        self.database_url = self._get_env("DATABASE_URL")
        self.secret_key = self._get_env("SECRET_KEY", "change-me-in-production")
        if self.secret_key == "change-me-in-production":
            logger.warning(
                "Using default SECRET_KEY value. Set SECRET_KEY in environment before production deployment."
            )
        self.algorithm = self._get_env("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(
            self._get_env("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        )
        self.redis_url = self._get_env("REDIS_URL", "redis://localhost:6379/0")
        self.celery_broker_url = self._get_env("CELERY_BROKER_URL", self.redis_url)
        self.celery_result_backend = self._get_env("CELERY_RESULT_BACKEND", self.redis_url)
        self.processing_queue_name = self._get_env("PROCESSING_QUEUE_NAME", "video-processing")
        self.processing_task_always_eager = self._get_bool("PROCESSING_TASK_ALWAYS_EAGER", False)
        self.processing_stage_max_attempts = int(self._get_env("PROCESSING_STAGE_MAX_ATTEMPTS", "3"))
        self.processing_stage_backoff_seconds = float(
            self._get_env("PROCESSING_STAGE_BACKOFF_SECONDS", "2")
        )
        self.processing_stage_backoff_max_seconds = float(
            self._get_env("PROCESSING_STAGE_BACKOFF_MAX_SECONDS", "30")
        )
        self.max_upload_bytes = int(self._get_env("MAX_UPLOAD_BYTES", str(500 * 1024 * 1024)))
        self.max_video_duration_seconds = int(self._get_env("MAX_VIDEO_DURATION_SECONDS", "7200"))
        self.require_ffprobe_validation = self._get_bool("REQUIRE_FFPROBE_VALIDATION", False)
        self.upload_dir = self._get_env("UPLOAD_DIR", "uploads")
        self.storage_backend = self._get_env("STORAGE_BACKEND", "local").strip().lower()
        if self.storage_backend not in {"local", "s3"}:
            raise RuntimeError("STORAGE_BACKEND must be either 'local' or 's3'")
        self.s3_bucket_name = self._get_env("S3_BUCKET_NAME", "")
        self.s3_endpoint_url = self._get_env("S3_ENDPOINT_URL", "")
        self.s3_region_name = self._get_env("S3_REGION_NAME", "")
        self.s3_access_key_id = self._get_env("S3_ACCESS_KEY_ID", "")
        self.s3_secret_access_key = self._get_env("S3_SECRET_ACCESS_KEY", "")
        self.s3_upload_prefix = self._get_env("S3_UPLOAD_PREFIX", "uploads")
        self.sentry_dsn = self._get_env("SENTRY_DSN", "")
        self.app_environment = self._get_env("APP_ENV", "development")

    @staticmethod
    def _get_env(key: str, default: str | None = None) -> str:
        value = os.getenv(key, default)
        if value is None:
            raise RuntimeError(f"{key} environment variable is not set")
        return value

    def _get_bool(self, key: str, default: bool) -> bool:
        raw_default = "true" if default else "false"
        return self._get_env(key, raw_default).strip().lower() in {"1", "true", "yes", "on"}


settings = Settings()
