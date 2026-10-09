"""Pytest fixtures — yalnız tests/.env (kök .env kullanılmaz)."""

from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path

import pytest

_TESTS_DIR = Path(__file__).resolve().parent
_ENV_PATH = _TESTS_DIR / ".env"


def _activate_tests_env() -> bool:
    """ECOMMERCE_ENV_FILE → tests/.env; kök .env okunmaz."""
    if not _ENV_PATH.is_file():
        return False
    os.environ["ECOMMERCE_ENV_FILE"] = str(_ENV_PATH.resolve())
    prefer_existing = os.environ.get("ECOMMERCE_TEST_IN_DOCKER") == "1"
    for raw in _ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if not key or key == "ECOMMERCE_ENV_FILE":
            continue
        if prefer_existing and key in os.environ:
            continue
        os.environ[key] = value
    return True


_HAS_TEST_ENV = _activate_tests_env()
if _HAS_TEST_ENV:
    os.environ["ECOMMERCE_TESTING"] = "1"
    from core.config import get_settings

    get_settings.cache_clear()


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "integration: gerçek DB/Redis — tests/.env gerekir",
    )


@pytest.fixture(scope="session")
def settings():
    if not _HAS_TEST_ENV:
        pytest.skip(
            "tests/.env yok. cp tests/.env.example tests/.env",
            allow_module_level=False,
        )
    from core.config import get_settings

    get_settings.cache_clear()
    s = get_settings()
    assert Path(os.environ["ECOMMERCE_ENV_FILE"]).resolve() == _ENV_PATH.resolve()
    return s


@pytest.fixture(scope="session")
def app(settings):
    from main import app as fastapi_app

    return fastapi_app


@pytest.fixture
def client(app) -> Iterator:
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c
