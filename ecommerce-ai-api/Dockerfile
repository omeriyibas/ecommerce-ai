# ecommerce-ai-api — FastAPI
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=src \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
# Prod: no test deps. tests/docker-compose pytest: --build-arg INSTALL_TEST=1
ARG INSTALL_TEST=0
RUN if [ "$INSTALL_TEST" = "1" ]; then \
      uv sync --frozen --group test --no-group seeds; \
    else \
      uv sync --frozen --no-dev --no-group seeds; \
    fi

COPY alembic.ini ./
COPY alembic ./alembic
COPY main.py ./
COPY src ./src
COPY tests ./tests

RUN mkdir -p /app/logs

EXPOSE 8000

# Migrasyon: docker compose exec api uv run alembic upgrade head
CMD ["uv", "run", "python", "main.py"]
