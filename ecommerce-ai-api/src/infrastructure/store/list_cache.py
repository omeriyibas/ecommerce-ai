"""Genel liste cache (kısa TTL; mutasyonda namespace+owner invalidate)."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

from core.config import get_settings
from infrastructure.managers.redis_manager import redis_manager

logger = logging.getLogger(__name__)


def fingerprint(*parts: Any) -> str:
    """Liste parametrelerinden kısa, kararlı hash üretir."""
    raw = "|".join("" if p is None else str(p).strip() for p in parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def _page_key(namespace: str, owner_id: int | str, fp: str) -> str:
    return f"list:{namespace}:{owner_id}:{fp}"


def _index_key(namespace: str, owner_id: int | str) -> str:
    return f"list:{namespace}:idx:{owner_id}"


async def get_cached_list(
    namespace: str,
    owner_id: int | str,
    fp: str,
) -> Any | None:
    try:
        client = redis_manager.get_client()
        raw = await client.get(_page_key(namespace, owner_id, fp))
        if not raw:
            return None
        return json.loads(raw)
    except Exception:
        logger.debug("list cache get failed ns=%s", namespace, exc_info=True)
        return None


async def set_cached_list(
    namespace: str,
    owner_id: int | str,
    fp: str,
    payload: Any,
    *,
    ttl_sec: int | None = None,
) -> None:
    ttl = get_settings().LIST_CACHE_TTL_SEC if ttl_sec is None else ttl_sec
    if ttl <= 0:
        return
    try:
        client = redis_manager.get_client()
        key = _page_key(namespace, owner_id, fp)
        idx = _index_key(namespace, owner_id)
        pipe = client.pipeline()
        pipe.setex(key, int(ttl), json.dumps(payload, default=str))
        pipe.sadd(idx, key)
        pipe.expire(idx, int(ttl) + 60)
        await pipe.execute()
    except Exception:
        logger.debug("list cache set failed ns=%s", namespace, exc_info=True)


async def invalidate_owner_lists(namespace: str, owner_id: int | str) -> None:
    try:
        client = redis_manager.get_client()
        idx = _index_key(namespace, owner_id)
        keys = list(await client.smembers(idx))
        if keys:
            await client.delete(*keys, idx)
        else:
            await client.delete(idx)
    except Exception:
        logger.debug("list cache invalidate failed ns=%s", namespace, exc_info=True)
