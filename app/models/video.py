from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(BigInteger, nullable=True)
    mime_type = Column(String(100), nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    status = Column(String(50), nullable=False, default="uploaded")

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="videos")
    processing_jobs = relationship("ProcessingJob", back_populates="video", cascade="all, delete-orphan")
    transcript = relationship("Transcript", back_populates="video", uselist=False, cascade="all, delete-orphan")
    lecture = relationship("Lecture", back_populates="video", uselist=False, cascade="all, delete-orphan")