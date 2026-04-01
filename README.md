# SavdoAI Mashrab Moliya v25.3

**O'zbek savdogarlari uchun AI-powered savdo boshqaruv tizimi.**

Telegram bot + Web panel + REST API — ovoz bilan sotuv, AI tahlil, SAP-grade buxgalteriya.

**Bot:** @savdoai_mashrab_bot | **Stack:** Python 3.12 + Next.js 16 + PostgreSQL + Redis

---

## Ko'rsatkichlar

| | Qiymat |
|---|---|
| Python kodi | 28,800+ qator |
| Web frontend | 14,800+ qator |
| Fayllar | 200+ |
| Testlar | 1,239 (1,084 pytest + 155 inline) |
| DB jadvallar | 27 (RLS + FK) |
| Bot komandalar | 36 |
| API endpointlar | 67 (Swagger tagged) |
| Pydantic model | 24 |
| Web sahifalar | 15 |
| AI modellari | Gemini 2.5 Pro + Claude Sonnet 4.6 (MoE) |

## Arxitektura

```
┌──────────────────────────────────────────────┐
│                  Railway                      │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │   API    │  │   Bot    │  │ Cognitive  │ │
│  │ FastAPI  │  │ Telegram │  │ AI Router  │ │
│  │  :8000   │  │ polling  │  │   :8090    │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘ │
│       │             │               │        │
│       ▼             ▼               │        │
│  ┌──────────────────────┐          │        │
│  │  PostgreSQL (27 tbl) │◄─────────┘        │
│  │  Row-Level Security  │                   │
│  └──────────────────────┘                   │
│       ▲                                      │
│  ┌────┴─────┐  ┌──────────┐                │
│  │  Redis   │  │  Worker  │                │
│  │ (cache)  │  │  Celery  │                │
│  └──────────┘  └──────────┘                │
│                                              │
│  ┌──────────────────────┐                  │
│  │  Web (Next.js 16)    │                  │
│  │  15 sahifa + PWA     │                  │
│  └──────────────────────┘                  │
└──────────────────────────────────────────────┘
```

## Xususiyatlar

### Telegram Bot
- Ovoz bilan sotuv kiritish (O'zbek tilida)
- Matn bilan kirim/chiqim/qaytarish
- Rasm OCR (hujjat skanerlash)
- AI tahlil (Gemini + Claude dual-brain)
- Narx guruhlari (ulgurji/chakana/VIP)
- Shogird xarajat nazorati
- Nakladnoy/faktura chiqarish
- Thermal printer chek chop etish

### Web Panel (15 sahifa)
- Dashboard (KPI, grafiklar, kam qoldiq alert)
- Sotuv (savat tizimi, klient tanlash, to'lov)
- Tovarlar CRUD (import/export Excel)
- Klientlar CRUD (tarix drawer)
- Qarzlar (qisman to'lash)
- Savdolar (filtr, detail modal)
- Hisobotlar (kunlik/haftalik/oylik/foyda)
- Xarajatlar, Kassa, Narx guruhlari
- Settings (profil + parol)
- Global qidiruv
- Telegram Mini App (auto-login)

### API (72 endpoint)
- JWT autentifikatsiya (bot + login + Mini App)
- CRUD: tovar, klient, qarz, xarajat
- Hisobotlar: kunlik, haftalik, oylik, foyda tahlili
- SAP-grade double-entry ledger
- Excel/PDF export
- Real-time WebSocket
- Swagger UI: `/docs`

### Xavfsizlik
- Row-Level Security (PostgreSQL)
- JWT (HMAC-SHA256)
- Rate limiting (login 5/min, export 3/min)
- LIKE injection himoyasi (like_escape)
- Whitelist validatsiya (PUT/PATCH)
- 0 SELECT *, 0 RETURNING *, 0 bare except

## Tez boshlash

```bash
# 1. Clone
git clone https://github.com/Mashrab1993/savdoai.git
cd savdoai

# 2. Environment
cp .env.example .env
# .env da DATABASE_URL, BOT_TOKEN, API kalitlarini to'ldiring

# 3. API
cd services/api
pip install -r ../../requirements.txt
PYTHONPATH=../.. uvicorn main:app --port 8000

# 4. Bot
cd services/bot
PYTHONPATH=../.. python main.py

# 5. Web
cd services/web
npm install --legacy-peer-deps
npm run dev

# 6. Test
PYTHONPATH=. pytest tests/ -q
```

## Railway Deploy

```bash
git push origin main  # avtomatik deploy
```

Servislar: API (`web`), Bot (`savdoai`), Web (`savdoai-web`), Postgres, Redis

Batafsil: `RUNBOOK.md`, `docs/RAILWAY_TOPOLOGY.md`

## Hujjatlar

| Fayl | Mazmun |
|---|---|
| `docs/API_DOCUMENTATION.md` | 72 endpoint to'liq hujjat |
| `docs/BOT_BUYRUQLAR.md` | Bot buyruqlari |
| `docs/DEVELOPER_GUIDE.md` | Developer onboarding |
| `docs/TAKLIFLAR_HOLAT.md` | 40 taklif holati |
| `RUNBOOK.md` | Deploy va operatsion qo'llanma |
| `BLOCKERS.md` | Ma'lum muammolar |

## Litsenziya

Private — Mashrab Moliya
