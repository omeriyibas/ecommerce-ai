#!/usr/bin/env python3
"""Order seeder — mevcut ürünlerden sipariş oluşturur.

Kullanım (proje kökünden):
  uv run python seeds/seed_products.py
  uv run python seeds/seed_orders.py
"""

from __future__ import annotations

import asyncio
import random

from _common import PROJECT_ROOT, ask_int
from core.database import AsyncSessionLocal, init_models
from services.order_service import OrderService
from services.product_service import ProductService

STATUSES = ['pending', 'shipped', 'delivered']


async def seed(*, count: int, user_id: int) -> None:
    await init_models(create=True)
    print(f'{count} sipariş oluşturulacak (user_id={user_id})…')
    print(f'DB dizini: {PROJECT_ROOT}')

    async with AsyncSessionLocal() as db:
        product_service = ProductService(db)
        order_service = OrderService(db)
        products = await product_service.list_products()
        if not products:
            raise SystemExit(
                'Ürün yok. Önce çalıştır: uv run python seeds/seed_products.py'
            )

        for i in range(1, count + 1):
            product = random.choice(products)
            row = await order_service.create_order(
                user_id=user_id,
                product_id=product.id,
                status=random.choice(STATUSES),
            )
            print(
                f'[{i}/{count}] ok order={row.id} '
                f'product_id={row.product_id} product={row.product} '
                f'status={row.status}'
            )

    print('Tamam. Sonraki: uv run python seeds/seed_payments.py')


def main() -> None:
    print('Order seeder')
    count = ask_int('Kaç sipariş oluşturulsun?', default=5)
    user_id = ask_int('Hangi user_id için?', default=15)
    asyncio.run(seed(count=count, user_id=user_id))


if __name__ == '__main__':
    main()
