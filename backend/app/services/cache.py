import json
from datetime import datetime
from typing import Any
from app.services.redis_client import get_redis

TAGS_KEY = "cache:tags:all"
TAGS_TTL = 300  # 5 minutes

QUESTIONS_TTL = 30  # 30 seconds


def _serial(obj: Any) -> str:
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Not serializable: {type(obj)}")


async def cache_get(key: str) -> Any | None:
    redis = await get_redis()
    raw = await redis.get(key)
    return json.loads(raw) if raw else None


async def cache_set(key: str, value: Any, ttl: int) -> None:
    redis = await get_redis()
    await redis.setex(key, ttl, json.dumps(value, default=_serial))


async def cache_delete(key: str) -> None:
    redis = await get_redis()
    await redis.delete(key)


async def invalidate_questions_cache() -> None:
    """Delete all cached question list pages."""
    redis = await get_redis()
    keys = await redis.keys("cache:questions:*")
    if keys:
        await redis.delete(*keys)


def questions_cache_key(page: int, sort: str, tag: str | None, q: str | None) -> str:
    return f"cache:questions:{sort}:{tag or ''}:{q or ''}:{page}"
