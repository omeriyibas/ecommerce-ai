import logging
import sys
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

load_dotenv(ROOT / ".env")

from core.config import get_settings  # noqa: E402
from core.database import engine  # noqa: E402
from core.exception_handlers import register_exception_handlers  # noqa: E402
from core.lifespan import lifespan  # noqa: E402
from core.logging_config import setup_logging  # noqa: E402
from core.test_api_delay_middleware import TestApiDelayMiddleware  # noqa: E402
from infrastructure.managers.redis_manager import redis_manager  # noqa: E402
from routers import auth, order, payment, product, support, user  # noqa: E402

_settings = get_settings()
setup_logging()

app = FastAPI(lifespan=lifespan)
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if _settings.API_REQUEST_DELAY_MS > 0:
    app.add_middleware(TestApiDelayMiddleware)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(product.router)
app.include_router(order.router)
app.include_router(payment.router)
app.include_router(support.router)


@app.get("/health")
async def health():
    log = logging.getLogger(__name__)
    checks: dict[str, dict[str, str]] = {
        "database": {"status": "error"},
        "redis": {"status": "error"},
    }

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok"}
    except Exception as e:
        msg = f"{type(e).__name__}: {e}"
        checks["database"] = {"status": "error", "error": msg}
        log.warning("health database check failed: %s", msg)

    try:
        await redis_manager.get_client().ping()
        checks["redis"] = {"status": "ok"}
    except Exception as e:
        msg = f"{type(e).__name__}: {e}"
        checks["redis"] = {"status": "error", "error": msg}
        log.warning("health redis check failed: %s", msg)

    healthy = all(c.get("status") == "ok" for c in checks.values())
    body = {
        "status": "ok" if healthy else "degraded",
        "checks": checks,
    }
    return JSONResponse(
        content=body,
        status_code=200 if healthy else 503,
    )


if __name__ == "__main__":
    workers = 1 if _settings.UVICORN_RELOAD else _settings.UVICORN_WORKERS
    if sys.platform == "win32" and workers > 1:
        logging.warning(
            "UVICORN_WORKERS=%s Windows'ta desteklenmiyor; workers=1 kullanılıyor.",
            workers,
        )
        workers = 1
    uvicorn.run(
        "__main__:app",
        host=_settings.UVICORN_HOST,
        port=_settings.UVICORN_PORT,
        reload=_settings.UVICORN_RELOAD,
        workers=workers,
    )
