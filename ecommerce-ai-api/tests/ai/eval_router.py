"""Router sınıflandırma eval — gerçek LLM (b_test/eval_agent.py gibi).

Çalıştır (API kökünden):
  ./tests/ai/run_tests.sh --eval
  # veya: PYTHONPATH=src uv run python tests/ai/eval_router.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_SRC = _ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from dotenv import load_dotenv

# shell source yok — .env’deki özel karakterler güvenli
load_dotenv(_ROOT / ".env", override=True)

if not os.environ.get("OPENAI_API_KEY"):
    raise SystemExit("HATA: kök .env içinde OPENAI_API_KEY gerekli.")

from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import EqualsExpected

from ai.agents.router import router_agent


def classify(message: str) -> str:
    result = router_agent.run_sync(message)
    return result.output


dataset = Dataset(
    name="support-route-eval",
    cases=[
        Case(
            name="order-list",
            inputs="Siparişlerimi göster.",
            expected_output="order",
        ),
        Case(
            name="order-cancel",
            inputs="3 numaralı siparişimi iptal et.",
            expected_output="order",
        ),
        Case(
            name="payment-list",
            inputs="Ödemelerimi listele.",
            expected_output="payment",
        ),
        Case(
            name="payment-pay",
            inputs="3 numaralı siparişimin ödemesini yap.",
            expected_output="payment",
        ),
        Case(
            name="both",
            inputs="Siparişlerimi ve ödemelerimi göster.",
            expected_output="both",
        ),
        Case(
            name="research-order-product",
            inputs="Son siparişimdeki ürünü araştır.",
            expected_output="research",
        ),
        Case(
            name="rag-return-policy",
            inputs="İade politikanız nedir?",
            expected_output="rag",
        ),
        Case(
            name="general-hello",
            inputs="Merhaba",
            expected_output="general",
        ),
        Case(
            name="general-thanks",
            inputs="Teşekkürler",
            expected_output="general",
        ),
    ],
    evaluators=[EqualsExpected()],
)


if __name__ == "__main__":
    report = dataset.evaluate_sync(classify, max_concurrency=1)
    report.print()
