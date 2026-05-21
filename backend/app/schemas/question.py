from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.user import UserPublic
from app.schemas.tag import TagRead


class QuestionCreate(BaseModel):
    title: str = Field(..., min_length=15, max_length=300)
    body: str = Field(..., min_length=30)
    tags: list[str] = Field(default_factory=list, max_length=5)


class QuestionUpdate(BaseModel):
    title: str | None = Field(None, min_length=15, max_length=300)
    body: str | None = Field(None, min_length=30)
    tags: list[str] | None = None


class QuestionList(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    title: str
    author: UserPublic
    tags: list[TagRead]
    view_count: int
    vote_score: int
    answer_count: int
    is_closed: bool
    accepted_answer_id: int | None
    created_at: datetime
    user_vote: int | None = None


class QuestionRead(QuestionList):
    body: str
    updated_at: datetime


class PaginatedQuestions(BaseModel):
    items: list[QuestionList]
    total: int
    page: int
    per_page: int
