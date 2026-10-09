#!/usr/bin/env python3
"""Product seeder — katalog ürünlerini yazar.

Kullanım (proje kökünden):
  uv run python seeds/seed_products.py

Not: Order şeması product_id kullanır. Eski şema varsa migrate / tabloları yenile.
"""

from __future__ import annotations

import asyncio

from fastapi import HTTPException

from _common import PROJECT_ROOT, ask_int
from core.database import AsyncSessionLocal, init_models
from services.product_service import ProductService

CATALOG = [
    ('MacBook Air', 45000.0, '13 inç dizüstü bilgisayar'),
    ('Klavye', 1200.0, 'Mekanik klavye'),
    ('Mouse', 800.0, 'Kablosuz mouse'),
    ('Monitor', 9000.0, '27 inç monitör'),
    ('Kulaklık', 2500.0, 'Noise cancelling kulaklık'),
    ('USB-C Hub', 1500.0, 'Çoklu port hub'),
    ('Laptop Çantası', 900.0, '15 inç laptop çantası'),
]


async def seed(*, count: int) -> None:
    await init_models(create=True)
    items = CATALOG[:count]
    print(f'{len(items)} ürün oluşturulacak…')
    print(f'DB dizini: {PROJECT_ROOT}')

    async with AsyncSessionLocal() as db:
        service = ProductService(db)
        for i, (name, price, description) in enumerate(items, start=1):
            try:
                row = await service.create_product(
                    name=name,
                    price=price,
                    description=description,
                )
                print(
                    f'[{i}/{len(items)}] ok id={row.id} '
                    f'name={row.name} price={row.price}'
                )
            except HTTPException as exc:
                if exc.status_code == 409:
                    print(f'[{i}/{len(items)}] skip name={name} (zaten var)')
                    continue
                raise

    print('Tamam. Sonraki: uv run python seeds/seed_orders.py')


def main() -> None:
    print('Product seeder')
    count = ask_int(
        'Kaç ürün oluşturulsun?',
        default=len(CATALOG),
        min_value=1,
    )
    count = min(count, len(CATALOG))
    asyncio.run(seed(count=count))


if __name__ == '__main__':
    main()
