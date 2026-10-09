# ecommerce-ai

Sipariş ve ödeme için AI destek asistanı. Panelden yazıyorsun; sistem doğru uzmana yolluyor. İptal ve ödeme otomatik olmaz — **Onaylar** sayfasından geçer.

| Klasör | Ne |
|--------|-----|
| `ecommerce-ai-api` | FastAPI, AI graph, Postgres, Redis |
| `ecommerce-ai-panel` | Destek sohbeti, Onaylar, ürün/sipariş/ödeme CRUD |

Ana dizini GitHub’a (`.env` ignore): `./scripts/github-push.sh`  
Alt klasörlerin kendi remote’ları bozulmaz.

---

## Nasıl çalışır?

1. Mesaj gelir (“Siparişlerimi göster”, “3 numaralıyı öde”, “Son ürünü araştır”).
2. Yönlendirici seçer: genel / sipariş / ödeme / ikisi / araştırma.
3. Uzman tool kullanır; uydurma yok.
4. Liste varsa metinde yalnız **adet** yazılır; ürün ve tutar panel listesinde çıkar.
5. İptal veya ödeme → Onaylar’da Onayla / Reddet.

```
Soru → yönlendir → uzman → birleştir → cevap
```

![Akış](ecommerce-ai-api/docs/graph-flow.svg)

---

## Onay gerekenler

| İş | Sonuç |
|----|--------|
| Siparişi iptal et | Onay sonrası iptal |
| Siparişi öde | Onay sonrası `paid` |

Listeleme ve durum sorma onay istemez.

---

## Ne sorabilirsin?

- Siparişlerimi göster
- Ödemelerimi listele
- 3 numaralı siparişimin ödemesini yap → Onaylar
- 3 numaralı siparişimi iptal et → Onaylar
- Son siparişimdeki ürünü araştır
- Merhaba (araştırmaya düşmez)

---

## Çalıştırma

### API

```bash
cd ecommerce-ai-api
uv sync
cp .env.example .env   # OPENAI_API_KEY, DATABASE_URL, …
uv run alembic upgrade head

uv run python seeds/seed_products.py
uv run python seeds/seed_orders.py
uv run python seeds/seed_payments.py

uv run python main.py
# veya: ./scripts/run.sh
```

Şema Alembic ile yönetilir. Model değişince:

```bash
uv run alembic revision --autogenerate -m "açıklama"
uv run alembic upgrade head
```

CLI: `uv run python cli.py` (`.env` → `DEFAULT_USER_ID`).

### Panel

```bash
cd ecommerce-ai-panel
pnpm install
pnpm dev
```

API’ye JWT ile bağlanır.

---

## Kısa kurallar

- Her kullanıcı yalnız kendi verisini görür
- Belirsiz siparişte listele ve sor; geçmişte seçim varsa tekrar listeleme
- Liste detayı panelde; sohbet metninde satır satır döküm yok
- Cevaplar Türkçe ve kısa
- Prompt’a validator’ın zaten yaptığını yazma
