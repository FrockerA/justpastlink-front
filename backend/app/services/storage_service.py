from __future__ import annotations

import tempfile
from pathlib import Path
from urllib.parse import urlparse

from app.core.config import settings


class StorageError(RuntimeError):
    pass


def media_upload_dir() -> Path:
    return Path(settings.upload_dir)


def temp_media_dir() -> Path:
    path = Path(tempfile.gettempdir()) / "justpastlink-media"
    path.mkdir(parents=True, exist_ok=True)
    return path


def upload_destination(stored_filename: str) -> Path:
    if settings.storage_backend == "local":
        base_dir = media_upload_dir()
    elif settings.storage_backend == "s3":
        base_dir = temp_media_dir()
    else:
        raise StorageError(f"Unsupported storage backend: {settings.storage_backend}")

    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir / stored_filename


def is_s3_uri(value: str | None) -> bool:
    return bool(value and value.startswith("s3://"))


def _is_http_url(value: str | None) -> bool:
    if not value:
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"}


def _require_s3_bucket() -> str:
    bucket = settings.s3_bucket_name.strip()
    if not bucket:
        raise StorageError("S3_BUCKET_NAME is required when STORAGE_BACKEND=s3")
    return bucket


def _s3_key(stored_filename: str) -> str:
    prefix = settings.s3_upload_prefix.strip("/")
    return f"{prefix}/{stored_filename}" if prefix else stored_filename


def _parse_s3_uri(uri: str) -> tuple[str, str]:
    parsed = urlparse(uri)
    if parsed.scheme != "s3" or not parsed.netloc or not parsed.path.strip("/"):
        raise StorageError(f"Invalid S3 media URI: {uri}")
    return parsed.netloc, parsed.path.lstrip("/")


def _s3_client():
    try:
        import boto3
    except ImportError as exc:  # pragma: no cover - depends on deployment extras.
        raise StorageError("S3 storage requires boto3. Install backend production requirements.") from exc

    kwargs: dict[str, str] = {}
    if settings.s3_endpoint_url:
        kwargs["endpoint_url"] = settings.s3_endpoint_url
    if settings.s3_region_name:
        kwargs["region_name"] = settings.s3_region_name
    if settings.s3_access_key_id:
        kwargs["aws_access_key_id"] = settings.s3_access_key_id
    if settings.s3_secret_access_key:
        kwargs["aws_secret_access_key"] = settings.s3_secret_access_key

    return boto3.client("s3", **kwargs)


def store_media_file(local_path: Path, stored_filename: str) -> str:
    if settings.storage_backend == "local":
        return str(local_path)

    if settings.storage_backend != "s3":
        raise StorageError(f"Unsupported storage backend: {settings.storage_backend}")

    bucket = _require_s3_bucket()
    key = _s3_key(stored_filename)
    try:
        _s3_client().upload_file(str(local_path), bucket, key)
    except Exception as exc:  # pragma: no cover - provider/network specific.
        raise StorageError("Could not upload media to S3-compatible storage") from exc

    return f"s3://{bucket}/{key}"


def materialize_media_file(file_path: str, stored_filename: str | None = None) -> Path:
    if is_s3_uri(file_path):
        bucket, key = _parse_s3_uri(file_path)
        local_name = stored_filename or Path(key).name
        destination = temp_media_dir() / local_name
        if destination.exists() and destination.stat().st_size > 0:
            return destination
        try:
            _s3_client().download_file(bucket, key, str(destination))
        except Exception as exc:  # pragma: no cover - provider/network specific.
            raise StorageError("Could not download media from S3-compatible storage") from exc
        return destination

    if _is_http_url(file_path):
        raise StorageError("Remote media URL must be downloaded before transcription")

    return Path(file_path)


def delete_media_file(file_path: str | None) -> None:
    if not file_path or _is_http_url(file_path):
        return

    if is_s3_uri(file_path):
        bucket, key = _parse_s3_uri(file_path)
        try:
            _s3_client().delete_object(Bucket=bucket, Key=key)
        except Exception as exc:  # pragma: no cover - provider/network specific.
            raise StorageError("Could not delete media from S3-compatible storage") from exc
        return

    path = Path(file_path)
    if path.exists():
        path.unlink()
