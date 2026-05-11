import json

from sqlalchemy.orm import Session

from app.models.lecture import Lecture
from app.services.qwen_client import call_qwen


LECTURE_SYSTEM_PROMPT = """You are a senior educator and instructional designer.
Your task is to turn a raw video transcript into a clear, useful explanatory lecture.

Core rules:
- Write in the same language as the transcript.
- Do not simply rewrite or summarize the transcript. Teach the topic as a coherent lesson.
- Remove filler words, repetitions, false starts, ads, greetings, and off-topic fragments.
- Preserve the transcript's facts. Do not invent details, names, numbers, citations, or claims.
- If an important idea is unclear in the transcript, say that the transcript does not provide enough detail.
- Explain each important concept with: what it means, why it matters, how it works, and a short example or analogy when helpful.
- Keep paragraphs short and readable. Prefer concrete explanations over vague motivational text.

Lecture structure:
- Start with a practical introduction: what the learner will understand after the lesson.
- Build the topic step by step, from foundations to more specific points.
- Use Markdown inside the content field:
  - Use "##" for major sections.
  - Use "###" for small subsections only when needed.
  - Use bullet lists for key points.
  - Use numbered steps only for processes.
  - Use "**Term:** explanation" for definitions.
- End with a "## Conclusion" section that ties the ideas together.

Summary rules:
- The summary must be sharper than the lecture.
- Use 4-6 bullet points.
- Each bullet must state one concrete takeaway, not a generic phrase.

Return only valid JSON. Do not wrap it in Markdown fences.
JSON schema:
{
  "title": "clear specific title",
  "summary": "- concrete takeaway\\n- concrete takeaway",
  "content": "full Markdown lecture"
}
"""


def _strip_code_fence(raw: str) -> str:
    text = raw.strip()
    if not text.startswith("```"):
        return text

    lines = text.splitlines()
    if len(lines) >= 2 and lines[-1].strip() == "```":
        return "\n".join(lines[1:-1]).strip()
    return "\n".join(lines[1:]).strip()


def _clean_text(value: object, default: str = "") -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return "\n".join(f"- {item}".strip() for item in value if item).strip()
    if value is None:
        return default
    return str(value).strip()


def _parse_lecture_payload(payload: object) -> tuple[str, str, str]:
    if not isinstance(payload, dict):
        raise ValueError("Lecture response JSON must be an object")

    title = _clean_text(payload.get("title"), "Untitled Lecture") or "Untitled Lecture"
    summary = _clean_text(payload.get("summary"))
    content = _clean_text(payload.get("content"))

    if not content:
        raise ValueError("Lecture response JSON is missing content")

    return title, summary, content


def _parse_lecture_response(raw: str) -> tuple[str, str, str]:
    """Parse Qwen response into (title, summary, content)."""
    cleaned = _strip_code_fence(raw)
    try:
        return _parse_lecture_payload(json.loads(cleaned))
    except (json.JSONDecodeError, ValueError, TypeError):
        pass

    title = "Untitled Lecture"
    summary = ""
    content = cleaned

    lines = cleaned.splitlines()
    content_lines = []
    in_content = False

    for line in lines:
        if line.startswith("TITLE:"):
            title = line.removeprefix("TITLE:").strip()
        elif line.startswith("SUMMARY:"):
            summary = line.removeprefix("SUMMARY:").strip()
        elif line.startswith("CONTENT:"):
            in_content = True
        elif in_content:
            content_lines.append(line)

    if content_lines:
        content = "\n".join(content_lines).strip()

    return title, summary, content


def generate_lecture(db: Session, video_id: int, transcript_text: str) -> Lecture:
    """Generate lecture from transcript using Qwen and save to DB."""
    raw = call_qwen(
        system_prompt=LECTURE_SYSTEM_PROMPT,
        user_prompt=(
            "Create the lecture from this transcript.\n\n"
            "TRANSCRIPT START\n"
            f"{transcript_text}\n"
            "TRANSCRIPT END"
        ),
    )

    title, summary, content = _parse_lecture_response(raw)

    # Upsert
    lecture = db.query(Lecture).filter(Lecture.video_id == video_id).first()
    if lecture:
        lecture.title = title
        lecture.summary = summary
        lecture.content = content
        lecture.status = "generated"
    else:
        lecture = Lecture(
            video_id=video_id,
            title=title,
            content=content,
            summary=summary,
            status="generated",
        )
        db.add(lecture)

    db.commit()
    db.refresh(lecture)
    return lecture


def create_lecture(db: Session, video_id: int, content: str, summary: str | None = None) -> Lecture:
    """Manually create or update a lecture (for testing / admin use)."""
    lecture = db.query(Lecture).filter(Lecture.video_id == video_id).first()
    if lecture:
        lecture.content = content
        lecture.summary = summary
        lecture.status = "generated"
    else:
        lecture = Lecture(video_id=video_id, content=content, summary=summary, status="generated")
        db.add(lecture)

    db.commit()
    db.refresh(lecture)
    return lecture


def get_lecture_by_video_id(db: Session, video_id: int) -> Lecture | None:
    return db.query(Lecture).filter(Lecture.video_id == video_id).first()


def update_lecture(
    db: Session,
    video_id: int,
    title: str | None = None,
    content: str | None = None,
    summary: str | None = None,
    status: str | None = None,
) -> Lecture | None:
    lecture = get_lecture_by_video_id(db, video_id)
    if not lecture:
        return None

    if title is not None:
        lecture.title = title
    if content is not None:
        lecture.content = content
    if summary is not None:
        lecture.summary = summary
    if status is not None:
        lecture.status = status

    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return lecture


def lecture_exists(db: Session, video_id: int) -> bool:
    return get_lecture_by_video_id(db, video_id) is not None
