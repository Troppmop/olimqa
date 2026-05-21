import uuid
from app.services.redis_client import get_redis

_CONFIRM_TTL = 86400  # 24 hours


async def create_confirmation_token(user_id: int) -> str:
    token = str(uuid.uuid4())
    redis = await get_redis()
    await redis.setex(f"email_confirm:{token}", _CONFIRM_TTL, str(user_id))
    return token


async def consume_confirmation_token(token: str) -> int | None:
    """Return the user_id and delete the token, or None if invalid/expired."""
    redis = await get_redis()
    key = f"email_confirm:{token}"
    user_id = await redis.get(key)
    if user_id:
        await redis.delete(key)
        return int(user_id)
    return None
