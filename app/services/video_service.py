import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models import Lecture, ProcessingJob, QuizQuestion, Video

UPLOAD_DIR = Path("uploads/videos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def upload_video(file: UploadFile, db: Session) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename")

    extension = Path(file.filename).suffix
    stored_filename = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / stored_filename

    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    video = Video(
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=str(destination),
        file_size=destination.stat().st_size,
        mime_type=file.content_type,
        status="uploaded",
    )

    db.add(video)
    db.commit()
    db.refresh(video)

    return {
        "id": video.id,
        "original_filename": video.original_filename,
        "stored_filename": video.stored_filename,
        "file_path": video.file_path,
        "status": video.status,
    }


def list_videos(db: Session) -> list[dict]:
    videos = db.query(Video).order_by(Video.created_at.desc()).all()
    return [
        {
            "id": video.id,
            "original_filename": video.original_filename,
            "status": video.status,
            "created_at": video.created_at,
        }
        for video in videos
    ]


def get_video(video_id: int, db: Session) -> dict:
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return {
        "id": video.id,
        "original_filename": video.original_filename,
        "stored_filename": video.stored_filename,
        "file_path": video.file_path,
        "file_size": video.file_size,
        "mime_type": video.mime_type,
        "status": video.status,
        "created_at": video.created_at,
        "updated_at": video.updated_at,
    }


def start_video_processing(video_id: int, db: Session) -> dict:
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    processing_job = ProcessingJob(
        video_id=video.id,
        job_type="transcription",
        status="pending",
    )
    video.status = "processing"

    db.add(processing_job)
    db.add(video)
    db.commit()
    db.refresh(processing_job)

    return {
        "job_id": processing_job.id,
        "video_id": video.id,
        "job_type": processing_job.job_type,
        "job_status": processing_job.status,
        "video_status": video.status,
    }


def get_video_status(video_id: int, db: Session) -> dict:
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    latest_job = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.video_id == video.id)
        .order_by(ProcessingJob.created_at.desc())
        .first()
    )

    return {
        "video_id": video.id,
        "video_status": video.status,
        "latest_job": (
            {
                "id": latest_job.id,
                "job_type": latest_job.job_type,
                "status": latest_job.status,
                "created_at": latest_job.created_at,
                "started_at": latest_job.started_at,
                "finished_at": latest_job.finished_at,
                "error_message": latest_job.error_message,
            }
            if latest_job
            else None
        ),
    }


def get_video_lecture(video_id: int, db: Session) -> dict:
    lecture = db.query(Lecture).filter(Lecture.video_id == video_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    return {
        "id": lecture.id,
        "video_id": lecture.video_id,
        "title": lecture.title,
        "content": lecture.content,
        "summary": lecture.summary,
        "status": lecture.status,
    }


def get_video_quiz(video_id: int, db: Session) -> dict:
    lecture = db.query(Lecture).filter(Lecture.video_id == video_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found for this video")

    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.lecture_id == lecture.id)
        .order_by(QuizQuestion.question_order.asc())
        .all()
    )

    return {
        "video_id": video_id,
        "lecture_id": lecture.id,
        "questions": [
            {
                "id": question.id,
                "question_text": question.question_text,
                "options": {
                    "A": question.option_a,
                    "B": question.option_b,
                    "C": question.option_c,
                    "D": question.option_d,
                },
                "correct_answer": question.correct_answer,
                "explanation": question.explanation,
                "question_order": question.question_order,
            }
            for question in questions
        ],
    }
