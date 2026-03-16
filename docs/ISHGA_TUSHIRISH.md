══════════════════════════════════════════════════════════════════
  MASHRAB MOLIYA v21.4 — ISHGA TUSHIRISH QO'LLANMASI
  @mashrab_ceo_bot → Yangi versiya deploy
  
  ESKI BOTNI TO'XTATIB, YANGI v21.4 NI ISHGA TUSHIRISH
══════════════════════════════════════════════════════════════════

MUHIM: Siz hozir Railway da eski bot ishlayapti.
Bu qo'llanma eski botni yangi v21.4 ga ALMASHTIRADI.

══════════════════════════════════════════════════════════════════
  1-QADAM: KERAKLI NARSALAR (OLDINDAN TAYYORLASH)
══════════════════════════════════════════════════════════════════

Sizda bor bo'lishi kerak:
  ✅ GitHub account (repozitoriy uchun)
  ✅ Railway account (https://railway.app) — deploy uchun
  ✅ Telegram Bot Token (@BotFather dan) — @mashrab_ceo_bot uchun
  ✅ Anthropic API Key (Claude uchun) — https://console.anthropic.com
  ✅ Google Gemini API Key — https://aistudio.google.com/apikey
  ✅ Sizning Telegram ID (admin uchun)

Telegram ID olish:
  1. @userinfobot ga /start yuboring
  2. "Your ID: 123456789" — shu raqam

══════════════════════════════════════════════════════════════════
  2-QADAM: GITHUB GA PUSH QILISH
══════════════════════════════════════════════════════════════════

Cursor AI terminal da:

# 1. ZIP ni oching (yoki GitHub repo ga ko'chiring)
# Agar yangi repo:
cd mashrab_moliya
git init
git add -A
git commit -m "v21.4 TURBO — Dual-Brain MoE, Voice-First"
git remote add origin https://github.com/SIZNING_USERNAME/mashrab-moliya.git
git push -u origin main

# Agar eski repo bor:
cd mashrab_moliya
# Eski fayllarni tozalang (tests, shared, services qoldiring)
git add -A
git commit -m "v21.4 TURBO upgrade"
git push origin main --force

══════════════════════════════════════════════════════════════════
  3-QADAM: RAILWAY DA YANGI PROJECT
══════════════════════════════════════════════════════════════════

1. https://railway.app ga kiring
2. "New Project" → "Deploy from GitHub repo"
3. mashrab-moliya repo ni tanlang

YOKI mavjud project da:
1. Settings → General → "Connected Repo" ni yangilang

══════════════════════════════════════════════════════════════════
  4-QADAM: RAILWAY SERVISLAR YARATISH (6 ta)
══════════════════════════════════════════════════════════════════

Railway Dashboard da quyidagi servislarni yarating:

┌─────────────────────────────────────────────────────────┐
│  SERVIS 1: PostgreSQL                                    │
│  Railway → New → Database → PostgreSQL                   │
│  Avtomatik yaratiladi, DATABASE_URL olinadi              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SERVIS 2: Redis                                         │
│  Railway → New → Database → Redis                        │
│  Avtomatik yaratiladi, REDIS_URL olinadi                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SERVIS 3: mashrab-bot (ASOSIY BOT)                      │
│  Railway → New → GitHub Repo → mashrab-moliya            │
│  Settings:                                                │
│    Root Directory: /                                      │
│    Dockerfile Path: services/bot/Dockerfile              │
│    Start Command: python main.py                         │
│                                                           │
│  Variables (MUHIT O'ZGARUVCHILARI):                      │
│    BOT_TOKEN = <BotFather dan olgan token>               │
│    DATABASE_URL = <PostgreSQL dan reference>              │
│    REDIS_URL = <Redis dan reference>                     │
│    ANTHROPIC_API_KEY = sk-ant-...                         │
│    GEMINI_API_KEY = AIza...                               │
│    ADMIN_IDS = <sizning Telegram ID>                     │
│    DB_MIN = 2                                             │
│    DB_MAX = 15                                            │
│    GEMINI_MODEL = gemini-3.1-flash-lite                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SERVIS 4: mashrab-api                                    │
│  Dockerfile Path: services/api/Dockerfile                │
│  Start Command: uvicorn main:app --host 0.0.0.0         │
│                 --port $PORT --workers 4                  │
│                                                           │
│  Variables:                                               │
│    DATABASE_URL = <PostgreSQL reference>                  │
│    REDIS_URL = <Redis reference>                         │
│    JWT_SECRET = <32+ belgili tasodifiy kalit>             │
│    DB_MIN = 5                                             │
│    DB_MAX = 50                                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SERVIS 5: mashrab-worker                                 │
│  Dockerfile Path: services/worker/Dockerfile             │
│  Start Command: celery -A tasks worker                   │
│                 --loglevel=info --concurrency=2           │
│                                                           │
│  Variables:                                               │
│    DATABASE_URL = <PostgreSQL reference>                  │
│    REDIS_URL = <Redis reference>                         │
│    BOT_TOKEN = <bot token>                               │
│    DB_MIN = 1                                             │
│    DB_MAX = 5                                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SERVIS 6: mashrab-cognitive                              │
│  Dockerfile Path: services/cognitive/Dockerfile          │
│  Start Command: uvicorn api:app --host 0.0.0.0          │
│                 --port $PORT --workers 2                  │
│                                                           │
│  Variables:                                               │
│    ANTHROPIC_API_KEY = sk-ant-...                         │
│    GEMINI_API_KEY = AIza...                               │
│    DATABASE_URL = <PostgreSQL reference>                  │
│    REDIS_URL = <Redis reference>                         │
└─────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
  5-QADAM: DATABASE SCHEMA YARATISH
══════════════════════════════════════════════════════════════════

Railway PostgreSQL servisiga ulanib, schema.sql ni ishga tushiring:

USUL 1 — Railway Shell:
  1. PostgreSQL servisini bosing
  2. "Connect" → "Connect via Railway CLI"
  3. Terminal da:
     railway connect
     psql
     \i shared/database/schema.sql

USUL 2 — psql bilan:
  1. PostgreSQL → Variables → DATABASE_URL ni ko'chiring
  2. Terminal da:
     psql "postgresql://user:pass@host:port/db" < shared/database/schema.sql

USUL 3 — pgAdmin/DBeaver:
  1. DATABASE_URL dan host, port, user, pass oling
  2. pgAdmin da connect qilib, schema.sql ni ishga tushiring

Keyin migration:
  psql $DATABASE_URL < shared/migrations/versions/001_v21_3_kassa_vision_faktura.sql

══════════════════════════════════════════════════════════════════
  6-QADAM: ESKI BOTNI TO'XTATISH
══════════════════════════════════════════════════════════════════

MUHIM! Bir vaqtda 2 bot ishlay olmaydi (bir token — bir bot).

1. Railway da eski bot servisini toping
2. Settings → "Remove Service" yoki "Pause"
3. YOKI eski bot boshqa platformada bo'lsa:
   - ssh ile servarga kiring
   - Eski bot processni to'xtating:
     ps aux | grep python
     kill <PID>

Eski bot to'xtaganini tekshiring:
  @mashrab_ceo_bot ga /start yuboring
  → Javob kelmasa = to'xtagan ✅

══════════════════════════════════════════════════════════════════
  7-QADAM: YANGI BOTNI DEPLOY
══════════════════════════════════════════════════════════════════

1. Railway Dashboard → mashrab-bot servisini bosing
2. "Deploy" tugmasini bosing (yoki GitHub push avtomatik trigger)
3. Build loglarni kuzating:
   ✅ "Installing dependencies..."
   ✅ "Build successful"
   ✅ "Deploy successful"

4. Bot loglarini tekshiring:
   ✅ "DB pool tayyor"
   ✅ "Bot xizmatlar tayyor"
   ✅ "Mashrab Moliya Bot v21.4 ENTERPRISE VOICE-FIRST — TAYYOR!"

══════════════════════════════════════════════════════════════════
  8-QADAM: TEKSHIRISH
══════════════════════════════════════════════════════════════════

@mashrab_ceo_bot ga boring va tekshiring:

TEST 1 — /start:
  → "Xush kelibsiz! Mashrab Moliya v21.4" ko'rinishi kerak
  → 16 tugmali menyu ko'rinishi kerak

TEST 2 — /yangilik:
  → v21.4 yangiliklari ko'rinishi kerak

TEST 3 — /yordam:
  → Qanday ishlatish qo'llanmasi

TEST 4 — Ovoz buyruq:
  Yozing: "bugungi hisobot"
  → Kunlik hisobot chiqishi kerak (hali ma'lumot yo'q)

TEST 5 — Ovoz yuboring:
  🎤 "Salom" deb gapiring
  → Bot javob berishi kerak

TEST 6 — /status (admin):
  → Bot holati, DB ping, pool stats

TEST 7 — /kassa:
  → Kassa holati yoki yo'riqnoma

TEST 8 — /health:
  → Bot sog'ligi ma'lumotlari

══════════════════════════════════════════════════════════════════
  9-QADAM: API TEKSHIRISH
══════════════════════════════════════════════════════════════════

Brauzerda:
  https://mashrab-api.railway.app/health
  → {"status":"ok","version":"21.4",...}

  https://mashrab-cognitive.railway.app/health
  → {"status":"ok","architecture":"dual-brain-moe",...}

══════════════════════════════════════════════════════════════════
  XATO BO'LSA NIMA QILISH
══════════════════════════════════════════════════════════════════

XATO: "uvicorn: command not found" (Container Crashed)
  → Railway → Service → Settings → "Start Command" ni BO'SHATING
    (Dockerfile ichidagi start.sh ishlashi uchun)
  → Yoki Start Command ni shunga o'zgartiring:
    python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
  → Cognitive servisi uchun:
    python -m uvicorn api:app --host 0.0.0.0 --port $PORT --workers 2

XATO: "Bot ishlamayapti"
  → Railway → mashrab-bot → Logs → xato xabarini o'qing
  → Ko'pincha: BOT_TOKEN noto'g'ri yoki DATABASE_URL xato

XATO: "DB connection failed"
  → DATABASE_URL to'g'ri ekanini tekshiring
  → PostgreSQL servis ishlayotganini tekshiring
  → schema.sql ishga tushirilganini tekshiring

XATO: "ANTHROPIC_API_KEY missing"
  → Railway Variables da ANTHROPIC_API_KEY ni qo'shing

XATO: "GEMINI_API_KEY missing"  
  → Railway Variables da GEMINI_API_KEY ni qo'shing

XATO: "Eski bot hali ishlayapti"
  → Bir BOT_TOKEN faqat BIR bot da ishlaydi
  → Eski botni albatta TO'XTATING avval

XATO: "Schema tables missing"
  → schema.sql ni qayta ishga tushiring
  → Migration faylni ham ishga tushiring

══════════════════════════════════════════════════════════════════
  NARX (TAXMINIY)
══════════════════════════════════════════════════════════════════

Railway Hobby plan: $5/oy
  + PostgreSQL: ~$5/oy
  + Redis: ~$3/oy
  + 4 servis: ~$15-20/oy
  ─────────────────────
  JAMI: ~$28-33/oy

Anthropic API: ~$5-20/oy (foydalanishga qarab)
Gemini API: BEPUL (flash-lite)

UMUMIY: ~$33-53/oy

══════════════════════════════════════════════════════════════════
  TEZ BOSHLASH (MINIMAL — FAQAT BOT)
══════════════════════════════════════════════════════════════════

Agar faqat botni tez ishga tushirmoqchi bo'lsangiz:

1. Railway da PostgreSQL + Redis yarating
2. schema.sql ni ishga tushiring
3. Faqat mashrab-bot servisini deploy qiling
4. Variables: BOT_TOKEN, DATABASE_URL, REDIS_URL,
   ANTHROPIC_API_KEY, GEMINI_API_KEY, ADMIN_IDS

Bu holatda:
  ✅ Bot ishlaydi
  ✅ Ovoz ishlaydi  
  ✅ Savdo ishlaydi
  ✅ Hisobot ishlaydi
  ❌ Worker (avtomatik hisobot) ishlamaydi
  ❌ API (web dashboard) ishlamaydi
  ❌ Cognitive (alohida AI) ishlamaydi — bot ichida ishlaydi

Keyinchalik boshqa servislarni qo'shishingiz mumkin.