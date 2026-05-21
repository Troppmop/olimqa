from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base
from app.models import *  # noqa: F401,F403 — registers all models with Base
from app.routers import auth, questions, answers, comments, tags, users, admin
from app.services.redis_client import close_redis
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safely add is_admin column when upgrading existing deployments
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"
        ))
    await _seed_tags()
    await _promote_admin()
    yield
    await close_redis()


async def _seed_tags():
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.question import Tag

    default_tags = [
        ("visa", "Visa and immigration paperwork", "#8B5CF6"),
        ("misrad-hapnim", "Interior Ministry (Misrad HaPnim)", "#EF4444"),
        ("ulpan", "Hebrew language courses", "#3B82F6"),
        ("bituach-leumi", "National Insurance Institute (Bituach Leumi)", "#10B981"),
        ("army", "IDF service and lone-soldier rights", "#F59E0B"),
        ("housing", "Finding and renting apartments in Israel", "#6366F1"),
        ("banking", "Opening bank accounts and finances", "#14B8A6"),
        ("health", "Healthcare, Kupat Holim, insurance", "#EC4899"),
        ("taxes", "Israeli and foreign tax obligations", "#F97316"),
        ("community", "Communities, networks, and social life", "#84CC16"),
        ("rights", "Olim rights and government benefits", "#06B6D4"),
        ("employment", "Jobs, work permits, and career advice", "#A855F7"),
    ]
    async with AsyncSessionLocal() as session:
        for name, desc, color in default_tags:
            exists = await session.execute(select(Tag).where(Tag.name == name))
            if not exists.scalar_one_or_none():
                session.add(Tag(name=name, description=desc, color=color))
        await session.commit()


async def _promote_admin():
    """Promote ADMIN_EMAIL to admin on startup if they exist and aren't already."""
    if not settings.admin_email:
        return
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.user import User

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == settings.admin_email))
        user = result.scalar_one_or_none()
        if user and not user.is_admin:
            user.is_admin = True
            await session.commit()


app = FastAPI(title="Olim & Lone Soldiers QA", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(answers.router)
app.include_router(comments.router)
app.include_router(tags.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
