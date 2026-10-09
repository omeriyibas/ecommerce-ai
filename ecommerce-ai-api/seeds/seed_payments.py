#!/usr/bin/env python3
"""Payment seeder — ödemesi olmayan siparişler için ödeme oluşturur.

Kullanım (proje kökünden):
  uv run python seeds/seed_products.py
  uv run python seeds/seed_orders.py
  uv run python seeds/seed_payments.py
"""

from __future__ import annotations

import asyncio
import random

from _common import PROJECT_ROOT, ask_int
from core.database import AsyncSessionLocal, init_models
from services.order_service import OrderService
from services.payment_service import PaymentService
from services.product_service import ProductService

PAYMENT_STATUSES = ['pending', 'paid', 'failed']


async def seed(*, count: int, user_id: int) -> None:
    await init_models(create=True)
    print(f'En fazla {count} ödeme oluşturulacak (user_id={user_id})…')
    print(f'DB dizini: {PROJECT_ROOT}')

    async with AsyncSessionLocal() as db:
        order_service = OrderService(db)
        payment_service = PaymentService(db)
        product_service = ProductService(db)

        open_orders = await order_service.list_orders_without_payment(user_id)
        if not open_orders:
            raise SystemExit(
                'Ödemesiz sipariş yok. Önce: uv run python seeds/seed_orders.py'
            )

        selected = open_orders[:count]
        for i, order in enumerate(selected, start=1):
            product = await product_service.get_product(order.product_id)
            amount = product.price if product is not None else 0.0
            payment = await payment_service.create_payment(
                order_id=order.id,
                user_id=user_id,
                amount=amount,
                status=random.choice(PAYMENT_STATUSES),
            )
            print(
                f'[{i}/{len(selected)}] ok payment={payment.id} '
                f'order_id={payment.order_id} amount={payment.amount} '
                f'status={payment.status}'
            )

    print('Tamam.')


def main() -> None:
    print('Payment seeder')
    count = ask_int('Kaç ödeme oluşturulsun?', default=5)
    user_id = ask_int('Hangi user_id için?', default=15)
    asyncio.run(seed(count=count, user_id=user_id))


if __name__ == '__main__':
    main()
