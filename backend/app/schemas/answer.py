from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.user import UserPublic


class AnswerCreate(BaseModel):
    body: str = Field(..., min_length=30)


class AnswerUpdate(BaseModel):
    body: str = Field(..., min_length=30)


class AnswerRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    body: str
    author: UserPublic
    question_id: int
    vote_score: int
    is_accepted: bool
    is_ai_generated: bool = False
    created_at: datetime
    updated_at: datetime
    user_vote: int | None = None
