from app.core.database import SessionLocal
from app.services.lecture_service import generate_lecture
from app.services.processing_service import (
    mark_processing_completed,
    mark_processing_failed,
    update_processing_status,
)
from app.services.quiz_service import generate_quiz
from app.services.transcript_service import transcribe_video


def run_pipeline(video_id: int, file_path: str) -> None:
    """
    Full processing pipeline:
    1. Transcribe video  -> saves Transcript
    2. Generate lecture  -> saves Lecture
    3. Generate quiz     -> saves Quiz
    Updates ProcessingJob and Video status at each step.
    """
    db = SessionLocal()
    try:
        # Step 1: Transcription
        update_processing_status(db, video_id, "processing")
        transcript = transcribe_video(db=db, video_id=video_id, file_path=file_path)

        # Step 2: Lecture generation
        update_processing_status(db, video_id, "generating_lecture")
        lecture = generate_lecture(db=db, video_id=video_id, transcript_text=transcript.full_text)

        # Step 3: Quiz generation
        update_processing_status(db, video_id, "generating_quiz")
        generate_quiz(db=db, video_id=video_id, lecture_text=lecture.content)

        # Done
        mark_processing_completed(db, video_id)

    except Exception as e:
        mark_processing_failed(db, video_id, error_message=str(e))
        raise
    finally:
        db.close()