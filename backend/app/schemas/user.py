from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: str = Field(..., min_length=2, max_length=100)
    aliyah_year: int | None = Field(None, ge=1948, le=2100)
    country_of_origin: str | None = Field(None, max_length=100)
    is_lone_soldier: bool = False


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, min_length=2, max_length=100)
    bio: str | None = None
    aliyah_year: int | None = Field(None, ge=1948, le=2100)
    country_of_origin: str | None = Field(None, max_length=100)
    is_lone_soldier: bool | None = None


class UserPublic(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    display_name: str
    reputation: int
    is_lone_soldier: bool
    aliyah_year: int | None
    country_of_origin: str | None
    avatar_url: str | None
    created_at: datetime


class UserRead(UserPublic):
    email: str
    bio: str | None
    is_active: bool
    is_verified: bool
    updated_at: datetime
