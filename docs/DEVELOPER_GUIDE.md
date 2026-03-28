# SavdoAI — Developer Onboarding Guide

## Loyiha haqida

SavdoAI Mashrab Moliya v25.3 — O'zbek savdogarlari uchun AI-powered savdo boshqaruv tizimi.

**Asosiy xususiyatlar:**
- Telegram bot (ovoz + matn bilan sotuv kiritish)
- Web panel (dashboard, hisobotlar, CRUD)
- AI tahlil (Gemini + Claude dual-brain)
- Thermal printer chek chiqarish
- SAP-grade double-entry ledger

---

## Arxitektura

```
┌─────────────────────────────────────────────┐
│                   Railway                    │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐   │
│  │   API   │  │   Bot   │  │Cognitive │   │
│  │ FastAPI │  │Telegram │  │ AI Router│   │
│  │ :8080   │  │ polling │  │  :8090   │   │
│  └────┬────┘  └────┬────┘  └─────┬────┘   │
│       │            │              │         │
│       ▼            ▼              │         │
│  ┌─────────────────────┐         │         │
│  │    PostgreSQL (RLS)  │◄────────┘         │
│  └─────────────────────┘                   │
│       ▲                                     │
│       │                                     │
│  ┌────┴────┐  ┌─────────┐                  │
│  │  Redis  │  │ Worker  │                  │
│  │ (cache) │  │ Celery  │                  │
│  └─────────┘  └─────────┘                  │
│                                             │
│  ┌─────────────────────┐                   │
│  │   Web (Next.js 16)  │                   │
│  │   Static + SSR      │                   │
│  └─────────────────────┘                   │
└─────────────────────────────────────────────┘
```

---

## Loyiha tuzilishi

```
savdoai-main/
├── services/
│   ├── api/            ← FastAPI REST API
│   │   ├── main.py     ← Barcha endpointlar (2600+ qator)
│   │   ├── deps.py     ← get_uid, rate limiting
│   │   └── routes/     ← WebSocket, kassa router
│   │
│   ├── bot/            ← Telegram bot
│   │   ├── main.py     ← Handler registration (5000+ qator)
│   │   ├── db.py       ← Bot database funksiyalari
│   │   ├── config.py   ← Bot konfiguratsiyasi
│   │   └── bot_services/ ← Yordamchi modullar
│   │
│   ├── cognitive/      ← AI xizmati
│   │   ├── api.py      ← FastAPI gateway
│   │   ├── engine.py   ← Sotuv uchun NLP + AI
│   │   └── ai_router.py ← Gemini/Claude routing
│   │
│   ├── web/            ← Next.js frontend
│   │   ├── app/        ← 14 sahifa (dashboard, sales, search, clients, etc.)
│   │   ├── components/ ← UI komponentlar (sidebar, top-header, bottom-nav)
│   │   ├── hooks/      ← 4 ta hook (use-api, use-mobile, use-toast, use-websocket)
│   │   └── lib/        ← API client, types, normalizers, services
│   │
│   └── worker/         ← Celery background tasks
│
├── shared/
│   ├── database/
│   │   ├── schema.sql  ← Yagona DB schema
│   │   └── pool.py     ← Connection pool (RLS)
│   ├── services/       ← Umumiy biznes logika
│   │   ├── smart_narx.py  ← Narx aniqlash
│   │   ├── ledger.py      ← SAP-grade buxgalteriya
│   │   └── ...
│   ├── utils/
│   │   ├── hisob.py    ← Hisob-kitob (Decimal)
│   │   └── uzb_nlp.py  ← O'zbek NLP parser
│   └── cache/          ← Redis cache helpers
│
├── tests/              ← Pytest testlar (1000+)
├── docs/               ← Hujjatlar
└── .github/workflows/  ← CI/CD
```

---

## Local ishga tushirish

### 1. Environment o'rnatish

```bash
# Python 3.12 kerak
python3 --version

# Dependencies
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# .env da to'ldiring:
#   DATABASE_URL=postgresql://...
#   BOT_TOKEN=...
#   GEMINI_API_KEY=...
#   ANTHROPIC_API_KEY=...
```

### 2. Testlar ishga tushirish

```bash
# Barcha testlar
PYTHONPATH=. python3 -m pytest tests/ -v

# Faqat titan testlar
PYTHONPATH=. python3 -m pytest tests/test_titan_v2.py -v

# Inline testlar
PYTHONPATH=. python3 -m shared.utils.hisob
PYTHONPATH=. python3 -m shared.utils.uzb_nlp
PYTHONPATH=. python3 -m services.cognitive.engine
```

### 3. Servislarni ishga tushirish

```bash
# API
cd services/api && uvicorn main:app --port 8080

# Bot
cd services/bot && python3 main.py

# Web
cd services/web && pnpm install && pnpm dev
```

---

## Muhim qoidalar

### Database
- **RLS** (Row-Level Security) — har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi
- `rls_conn(uid)` — API da ishlatiladi, `user_id` avtomatik filter
- **SELECT * ishlatmang** — faqat kerakli ustunlarni ko'rsating
- **RETURNING * ishlatmang** — aniq ustunlar qaytaring

### Xavfsizlik
- Barcha CRUD endpointlarda `WHERE user_id=$N` **majburiy** (defense-in-depth)
- PUT/PATCH da **whitelist** — faqat ruxsat etilgan maydonlar
- LIKE query da `like_escape()` ishlatish (SQL injection himoyasi)
- Login: 5 urinish/daqiqa rate limit
- Export: 3/daqiqa, Sotuv: 30/daqiqa, Import: 5/daqiqa

### Hisob-kitob
- `Decimal` ishlatish — `float` emas!
- `shared/utils/hisob.py` — barcha hisob funksiyalar
- AI hech qachon hisobni o'zi qilmaydi — faqat `hisob.py` orqali

### Testlar
- **Yangi endpoint qo'shsangiz — test yozing!**
- `tests/test_titan_v2.py` — yangi funksiyalar uchun (356 test)
- Inline testlar buzilmasligi kerak (155 test)
- CI: `ruff check --select=E9,F63,F7,F82` — xatosiz bo'lishi shart

### Swagger
- Barcha endpointlar `tags=["Guruh"]` bilan belgilangan
- `/docs` da 14 ta guruhda ko'rinadi

---

## Tez-tez ishlatiladigan buyruqlar

```bash
# Lint (CI da ham ishlaydi)
ruff check shared/ services/ --select=E9,F63,F7,F82

# Barcha testlar
PYTHONPATH=. pytest tests/ -q

# Bitta test file
PYTHONPATH=. pytest tests/test_titan_v2.py -v

# Git deploy
git add -A
git commit -m "fix: <tavsif>"
git push origin main  # Railway avtomatik deploy
```

---

## API endpoint soni: 66+

Barcha endpointlar Swagger bilan tag'langan — `/docs` da ko'ring.

To'liq ro'yxat: `docs/API_DOCUMENTATION.md`

Bot buyruqlari: `docs/BOT_BUYRUQLAR.md`

Takliflar holati: `docs/TAKLIFLAR_HOLAT.md`
