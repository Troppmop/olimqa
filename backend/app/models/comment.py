from datetime import datetime
from sqlalchemy import DateTime, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=True)
    answer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("answers.id", ondelete="CASCADE"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    author: Mapped["User"] = relationship("User", back_populates="comments", lazy="selectin")
    question: Mapped["Question | None"] = relationship("Question", foreign_keys=[question_id], back_populates="comments", lazy="selectin")
    answer: Mapped["Answer | None"] = relationship("Answer", foreign_keys=[answer_id], back_populates="comments", lazy="selectin")
