from contextlib import asynccontextmanager

from fastapi import FastAPI

from core.database import init_models
from infrastructure.managers.redis_manager import redis_manager


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_models()
    await redis_manager.connect()
    try:
        yield
    finally:
        await redis_manager.disconnect()
