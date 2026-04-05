# 🤖 SavdoAI v25.3.2a

**O'zbekiston savdogarlari uchun AI-powered savdo boshqaruv tizimi**

Telegram bot + Web panel + FastAPI backend + PostgreSQL + Redis

[![Tests](https://img.shields.io/badge/tests-1564%20passed-brightgreen)]()
[![Endpoints](https://img.shields.io/badge/API-107%20endpoints-blue)]()
[![Version](https://img.shields.io/badge/version-25.3.2a-blue)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()

---

## 🎯 Nima uchun SavdoAI?

| Xususiyat | SavdoAI | Raqobatchilar |
|-----------|---------|---------------|
| 🎤 Ovoz bilan sotuv | ✅ O'zbek 8 sheva + Tojik | ❌ |
| 🤖 AI hisob-kitob | ✅ Dual-Brain (Gemini + Claude) | ❌ |
| 📱 Telegram-native | ✅ App o'rnatish shart emas | ❌ |
| 📊 SAP-grade buxgalteriya | ✅ Double-entry ledger | ❌ |
| 🔒 20,000+ user izolyatsiya | ✅ PostgreSQL RLS | ❌ |
| ⚡ Boshlash vaqti | 5 daqiqa | 3-7 kun |
| 💰 Narx | Bepul* | Qimmat |

*14 kun bepul sinov

---

## 🚀 Tez boshlash

```bash
# 1. Clone
git clone https://github.com/Mashrab1993/savdoai.git
cd savdoai

# 2. Environment
cp FINAL_ENV_EXAMPLE.md .env  # kerakli env variable larni to'ldiring
# Majburiy: DATABASE_URL, JWT_SECRET, BOT_TOKEN

# 3. Docker bilan
docker-compose up -d

# 4. Yoki qo'lda
pip install -r requirements.txt
python -m uvicorn services.api.main:app --port 8000
python -m services.bot.main
```

---

## 📋 Arxitektura

```
┌──────────────────────────────────────────────────┐
│                    KLIENT                          │
│  Telegram (Ovoz/Matn/Rasm) │ Web Panel │ Android  │
└─────────────┬────────────────┬─────────┬─────────┘
              │                │         │
┌─────────────▼────────┐  ┌───▼─────────▼──────────┐
│    TELEGRAM BOT       │  │      FastAPI API        │
│  services/bot/        │  │   services/api/         │
│  main.py + 12 handler │  │   main.py (50 endpoint) │
│  Gemini STT + Claude  │  │   routes/ (57 endpoint) │
└──────────┬───────────┘  └──────────┬──────────────┘
           │                         │
           └────────────┬────────────┘
                        │
           ┌────────────▼────────────┐
           │     SHARED SERVICES     │
           │   28 modul (AI, KPI,    │
           │   Loyalty, Ledger, ...) │
           └────────────┬────────────┘
                        │
        ┌───────────────┼───────────────┐
   ┌────▼─────┐   ┌────▼─────┐   ┌────▼──────┐
   │PostgreSQL │   │  Redis   │   │ Next.js   │
   │ 40 jadval │   │  Cache   │   │ 21 sahifa │
   │ 52 index  │   │  Rate    │   │ React     │
   │ 35 RLS    │   │  Lock    │   │ Tailwind  │
   └──────────┘   └──────────┘   └───────────┘
```

### Railway Deploy Topologiya

```
Railway Project (f9933a08)
├── web          → FastAPI API  (⚠️ nomga aldanmang!)
├── savdoai      → Telegram Bot
├── savdoai-web  → Next.js Frontend
├── Postgres     → Ma'lumotlar bazasi
└── Redis        → Cache + Rate limiting
```

⚠️ **MUHIM:** `NEXT_PUBLIC_API_URL` doim FastAPI servisiga yo'naltirilishi kerak (bot emas!)

---

## 📊 Tizim ko'rsatkichlari

| Ko'rsatkich | Qiymat |
|---|---|
| API endpointlar | 107 ta |
| DB jadvallar | 40 ta |
| DB indekslar | 52 ta |
| RLS policylar | 35 ta |
| Testlar | 1564 ta (100% pass) |
| Python modullari | 87 ta |
| Bot buyruqlari | 31+ ta |
| Web sahifalar | 21 ta |

---

## 📦 14 ta tizim

| # | Tizim | Buyruq | Fayl |
|---|-------|--------|------|
| 1 | 🧠 AI Business Advisor | `/tahlil` | `ai_advisor.py` |
| 2 | 📨 Qarz eslatma | `/eslatma` | `qarz_eslatma.py` |
| 3 | 📊 KPI Engine | `/kpi` | `kpi_engine.py` |
| 4 | ⭐ Loyalty ball | `/loyalty` | `loyalty.py` |
| 5 | 💳 Click/Payme | webhook | `tolov_integratsiya.py` |
| 6 | 📦 Ombor prognoz | `/buyurtma` | `ombor_prognoz.py` |
| 7 | 🏪 Multi-filial | API | `routes/filial.py` |
| 8 | 📍 GPS tracking | 📍 Location | `gps_tracking.py` |
| 9 | 🚛 Supplier order | `/buyurtma` | `supplier_order.py` |
| 10 | 🔔 Smart notify | Auto | `smart_notification.py` |
| 11 | 🛡 Smart sale | Ichki | `smart_sale.py` |
| 12 | 💎 Freemium | `/tariflar` | `subscription.py` |
| 13 | 🇹🇯 Tojik tili | NLP | `uzb_nlp.py` |
| 14 | 🎯 Klient segment | `/segment` | `klient_segment.py` |

---

## 🧪 Testlar

```bash
# Barcha testlar
pytest tests/ -q

# Natija: 1564 passed, 0 failed
```

---

## 🔒 Xavfsizlik

- **RLS (Row Level Security)** — Har so'rovda `SET app.uid` — 20,000+ user izolyatsiyasi
- **HMAC-SHA256** — JWT va Telegram auth
- **PBKDF2** — Parol hash (100K iterations, salt)
- **Rate limiting** — IP, login, endpoint-spesifik
- **Field whitelisting** — Dynamic UPDATE larda ruxsat etilgan maydonlar
- **like_escape()** — LIKE querylar uchun injection himoyasi
- **Decimal(28)** — Moliyaviy hisob-kitobda float xatosi 0%

---

## 📞 Aloqa

- Telegram: [@savdoai_mashrab_bot](https://t.me/savdoai_mashrab_bot)
- GitHub: [github.com/Mashrab1993/savdoai](https://github.com/Mashrab1993/savdoai)
