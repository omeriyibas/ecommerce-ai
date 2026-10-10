# ecommerce-ai

Sipariş, ödeme ve mağaza belgeleri için AI destek asistanı. Panelden yazıyorsun; sistem doğru uzmana yolluyor. İptal ve ödeme otomatik olmaz — **Onaylar** sayfasından geçer.

| Klasör | Ne |
|--------|-----|
| `ecommerce-ai-api` | FastAPI, AI graph, RAG, Postgres, Redis |
| `ecommerce-ai-panel` | Destek, Onaylar, Belgeler, ürün/sipariş/ödeme |

Ana dizini GitHub’a (`.env` ignore): `./scripts/github-push.sh`  
Alt klasörlerin kendi remote’ları bozulmaz.

---

## Nasıl çalışır?

1. Mesaj gelir (“Siparişlerimi göster”, “İade politikası?”, “Son ürünü araştır”).
2. Yönlendirici seçer: genel / sipariş / ödeme / ikisi / araştırma / rag (belge).
3. Uzman tool kullanır; uydurma yok.
4. Liste varsa metinde yalnız **adet** yazılır; detay panel listesinde.
5. İptal veya ödeme → Onaylar’da Onayla / Reddet.
6. Belge soruları → yüklenmiş PDF’lerde hybrid RAG (dense + BM25 + rerank).

```
Soru → classify → uzman(lar) → compose → cevap
```

![Support graph](ecommerce-ai-api/docs/graph-flow.svg)


---

## Onay gerekenler

| İş | Sonuç |
|----|--------|
| Siparişi iptal et | Onay sonrası iptal |
| Siparişi öde | Onay sonrası `paid` |

Listeleme, durum ve belge arama onay istemez.

---

## Ne sorabilirsin?

- Siparişlerimi göster
- Ödemelerimi listele
- 3 numaralı siparişimin ödemesini yap → Onaylar
- 3 numaralı siparişimi iptal et → Onaylar
- İade politikanız nedir? → RAG (Belgeler’de PDF gerekir)
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


uv run python main.py
# veya: ./scripts/run.sh
```

Şema Alembic ile yönetilir. Model değişince:

```bash
uv run alembic revision --autogenerate -m "açıklama"
uv run alembic upgrade head
```

CLI: `uv run python cli.py` (`.env` → `DEFAULT_USER_ID`).

### Belgeler (RAG)

Panelde **Belgeler** sayfasından PDF yükle (iade, kargo, garanti…).  
Destek sohbetinde “İade politikası?” gibi sorular bu belgelerden cevaplanır.  
Her kullanıcı yalnız kendi yüklediği dosyaları görür; belge yoksa asistan uyarır.

İsteğe bağlı CLI: `uv run python cli_rag.py`

### Testler

```bash
cd ecommerce-ai-api
./tests/ai/run_tests.sh          # unit: router, order, payment, rag, validator (LLM yok)
./tests/ai/run_tests.sh --eval   # router eval (gerçek LLM, .env)
```

### Panel

```bash
cd ecommerce-ai-panel
pnpm install
pnpm dev
```

API’ye JWT ile bağlanır. Menü: Ürünler, Siparişler, Ödemeler, **Belgeler**, Destek, Onaylar.

---

## Kısa kurallar

- Her kullanıcı yalnız kendi verisini / belgelerini görür
- Belirsiz siparişte listele ve sor; geçmişte seçim varsa tekrar listeleme
- Liste detayı panelde; sohbet metninde satır satır döküm yok
- Cevaplar Türkçe ve kısa
- Prompt’a validator’ın zaten yaptığını yazma
