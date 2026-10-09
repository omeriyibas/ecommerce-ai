"""Refresh JWT JTI store — async Redis (redis_manager)."""

from __future__ import annotations

from infrastructure.managers.redis_manager import redis_manager


def _user_refresh_set_key(role: str, user_id: int) -> str:
    return f"refresh_user:{role}:{user_id}"


def _client():
    return redis_manager.get_client()


async def store_refresh_jti(
    jti: str, user_id: int, role: str, ttl_seconds: int
) -> None:
    r = _client()
    await r.setex(f"refresh:{jti}", ttl_seconds, f"{role}:{user_id}")
    user_key = _user_refresh_set_key(role, user_id)
    await r.sadd(user_key, jti)
    await r.expire(user_key, ttl_seconds)


async def is_refresh_active(jti: str) -> bool:
    return await _client().exists(f"refresh:{jti}") == 1


async def revoke_refresh(jti: str) -> None:
    r = _client()
    val = await r.get(f"refresh:{jti}")
    await r.delete(f"refresh:{jti}")
    if not val:
        return
    text = str(val)
    if ":" in text:
        role, uid_str = text.split(":", 1)
        try:
            await r.srem(_user_refresh_set_key(role, int(uid_str)), jti)
        except ValueError:
            pass


async def revoke_all_refresh_for_user(user_id: int, role: str) -> int:
    r = _client()
    user_key = _user_refresh_set_key(role, user_id)
    jtis = list(await r.smembers(user_key))
    if not jtis:
        return 0
    pipe = r.pipeline()
    for jti in jtis:
        pipe.delete(f"refresh:{jti}")
    pipe.delete(user_key)
    await pipe.execute()
    return len(jtis)
