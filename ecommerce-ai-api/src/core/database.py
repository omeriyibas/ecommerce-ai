from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
import os

from core.config import get_settings

settings = get_settings()
DATABASE_URL = settings.DATABASE_URL


def _asyncpg_ssl(raw: str):
    value = (raw or "require").strip().lower()
    if value in ("disable", "false", "0", "off"):
        return False
    if value in ("allow", "prefer", "require", "verify-ca", "verify-full"):
        return value
    return "require"


_connect_args = {
    "statement_cache_size": 0,
    "ssl": _asyncpg_ssl(settings.DB_SSL),
}

# Pytest / TestClient: her fixture ayrı event loop — pooled asyncpg bozulur
_testing = os.environ.get("ECOMMERCE_TESTING") == "1"

if _testing:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        connect_args=_connect_args,
        poolclass=NullPool,
    )
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        connect_args=_connect_args,
        pool_pre_ping=settings.DB_POOL_PRE_PING,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()


async def init_models(*, create: bool | None = None) -> None:
    """Modelleri metadata'ya yükler.

    Şema: `alembic upgrade head` (veya `./scripts/run.sh migrate`).
    `create=True` / test ortamı: create_all (seed/cli / pytest).
    """
    from models import auth as _auth  # noqa: F401
    from models import conversation as _conversation  # noqa: F401
    from models import order as _order  # noqa: F401
    from models import payment as _payment  # noqa: F401
    from models import product as _product  # noqa: F401
    from models import tool_approval as _tool_approval  # noqa: F401

    should_create = _testing if create is None else create
    if should_create:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
