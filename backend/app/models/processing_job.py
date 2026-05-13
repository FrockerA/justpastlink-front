from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(BigInteger, primary_key=True, index=True)
    video_id = Column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)

    job_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    current_stage = Column(String(50), nullable=True)
    correlation_id = Column(String(100), nullable=True, index=True)
    task_id = Column(String(100), nullable=True, index=True)

    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    duration_ms = Column(BigInteger, nullable=True)
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    stage_timings = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    video = relationship("Video", back_populates="processing_jobs")
