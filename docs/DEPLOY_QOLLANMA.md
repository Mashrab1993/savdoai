# Mashrab Moliya v21.2 — Deploy Qo'llanmasi

## 6 Quti Arxitekturasi

```
┌────────────────────────────────────────────────────────────────┐
│                    20,000+ FOYDALANUVCHI                        │
└──────────┬────────────────────────────┬────────────────────────┘
           │ Telegram                   │ Browser
    ┌──────▼──────┐               ┌─────▼──────┐
    │  4. 🤖 BOT  │               │  WEB APP   │
    │  Railway    │               │  Vercel    │
    └──────┬──────┘               └─────┬──────┘
           │                            │ JWT
           └─────────────┬──────────────┘
                          │
              ┌───────────▼───────────┐
              │   3. 🌐 API           │
              │   FastAPI 4 worker    │
              │   Rate limit 100/min  │
              └───────────┬───────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌───▼──────────┐
    │ 1. 🗄 PSQL  │ │ 2. ⚡REDIS │ │ 6. 🧠 COGEN  │
    │ + RLS       │ │ Cache+Queue│ │ DSc AI Engine│
    │ PostgreSQL  │ │            │ │ Tool Calling │
    └─────────────┘ └──────┬─────┘ └──────────────┘
                            │
              ┌─────────────▼────────────┐
              │   5. 👷 WORKER (Celery)   │
              │   Hisobot, Export, Backup│
              └──────────────────────────┘
```

## Railway Deploy Tartibi

### 1-qadam: PostgreSQL yaratish
```
Railway Dashboard → New → Database → PostgreSQL
DATABASE_URL → Environment Variables ga saqlash
```

### 2-qadam: Redis yaratish
```
Railway Dashboard → New → Database → Redis
REDIS_URL → Environment Variables ga saqlash
```

### 3-qadam: Sxema va RLS yoqish
```bash
psql $DATABASE_URL < shared/database/schema.sql
# Tekshirish:
psql $DATABASE_URL -c "SELECT * FROM rls_holati;"
```

### 4-qadam: API deploy
```
Railway → New Service → GitHub → services/api/
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
```

### 5-qadam: Cognitive Engine deploy
```
Railway → New Service → GitHub → services/cognitive/
startCommand: uvicorn api:app --host 0.0.0.0 --port $PORT --workers 2
```

### 6-qadam: Bot deploy
```
Railway → New Service → GitHub → services/bot/
startCommand: python main.py
```

### 7-qadam: Worker deploy
```
Railway → New Service → GitHub → services/worker/
startCommand: celery -A tasks worker --loglevel=info --concurrency=2
```

### 8-qadam: Web (Vercel)
```
Vercel → Import → GitHub → web/
Framework: Next.js
API_URL: https://mashrab-api.railway.app
```

## Muhit o'zgaruvchilari

| O'zgaruvchi | Qayerda | Nima uchun |
|-------------|---------|-----------|
| BOT_TOKEN | Bot | Telegram bot tokeni |
| DATABASE_URL | Barcha | PostgreSQL DSN |
| REDIS_URL | Barcha | Redis URL |
| ANTHROPIC_API_KEY | Bot + Cognitive | Claude API |
| GEMINI_API_KEY | Bot + Cognitive | Ovoz uchun |
| JWT_SECRET | API | JWT imzolash |
| ADMIN_IDS | Bot | Admin Telegram ID lar |
| WEB_URL | API | CORS uchun |

## RLS Kafolati

**Test qilish:**
```sql
-- 1001 foydalanuvchi sifatida kirish
SELECT set_config('app.uid', '1001', false);

-- Klientlarni so'rash
SELECT * FROM klientlar;
-- Natija: FAQAT user_id=1001 klientlar

-- 1002 foydalanuvchiga o'tish
SELECT set_config('app.uid', '1002', false);
SELECT * FROM klientlar;
-- Natija: FAQAT user_id=1002 klientlar
-- 1001 ning ma'lumotlari KO'RINMAYDI!
```

## Performance (20,000 foydalanuvchi)

| Servis | Instance | RAM | Concurrent |
|--------|----------|-----|------------|
| API | 1 | 1GB | ~2000 req |
| Bot | 1 | 512MB | 10000 user |
| Cognitive | 1 | 1GB | 50 req |
| Worker | 1 | 512MB | 10 task |
| PostgreSQL | 1 | 1GB | 200 conn |
| Redis | 1 | 256MB | 10000 ops |

**Jami narx:** ~$30-40/oy

## Monitoring

```bash
# Servis holati
curl https://mashrab-api.railway.app/health
curl https://mashrab-cognitive.railway.app/health

# Celery worker
celery -A tasks inspect active
celery -A tasks inspect stats

# RLS tekshirish
psql $DATABASE_URL -c "SELECT * FROM rls_holati;"
```
