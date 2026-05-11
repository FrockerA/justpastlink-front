import os
import uuid
import yt_dlp
from pathlib import Path

def download_youtube_audio(url: str, output_dir: str) -> dict:
    os.makedirs(output_dir, exist_ok=True)
    file_id = uuid.uuid4().hex
    out_tmpl = os.path.join(output_dir, f"{file_id}.%(ext)s")

    # Базовые настройки
    ydl_opts = {
        'format': 'ba/b',
        'outtmpl': out_tmpl,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],

        'quiet': False,
        'no_warnings': False,
    }

    if os.path.exists('cookies.txt'):
        ydl_opts['cookiefile'] = 'cookies.txt'
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Извлекаем инфу и качаем
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'youtube_video')
    except Exception as e:
        raise ValueError(f"Ошибка при скачивании видео: {str(e)}")

    # yt-dlp конвертирует файл в mp3, поэтому явно прописываем .mp3
    file_path = Path(output_dir) / f"{file_id}.mp3"

    return {
        "file_path": str(file_path),
        "stored_filename": f"{file_id}.mp3",
        "original_filename": f"{title}.mp3",
        "file_size": file_path.stat().st_size if file_path.exists() else 0,
        "mime_type": "audio/mpeg"
    }
