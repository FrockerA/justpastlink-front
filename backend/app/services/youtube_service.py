from __future__ import annotations

import os
import uuid
from pathlib import Path
from urllib.parse import urlparse

from app.core.config import settings

try:
    import yt_dlp
except ImportError:  # pragma: no cover - exercised only when dependency is missing.
    yt_dlp = None


YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtu.be",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
}


class YoutubeValidationError(ValueError):
    def __init__(self, message: str, code: str = "youtube_unavailable") -> None:
        super().__init__(message)
        self.code = code


def is_youtube_url(url: str | None) -> bool:
    if not url:
        return False
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    return parsed.scheme in {"http", "https"} and parsed.netloc.lower() in YOUTUBE_HOSTS


def _require_ytdlp():
    if yt_dlp is None:
        raise YoutubeValidationError(
            "YouTube processing is unavailable because yt-dlp is not installed",
            "youtube_dependency_missing",
        )
    return yt_dlp


def _ydl_options(output_template: str | None = None, quiet: bool = True) -> dict:
    opts = {
        "quiet": quiet,
        "no_warnings": quiet,
        "noplaylist": True,
    }
    if output_template:
        opts.update(
            {
                "format": "ba/b",
                "outtmpl": output_template,
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }
        )
    if os.path.exists("cookies.txt"):
        opts["cookiefile"] = "cookies.txt"
    return opts


def _classify_download_error(exc: Exception) -> YoutubeValidationError:
    message = str(exc)
    lowered = message.lower()
    if "private" in lowered:
        return YoutubeValidationError("This YouTube video is private", "youtube_private")
    if "region" in lowered or "country" in lowered or "geo" in lowered:
        return YoutubeValidationError(
            "This YouTube video is not available in the current region",
            "youtube_region_blocked",
        )
    if "unavailable" in lowered or "removed" in lowered:
        return YoutubeValidationError("This YouTube video is unavailable", "youtube_unavailable")
    return YoutubeValidationError(f"YouTube video could not be checked: {message}")


def get_youtube_metadata(url: str) -> dict:
    if not is_youtube_url(url):
        raise YoutubeValidationError("Paste a valid YouTube URL", "youtube_invalid_url")

    ytdlp = _require_ytdlp()
    try:
        with ytdlp.YoutubeDL(_ydl_options()) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as exc:
        raise _classify_download_error(exc) from exc

    if info.get("is_live"):
        raise YoutubeValidationError("Live YouTube streams are not supported", "youtube_live")

    duration = info.get("duration")
    if duration and duration > settings.max_video_duration_seconds:
        raise YoutubeValidationError(
            "This YouTube video is too long for processing",
            "youtube_too_long",
        )

    return {
        "title": info.get("title") or "YouTube video",
        "duration_seconds": duration,
        "webpage_url": info.get("webpage_url") or url,
    }


def download_youtube_audio(url: str, output_dir: str) -> dict:
    metadata = get_youtube_metadata(url)
    os.makedirs(output_dir, exist_ok=True)
    file_id = uuid.uuid4().hex
    out_tmpl = os.path.join(output_dir, f"{file_id}.%(ext)s")

    ytdlp = _require_ytdlp()
    try:
        with ytdlp.YoutubeDL(_ydl_options(out_tmpl, quiet=False)) as ydl:
            ydl.extract_info(url, download=True)
    except Exception as exc:
        raise _classify_download_error(exc) from exc

    file_path = Path(output_dir) / f"{file_id}.mp3"
    if not file_path.exists() or file_path.stat().st_size == 0:
        raise YoutubeValidationError("YouTube audio download produced an empty file")

    title = metadata["title"]
    return {
        "file_path": str(file_path),
        "stored_filename": f"{file_id}.mp3",
        "original_filename": f"{title}.mp3",
        "file_size": file_path.stat().st_size,
        "mime_type": "audio/mpeg",
        "duration_seconds": metadata.get("duration_seconds"),
    }
