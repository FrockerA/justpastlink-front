from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(BigInteger, primary_key=True, index=True)
    video_id = Column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, unique=True)

    full_text = Column(Text, nullable=False)
    language = Column(String(50), nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    video = relationship("Video", back_populates="transcript")