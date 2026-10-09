from functools import lru_cache
from pathlib import Path
import os

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# src/core/config.py → proje kökü
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
# Test: ECOMMERCE_ENV_FILE=tests/.env (conftest ayarlar). Aksi halde kök .env
_ENV_FILE = Path(
    os.environ.get("ECOMMERCE_ENV_FILE") or str(_PROJECT_ROOT / ".env")
)


class Settings(BaseSettings):
    DEBUG: bool = True
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:CHANGE_ME@127.0.0.1:5432/ecommerce_ai"
    )
    LOG_LEVEL: str = "INFO"
    LOG_TO_FILE: bool = True
    #: Virgülle ayrılmış origin listesi; boş veya * = tüm originler (geliştirme)
    CORS_ORIGINS: str = "*"
    UVICORN_HOST: str = "0.0.0.0"
    UVICORN_PORT: int = 8000
    UVICORN_RELOAD: bool = False
    UVICORN_WORKERS: int = 1
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_LOGIN_MAX: int = 20
    RATE_LIMIT_LOGIN_WINDOW_SEC: int = 60
    RATE_LIMIT_REGISTER_MAX: int = 10
    RATE_LIMIT_REGISTER_WINDOW_SEC: int = 3600
    RATE_LIMIT_ADMIN_MAX: int = 5
    RATE_LIMIT_ADMIN_WINDOW_SEC: int = 3600
    #: Genel API rate limit (scope ile ayrılır)
    RATE_LIMIT_API_MAX: int = 60
    RATE_LIMIT_API_WINDOW_SEC: int = 60
    # SQLAlchemy async engine pool (PgBouncer arkasında küçük tut)
    DB_POOL_PRE_PING: bool = True
    DB_POOL_RECYCLE: int = 900
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 60
    JWT_SECRET: str = "dev-change-me"
    JWT_ALG: str = "HS256"
    #: Token üretici kimliği (iss)
    JWT_ISS: str = "ecommerce-ai-api"
    #: Token hedef kitlesi (aud)
    JWT_AUD: str = "ecommerce-ai-clients"
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    #: Redis logical DB index (test izolasyonu için; prod genelde 0)
    REDIS_DB: int = 0
    #: Genel liste cache TTL (saniye); 0 = kapalı
    LIST_CACHE_TTL_SEC: int = 30
    # S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "eu-central-1"
    S3_BUCKET: str = ""
    S3_PREFIX: str = "uploads/"
    #: Presigned GET URL ömrü (saniye)
    S3_PRESIGN_EXPIRES_SEC: int = 3600
    #: Upload max boyutu (byte); 0 = limit yok
    UPLOAD_MAX_BYTES: int = 5_000_000
    #: asyncpg SSL: require | disable | prefer | …
    DB_SSL: str = "disable"
    ACCESS_MIN: int = 30
    REFRESH_DAYS: int = 7
    #: lax | strict | none — cross-site panel↔API için none
    COOKIE_SAMESITE: str = "lax"

    # Admin Security Settings
    ADMIN_API_KEY: str = "dev-change-me"
    ADMIN_ENABLED: bool = True
    ADMIN_ALLOWED_IPS: str = "127.0.0.1,::1"
    #: Nginx / Docker peer IP'leri; yalnızca bunlar için X-Real-IP / X-Forwarded-For
    TRUSTED_PROXY_IPS: str = "127.0.0.1,::1,172.16.0.0/12,100.64.0.0/10"

    #: Test / geliştirme: her API isteğinden önce bu kadar ms bekle (0 = kapalı)
    API_REQUEST_DELAY_MS: float = 0.0

    # --- AI / agent ---
    OPENAI_MODEL: str = "openai:gpt-5-mini"
    OPENAI_RESPONSES_MODEL: str = "openai-responses:gpt-5-mini"
    OPENAI_FALLBACK_MODEL: str | None = None
    AGENT_RETRIES: int = Field(default=2, ge=0, le=10)
    AGENT_TIMEOUT: float = Field(default=60.0, gt=0)
    RESEARCH_TIMEOUT: float = Field(default=120.0, gt=0)
    AGENT_MAX_TOKENS: int = Field(default=4096, ge=64)
    AGENT_TEMPERATURE: float = Field(default=0.2, ge=0.0, le=2.0)
    ROUTER_TEMPERATURE: float = Field(default=0.0, ge=0.0, le=2.0)
    RESEARCH_TEMPERATURE: float = Field(default=0.5, ge=0.0, le=2.0)
    # true/false veya minimal|low|medium|high|xhigh; boş = model default
    AGENT_THINKING: str | None = None
    # agent.iter düğüm logları (ModelRequestNode, CallToolsNode, ...)
    AGENT_ITER_LOG: bool = True
    DEFAULT_USER_ID: int = Field(default=15, ge=1)

    # Observability (Logfire)
    LOGFIRE_ENABLED: bool = True
    LOGFIRE_TOKEN: str | None = None
    LOGFIRE_SERVICE_NAME: str = 'ecommerce-ai-api'
    LOGFIRE_ENVIRONMENT: str | None = "dev"

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator(
        "OPENAI_FALLBACK_MODEL",
        "AGENT_THINKING",
        "LOGFIRE_TOKEN",
        "LOGFIRE_ENVIRONMENT",
        mode="before",
    )
    @classmethod
    def empty_str_to_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    def cors_origin_list(self) -> list[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw or raw == "*":
            return ["*"]
        return [part.strip() for part in raw.split(",") if part.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
