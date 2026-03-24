from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(BigInteger, primary_key=True, index=True)
    lecture_id = Column(BigInteger, ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)

    question_text = Column(Text, nullable=False)

    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=True)
    option_d = Column(Text, nullable=True)

    correct_answer = Column(String(1), nullable=False)
    explanation = Column(Text, nullable=True)
    question_order = Column(Integer, nullable=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    lecture = relationship("Lecture", back_populates="quiz_questions")