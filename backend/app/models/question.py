from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Text, ForeignKey, Table, Column, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

question_tags = Table(
    "question_tags",
    Base.metadata,
    Column("question_id", Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(7), default="#3B82F6")

    questions: Mapped[list["Question"]] = relationship("Question", secondary=question_tags, back_populates="tags", lazy="selectin")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    vote_score: Mapped[int] = mapped_column(Integer, default=0)
    answer_count: Mapped[int] = mapped_column(Integer, default=0)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    accepted_answer_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author: Mapped["User"] = relationship("User", back_populates="questions", lazy="selectin")
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary=question_tags, back_populates="questions", lazy="selectin")
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="question", cascade="all, delete-orphan", lazy="selectin")
    votes: Mapped[list["Vote"]] = relationship("Vote", foreign_keys="[Vote.question_id]", back_populates="question", cascade="all, delete-orphan", lazy="selectin")
    comments: Mapped[list["Comment"]] = relationship("Comment", foreign_keys="[Comment.question_id]", back_populates="question", cascade="all, delete-orphan", lazy="selectin")
