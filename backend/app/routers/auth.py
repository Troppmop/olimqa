from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import UserCreate, UserRead
from app.auth.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, get_current_user,
)
from app.services.email_tokens import create_confirmation_token, consume_confirmation_token
from app.services.email import send_confirmation_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=201)
async def register(
    data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    exists = (await db.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        display_name=data.display_name,
        aliyah_year=data.aliyah_year,
        country_of_origin=data.country_of_origin,
        is_lone_soldier=data.is_lone_soldier,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = await create_confirmation_token(user.id)
    background_tasks.add_task(send_confirmation_email, user.email, user.display_name, token)

    return user


@router.post("/confirm-email", response_model=UserRead)
async def confirm_email(token: str, db: AsyncSession = Depends(get_db)):
    user_id = await consume_confirmation_token(token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired confirmation link")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/resend-confirmation")
async def resend_confirmation(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email already confirmed")
    token = await create_confirmation_token(current_user.id)
    background_tasks.add_task(send_confirmation_email, current_user.email, current_user.display_name, token)
    return {"detail": "Confirmation email sent"}


@router.post("/login", response_model=Token)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=Token)
async def refresh(refresh_token: str, db: AsyncSession = Depends(get_db)):
    user_id = decode_token(refresh_token)
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
