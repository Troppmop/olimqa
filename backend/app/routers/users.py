from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserPublic, UserUpdate, UserRead
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me", response_model=UserRead)
async def update_me(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.display_name is not None:
        current_user.display_name = data.display_name
    if data.bio is not None:
        current_user.bio = data.bio
    if data.aliyah_year is not None:
        current_user.aliyah_year = data.aliyah_year
    if data.country_of_origin is not None:
        current_user.country_of_origin = data.country_of_origin
    if data.is_lone_soldier is not None:
        current_user.is_lone_soldier = data.is_lone_soldier
    await db.commit()
    await db.refresh(current_user)
    return current_user
