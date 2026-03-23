from sqlalchemy.orm import Session

from app.models.lecture import Lecture
from app.services.qwen_client import call_qwen


LECTURE_SYSTEM_PROMPT = """You are an expert educator.
Given a video transcript, generate a well-structured lecture in the same language as the transcript.
The lecture must include:
- A clear title
- Introduction
- Main sections with headings
- Conclusion
- A short summary (2-4 sentences)

Format your response strictly as:
TITLE: <title here>
SUMMARY: <summary here>
CONTENT:
<full lecture content here>
"""


def _parse_lecture_response(raw: str) -> tuple[str, str, str]:
    """Parse Qwen response into (title, summary, content)."""
    title = "Untitled Lecture"
    summary = ""
    content = raw

    lines = raw.splitlines()
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
        user_prompt=f"Transcript:\n{transcript_text}",
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
    """Manually create a lecture (for testing / admin use)."""
    lecture = Lecture(video_id=video_id, content=content, summary=summary, status="generated")
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return lecture


def get_lecture_by_video_id(db: Session, video_id: int) -> Lecture | None:
    return db.query(Lecture).filter(Lecture.video_id == video_id).first()


def lecture_exists(db: Session, video_id: int) -> bool:
    return get_lecture_by_video_id(db, video_id) is not None