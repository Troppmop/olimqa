from datetime import datetime
from sqlalchemy import DateTime, Integer, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    vote_score: Mapped[int] = mapped_column(Integer, default=0)
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author: Mapped["User"] = relationship("User", back_populates="answers", lazy="selectin")
    question: Mapped["Question"] = relationship("Question", back_populates="answers", lazy="selectin")
    votes: Mapped[list["Vote"]] = relationship("Vote", foreign_keys="[Vote.answer_id]", back_populates="answer", cascade="all, delete-orphan", lazy="selectin")
    comments: Mapped[list["Comment"]] = relationship("Comment", foreign_keys="[Comment.answer_id]", back_populates="answer", cascade="all, delete-orphan", lazy="selectin")
