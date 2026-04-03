# 🚀 SavdoAI — Deploy Qo'llanma

## Variant 1: Railway (Eng oson)

### 1. Railway account ochish
```
https://railway.app → GitHub bilan kirish
```

### 2. Loyihani ulash
```
New Project → Deploy from GitHub → savdoai repo tanlash
```

### 3. PostgreSQL qo'shish
```
+ New → Database → PostgreSQL
DATABASE_URL avtomatik ulanadi
```

### 4. Redis qo'shish
```
+ New → Database → Redis
REDIS_URL avtomatik ulanadi
```

### 5. Environment Variables
```
BOT_TOKEN=1234567890:ABC...         # @BotFather dan
JWT_SECRET=random-32-char-string     # openssl rand -hex 32
GOOGLE_API_KEY=AIza...               # Google AI Studio
ANTHROPIC_API_KEY=sk-ant-...         # Anthropic Console
PORT=8000
```

### 6. Deploy
```
Railway avtomatik deploy qiladi
Healthcheck: https://your-app.railway.app/health
```

### 7. Bot ulash
```
Bot webhook: https://your-app.railway.app/webhook/telegram
```

---

## Variant 2: Docker (VPS)

### 1. Server tayyorlash
```bash
# Ubuntu 22.04+
sudo apt update && sudo apt install -y docker.io docker-compose
```

### 2. Clone va sozlash
```bash
git clone https://github.com/Mashrab1993/savdoai.git
cd savdoai
cp .env.example .env
nano .env  # BOT_TOKEN, API keys to'ldiring
```

### 3. Ishga tushirish
```bash
docker-compose up -d
```

### 4. Tekshirish
```bash
# API health
curl http://localhost:8000/health

# Loglar
docker-compose logs -f api
docker-compose logs -f bot
```

### 5. SSL (HTTPS)
```bash
# Nginx reverse proxy + Let's Encrypt
sudo apt install nginx certbot python3-certbot-nginx
```

---

## Variant 3: Manual (Development)

```bash
# 1. PostgreSQL + Redis o'rnatish
sudo apt install postgresql redis-server

# 2. DB yaratish
sudo -u postgres createdb savdoai

# 3. Python dependencies
pip install -r requirements.txt
pip install -r services/api/requirements.txt
pip install -r services/bot/requirements.txt

# 4. Environment
export DATABASE_URL="postgresql://postgres:password@localhost/savdoai"
export REDIS_URL="redis://localhost:6379/0"
export BOT_TOKEN="your-bot-token"
export JWT_SECRET="your-secret"
export GOOGLE_API_KEY="your-key"

# 5. API server
cd services/api && uvicorn main:app --port 8000

# 6. Bot (boshqa terminal)
python -m services.bot.main
```

---

## Tekshirish checklist

- [ ] `curl /health` — 200 OK
- [ ] `curl /version` — v25.3.2
- [ ] Bot ga /start yuboring — javob keldi
- [ ] Ovoz yuboring — AI javob berdi
- [ ] /kpi — KPI ko'rinadi
- [ ] /tahlil — AI maslahat ishlaydi
- [ ] /eslatma — Qarz eslatma ishlaydi

## Muammolar

| Muammo | Yechim |
|--------|--------|
| Bot javob bermaydi | BOT_TOKEN tekshiring |
| DB ulanmaydi | DATABASE_URL tekshiring |
| AI ishlamaydi | GOOGLE_API_KEY tekshiring |
| 500 xato | `docker-compose logs api` |
