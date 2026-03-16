# Mashrab Moliya v21.5 — Lokal ishga tushirish (100%)

Ushbu qo'llanma tizimni kompyuteringizda to'liq ishga tushirish uchun.

---

## 1. Talablar

- **Python 3.10+**
- **Docker Desktop** (PostgreSQL va Redis uchun) — [docker.com](https://www.docker.com/products/docker-desktop)
- **Telegram Bot Token** — [@BotFather](https://t.me/BotFather) dan
- **Google Gemini API Key** — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Anthropic API Key** (Claude) — [console.anthropic.com](https://console.anthropic.com) (ixtiyoriy, AI uchun)

---

## 2. Loyihani tayyorlash

```powershell
cd c:\Users\Mashrab Hacker\OneDrive\Desktop\savdoai
```

### 2.1 Virtual muhit (tavsiya)

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2.2 Umumiy dependencies

```powershell
pip install -r services/api/requirements.txt
pip install -r services/bot/requirements.txt
pip install -r services/cognitive/requirements.txt
pip install -r services/worker/requirements.txt
```

---

## 3. PostgreSQL va Redis

**Variant A — Docker (tavsiya):**

Docker Desktop o'rnatilgan bo'lsa:

```powershell
docker compose up -d
```

(yoki eski versiya: `docker-compose up -d`)

Tekshirish:
- PostgreSQL: `localhost:5432` (login: postgres, parol: postgres, baza: mashrab)
- Redis: `localhost:6379`

**Variant B — Docker siz:**  
PostgreSQL va Redis ni mahalliy o'rnating. Keyin `.env` da `DATABASE_URL` va `REDIS_URL` ni shu serverlarga moslang. Redis bo'lmasa, `.env` da `REDIS_REQUIRED=false` qo'ying — API cache siz ishlaydi.

---

## 4. Bazani yaratish (schema + migrations)

**Variant A — PowerShell (psql o'rnatilgan bo'lsa):**

```powershell
.\scripts\init_db.ps1
```

**Variant B — Docker orqali:**

```powershell
Get-Content shared\database\schema.sql | docker exec -i mashrab_postgres psql -U postgres -d mashrab
Get-Content shared\migrations\versions\001_v21_3_kassa_vision_faktura.sql | docker exec -i mashrab_postgres psql -U postgres -d mashrab
Get-Content shared\migrations\versions\002_v21_5_sap_grade_ledger.sql | docker exec -i mashrab_postgres psql -U postgres -d mashrab
```

---

## 5. Muhit o'zgaruvchilari (.env)

Loyiha ildizidagi `.env` faylini tahrirlang:

| O'zgaruvchi        | Majburiy | Tavsif |
|--------------------|----------|--------|
| `BOT_TOKEN`        | Ha       | @BotFather dan olgan token |
| `DATABASE_URL`     | Ha       | Lokal uchun: `postgresql://postgres:postgres@localhost:5432/mashrab` |
| `REDIS_URL`        | Ha       | Lokal uchun: `redis://localhost:6379/0` |
| `JWT_SECRET`       | Ha       | Kamida 32 belgi (API auth) |
| `ADMIN_IDS`        | Ha       | Telegram ID (masalan: 123456789). @userinfobot dan olish mumkin |
| `GEMINI_API_KEY`   | Ovoz/AI  | Gemini API kaliti |
| `ANTHROPIC_API_KEY`| Ovoz/AI  | Claude kaliti (ixtiyoriy) |

---

## 6. Servislarni ishga tushirish

Loyiha ildizida (`savdoai`) barcha buyruqlar ishlatiladi.

### 6.1 Bir oynada bittadan (4 ta yangi terminal)

**Terminal 1 — API (port 8000):**
```powershell
$env:PYTHONPATH = (Get-Location).Path
uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Cognitive (port 8001):**
```powershell
$env:PYTHONPATH = (Get-Location).Path
uvicorn services.cognitive.api:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3 — Worker (Celery):**
```powershell
$env:PYTHONPATH = (Get-Location).Path
celery -A services.worker.tasks worker --loglevel=info --pool=solo
```

**Terminal 4 — Bot:**
```powershell
$env:PYTHONPATH = (Get-Location).Path
python -m services.bot.main
```

### 6.2 Skript orqali (4 ta yangi oyna)

```powershell
.\scripts\run_all.ps1
```

Bu skript 4 ta yangi PowerShell oynasini ochadi va har birida bitta servisni ishga tushiradi.

---

## 7. Tekshirish

| Qayerda            | URL yoki amal |
|--------------------|----------------|
| API health         | Brauzerda: http://localhost:8000/health |
| Cognitive health  | http://localhost:8001/health |
| Bot                | Telegramda @BOT_USERNAME ga /start |

---

## 8. Testlar

```powershell
$env:PYTHONPATH = (Get-Location).Path
python -m pytest tests/ -v
```

---

## 9. Muammolar

**"JWT_SECRET muhit o'zgaruvchisi o'rnatilmagan"**  
→ `.env` faylida `JWT_SECRET=...` (kamida 32 belgi) bo'lishi kerak. Loyiha ildizidan ishga tushiring va `.env` ni o'qing (python-dotenv ishlatiladi).

**"DB connection failed"**  
→ `docker-compose up -d` bajarilganini va `init_db` (schema + migrations) ishlatilganini tekshiring.

**"Bot ishlamayapti"**  
→ `.env` da `BOT_TOKEN` va `ADMIN_IDS` to'g'ri ekanini tekshiring.

**Redis xato (readyz 503)**  
→ Lokal rejimda `.env` da `REDIS_REQUIRED=false` qo'yishingiz mumkin; API shunda Redis siz ishlaydi (cache siz).

---

Tizim 100% ishga tushgach, barcha agentlar (API, Bot, Cognitive, Worker) birga ishlaydi.
