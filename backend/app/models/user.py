from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    reputation: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    aliyah_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    country_of_origin: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_lone_soldier: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    questions: Mapped[list["Question"]] = relationship("Question", back_populates="author", lazy="selectin")
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="author", lazy="selectin")
    votes: Mapped[list["Vote"]] = relationship("Vote", back_populates="user", lazy="selectin")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="author", lazy="selectin")
