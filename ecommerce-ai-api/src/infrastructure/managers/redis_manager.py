# app/redis_manager.py
import redis.asyncio as redis

from core.config import get_settings

settings = get_settings()


class RedisManager:
    def __init__(self):
        self.client = None

    async def connect(self):
        self.client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=int(settings.REDIS_DB),
            password=(
                settings.REDIS_PASSWORD
                if settings.REDIS_PASSWORD and settings.REDIS_PASSWORD.strip()
                else None
            ),
            decode_responses=True,
        )

    async def disconnect(self):
        if self.client:
            await self.client.close()
            self.client = None

    def get_client(self):
        if not self.client:
            raise RuntimeError("Redis bağlantısı başlatılmadı!")
        return self.client


# Tüm uygulama için tek bir örnek:
redis_manager = RedisManager()
