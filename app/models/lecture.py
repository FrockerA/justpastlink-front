from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(BigInteger, primary_key=True, index=True)
    video_id = Column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, unique=True)

    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="draft")

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    video = relationship("Video", back_populates="lecture")