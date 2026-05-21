from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    color: str = "#3B82F6"


class TagRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: str | None
    color: str
