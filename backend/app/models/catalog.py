from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Catalog(Base):
    __tablename__ = "catalogs"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_catalogs_user_name"),
    )

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    lecture_links = relationship(
        "CatalogLecture",
        back_populates="catalog",
        cascade="all, delete-orphan",
        order_by="CatalogLecture.created_at",
    )


class CatalogLecture(Base):
    __tablename__ = "catalog_lectures"

    catalog_id = Column(
        BigInteger,
        ForeignKey("catalogs.id", ondelete="CASCADE"),
        primary_key=True,
    )
    lecture_id = Column(
        BigInteger,
        ForeignKey("lectures.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    catalog = relationship("Catalog", back_populates="lecture_links")
    lecture = relationship("Lecture")
