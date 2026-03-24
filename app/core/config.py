import os
import logging

from dotenv import load_dotenv

load_dotenv()
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

    @staticmethod
    def _get_env(key: str, default: str | None = None) -> str:
        value = os.getenv(key, default)
        if value is None:
            raise RuntimeError(f"{key} environment variable is not set")
        return value


settings = Settings()
