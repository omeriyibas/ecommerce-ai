#!/usr/bin/env bash
# AI testleri — b_test/run_tests.sh benzeri
#   ./tests/ai/run_tests.sh           # unit (TestModel, LLM yok)
#   ./tests/ai/run_tests.sh --eval    # + router eval (gerçek LLM)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Yanlış aktif venv uyarısını kes; proje .venv kullanılsın
unset VIRTUAL_ENV

export PYDANTIC_AI_NO_BANNER=1
export PYTEST_DISABLE_PLUGIN_AUTOLOAD=1
# Agent import’ta provider kurar; unit’de gerçek istek yok
export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-test-unit-not-used}"

uv run --group test python -m pytest tests/unit/ai -v

if [[ "${1:-}" == "--eval" ]] || [[ "${RUN_AI_EVAL:-}" == "1" ]]; then
  echo "--- eval_router (gerçek LLM) ---"
  # .env’i source etme — özel karakterler shell’i kırar; Python dotenv yükler
  unset OPENAI_API_KEY
  uv run python tests/ai/eval_router.py
fi
