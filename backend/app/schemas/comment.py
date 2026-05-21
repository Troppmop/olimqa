from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.user import UserPublic


class CommentCreate(BaseModel):
    body: str = Field(..., min_length=5, max_length=600)


class CommentRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    body: str
    author: UserPublic
    question_id: int | None
    answer_id: int | None
    created_at: datetime
