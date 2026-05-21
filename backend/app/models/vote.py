from datetime import datetime
from sqlalchemy import DateTime, Integer, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        CheckConstraint("value IN (1, -1)", name="vote_value_check"),
        UniqueConstraint("user_id", "question_id", name="uq_vote_user_question"),
        UniqueConstraint("user_id", "answer_id", name="uq_vote_user_answer"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=True)
    answer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("answers.id", ondelete="CASCADE"), nullable=True)
    value: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 or -1
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="votes", lazy="selectin")
    question: Mapped["Question | None"] = relationship("Question", foreign_keys=[question_id], back_populates="votes", lazy="selectin")
    answer: Mapped["Answer | None"] = relationship("Answer", foreign_keys=[answer_id], back_populates="votes", lazy="selectin")
