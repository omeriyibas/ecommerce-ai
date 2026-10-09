import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

load_dotenv(ROOT / '.env')

# Logfire: agent import’larından önce instrument et
from ai.runtime.observability import setup_logfire  # noqa: E402
from core.config import get_settings  # noqa: E402

setup_logfire()

from ai.deps import AppDeps  # noqa: E402
from ai.graph import SupportState, support_workflow  # noqa: E402
from ai.runtime.errors import RecoverableError, format_agent_error  # noqa: E402
from core.database import AsyncSessionLocal, init_models  # noqa: E402
from services.order_service import OrderService  # noqa: E402
from services.payment_service import PaymentService  # noqa: E402
from services.product_service import ProductService  # noqa: E402

USER_ID = get_settings().DEFAULT_USER_ID


EXAMPLE_MESSAGES = [
    # 'Siparişlerimi göster.',
    # '2 numaralı siparişimin ödemesi ne durumda?',
    # 'Ödemelerimi listele.',
    # '2 numaralı siparişimdeki ürün hakkında kısa bir araştırma yap.',
    'Son siparişimdeki ürün hakkında araştırma yap',
]


async def main() -> None:
    await init_models(create=True)

    async with AsyncSessionLocal() as db:
        deps = AppDeps(
            order_service=OrderService(db),
            payment_service=PaymentService(db),
            product_service=ProductService(db),
            user_id=USER_ID,
        )

        for i, message in enumerate(EXAMPLE_MESSAGES, start=1):
            print(f'\n--- [{i}/{len(EXAMPLE_MESSAGES)}] You: {message}')

            state = SupportState()
            try:
                reply = await support_workflow.run(
                    state=state,
                    deps=deps,
                    inputs=message,
                )
            except RecoverableError as exc:
                # Graph dışı / beklenmeyen agent hatası — turu düşürme
                msg = format_agent_error(exc, step='Destek')
                print(f'route: {state.route or "?"} (error)')
                print(msg)
                continue

            print(f'route: {state.route}')
            if state.error:
                print(f'error: {state.error}')
            print(reply)
            print(reply.model_dump_json(indent=2))


if __name__ == '__main__':
    asyncio.run(main())
