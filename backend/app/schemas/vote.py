from pydantic import BaseModel, Field


class VoteCreate(BaseModel):
    value: int = Field(..., ge=-1, le=1)


class VoteRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    question_id: int | None
    answer_id: int | None
    value: int
