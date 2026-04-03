# 🤖 SavdoAI v25.3.2

**O'zbekiston savdogarlari uchun AI-powered savdo boshqaruv tizimi**

Telegram bot + Web panel + FastAPI backend + PostgreSQL + Redis

[![Tests](https://img.shields.io/badge/tests-1356%20passed-brightgreen)]()
[![Version](https://img.shields.io/badge/version-25.3.2-blue)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()

---

## 🎯 Nima uchun SavdoAI?

| Xususiyat | SavdoAI | Raqobatchilar |
|-----------|---------|---------------|
| 🎤 Ovoz bilan sotuv | ✅ O'zbek 8 sheva + Tojik | ❌ |
| 🤖 AI hisob-kitob | ✅ Dual-Brain (Gemini + Claude) | ❌ |
| 📱 Telegram-native | ✅ App o'rnatish shart emas | ❌ |
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
cp .env.example .env
# BOT_TOKEN, GOOGLE_API_KEY, ANTHROPIC_API_KEY ni to'ldiring

# 3. Docker bilan ishga tushirish
docker-compose up -d

# 4. Yoki qo'lda
pip install -r requirements.txt
python -m uvicorn services.api.main:app --port 8000
python -m services.bot.main
```

---

## 📋 Arxitektura

```
┌─────────────────────────────────────────────┐
│                 TELEGRAM                      │
│         (Ovoz / Matn / Rasm / GPS)           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            TELEGRAM BOT                       │
│     services/bot/main.py (933 qator)         │
│     handlers/ (12 modul)                     │
└──────────┬───────────────────┬──────────────┘
           │                   │
┌──────────▼───────┐ ┌────────▼──────────────┐
│  COGNITIVE AI     │ │    FastAPI SERVER      │
│  Gemini 2.5 Pro   │ │  services/api/main.py  │
│  (STT/OCR/NLP)    │ │  routes/ (11 modul)    │
│  Claude Sonnet    │ │  deps.py (auth)        │
│  (mantiq/hisob)   │ └────────┬──────────────┘
└──────────────────┘          │
                    ┌─────────▼──────────────┐
                    │     SHARED SERVICES     │
                    │  15 servis moduli       │
                    │  (AI Advisor, KPI,      │
                    │   Loyalty, GPS, ...)    │
                    └─────────┬──────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼───┐  ┌───────▼────┐  ┌───────▼────┐
    │ PostgreSQL   │  │   Redis    │  │   Web UI   │
    │ 42 jadval    │  │  Cache     │  │  Next.js   │
    │ 57 index     │  │  Rate lim  │  │  React     │
    │ RLS himoya   │  │  Sessions  │  │  Tailwind  │
    └──────────────┘  └────────────┘  └────────────┘
```

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

# Faqat yangi tizimlar
pytest tests/test_v25_3_2_systems.py -v

# Integratsiya testlar
pytest tests/test_v25_3_2_integration.py -v

# NLP testlar
python shared/utils/uzb_nlp.py

# Hisob-kitob testlar
python -c "from shared.utils.hisob import _test; _test()"
```

**1356 test | 0 failed | 138 Python fayl**

---

## 💎 Tarif planlari

| | Boshlang'ich | O'rta | Biznes |
|---|---|---|---|
| Narx | **BEPUL** | 49,000/oy | 149,000/oy |
| Tovarlar | 50 | 500 | Cheksiz |
| Sotuvlar | 100/oy | 2000/oy | Cheksiz |
| KPI | ❌ | ✅ | ✅ |
| Loyalty | ❌ | ✅ | ✅ |
| GPS | ❌ | ❌ | ✅ |

14 kun bepul sinov — barcha funksiyalar ochiq!

---

## 📞 Aloqa

- Telegram: @savdoai_bot
- GitHub: github.com/Mashrab1993/savdoai
