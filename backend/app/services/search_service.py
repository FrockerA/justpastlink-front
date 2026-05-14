from __future__ import annotations

import json
from typing import Iterable

from sqlalchemy.orm import Session, selectinload

from app.models.video import Video
from app.schemas.search import SearchResult


FIELD_PRIORITY = {
    ("video", "title"): 0,
    ("lecture", "title"): 1,
    ("lecture", "summary"): 2,
    ("lecture", "content"): 3,
    ("transcript", "full_text"): 4,
    ("quiz", "questions"): 5,
}


def _flatten_json_strings(value: object) -> Iterable[str]:
    if isinstance(value, str):
        yield value
        return

    if isinstance(value, dict):
        for item in value.values():
            yield from _flatten_json_strings(item)
        return

    if isinstance(value, list):
        for item in value:
            yield from _flatten_json_strings(item)


def _normalize_text(value: str) -> str:
    return " ".join(value.split())


def _build_snippet(value: str, query: str, radius: int = 90) -> str:
    normalized_value = _normalize_text(value)
    normalized_query = _normalize_text(query)
    match_index = normalized_value.lower().find(normalized_query.lower())

    if match_index < 0:
        return normalized_value[: radius * 2].strip()

    start = max(0, match_index - radius)
    end = min(len(normalized_value), match_index + len(normalized_query) + radius)
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(normalized_value) else ""

    return f"{prefix}{normalized_value[start:end].strip()}{suffix}"


def _append_match(
    results: list[SearchResult],
    *,
    video: Video,
    source: str,
    field: str,
    value: str | None,
    query: str,
    tab: str,
) -> None:
    if not value or query.lower() not in value.lower():
        return

    results.append(
        SearchResult(
            video_id=video.id,
            video_title=video.original_filename,
            source=source,
            field=field,
            snippet=_build_snippet(value, query),
            tab=tab,
        )
    )


def _append_quiz_matches(
    results: list[SearchResult],
    *,
    video: Video,
    questions_json: str | None,
    query: str,
) -> None:
    if not questions_json:
        return

    try:
        parsed = json.loads(questions_json)
        values = list(_flatten_json_strings(parsed))
    except (json.JSONDecodeError, TypeError):
        values = [questions_json]

    for value in values:
        if query.lower() not in value.lower():
            continue

        _append_match(
            results,
            video=video,
            source="quiz",
            field="questions",
            value=value,
            query=query,
            tab="quiz",
        )
        return


def search_library(
    db: Session,
    user_id: int,
    query: str,
    limit: int = 30,
) -> list[SearchResult]:
    cleaned_query = query.strip()
    if not cleaned_query:
        return []

    videos = (
        db.query(Video)
        .options(
            selectinload(Video.transcript),
            selectinload(Video.lecture),
            selectinload(Video.quiz),
        )
        .filter(Video.user_id == user_id)
        .order_by(Video.created_at.desc(), Video.id.desc())
        .all()
    )

    results: list[SearchResult] = []
    for video in videos:
        _append_match(
            results,
            video=video,
            source="video",
            field="title",
            value=video.original_filename,
            query=cleaned_query,
            tab="status",
        )

        if video.lecture:
            _append_match(
                results,
                video=video,
                source="lecture",
                field="title",
                value=video.lecture.title,
                query=cleaned_query,
                tab="lecture",
            )
            _append_match(
                results,
                video=video,
                source="lecture",
                field="summary",
                value=video.lecture.summary,
                query=cleaned_query,
                tab="lecture",
            )
            _append_match(
                results,
                video=video,
                source="lecture",
                field="content",
                value=video.lecture.content,
                query=cleaned_query,
                tab="lecture",
            )

        if video.transcript:
            _append_match(
                results,
                video=video,
                source="transcript",
                field="full_text",
                value=video.transcript.full_text,
                query=cleaned_query,
                tab="transcript",
            )

        if video.quiz:
            _append_quiz_matches(
                results,
                video=video,
                questions_json=video.quiz.questions,
                query=cleaned_query,
            )

    results.sort(
        key=lambda result: (
            FIELD_PRIORITY.get((result.source, result.field), 99),
            result.video_title.lower(),
        )
    )

    return results[:limit]
