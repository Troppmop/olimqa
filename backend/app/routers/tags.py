from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.question import Tag, question_tags
from app.services.cache import cache_get, cache_set, cache_delete, TAGS_KEY, TAGS_TTL

router = APIRouter(prefix="/api/tags", tags=["tags"])


async def _fetch_tags(db: AsyncSession, q: str | None) -> list[dict]:
    stmt = (
        select(Tag, func.count(question_tags.c.question_id).label("question_count"))
        .outerjoin(question_tags, Tag.id == question_tags.c.tag_id)
        .group_by(Tag.id)
        .order_by(func.count(question_tags.c.question_id).desc())
    )
    if q:
        stmt = stmt.where(Tag.name.ilike(f"%{q}%"))
    result = await db.execute(stmt)
    return [
        {"id": t.id, "name": t.name, "description": t.description, "color": t.color, "question_count": count}
        for t, count in result.all()
    ]


@router.get("", response_model=list[dict])
async def list_tags(q: str | None = None, db: AsyncSession = Depends(get_db)):
    # Only cache the unfiltered list
    if not q:
        cached = await cache_get(TAGS_KEY)
        if cached:
            return cached
        tags = await _fetch_tags(db, None)
        await cache_set(TAGS_KEY, tags, TAGS_TTL)
        return tags
    return await _fetch_tags(db, q)
