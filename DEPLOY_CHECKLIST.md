# DEPLOY CHECKLIST — SavdoAI v25.3

## 1. Git Push
```bash
git add -A
git commit -m "✅ v25.3: 72 endpoint, 1350 test, xavfsizlik audit toza"
git push origin main
```

## 2. Railway Variables (bir marta o'rnatish)

### API servis (`web` dashboard da)
| Variable | Qiymat | Izoh |
|----------|--------|------|
| DATABASE_URL | avtomatik | Postgres servisdan |
| REDIS_URL | avtomatik | Redis servisdan |
| JWT_SECRET | `openssl rand -hex 32` | **Bot bilan bir xil!** |
| BOT_TOKEN | BotFather dan | Mini App auth uchun |
| WEB_URL | `https://savdoai-web-production.up.railway.app` | CORS uchun |
| SENTRY_DSN | (ixtiyoriy) | Xato monitoring |

### Bot servis (`savdoai` dashboard da)
| Variable | Qiymat | Izoh |
|----------|--------|------|
| DATABASE_URL | avtomatik | Postgres servisdan |
| REDIS_URL | avtomatik | Redis servisdan |
| BOT_TOKEN | BotFather dan | Polling uchun |
| JWT_SECRET | **API bilan bir xil!** | /token buyrug'i uchun |
| ANTHROPIC_API_KEY | Anthropic dan | AI tahlil |
| GEMINI_API_KEY | Google dan | Ovoz + AI |
| ADMIN_IDS | Sizning Telegram ID | Admin tekshiruv |

### Web servis (`savdoai-web` dashboard da)
| Variable | Qiymat | Izoh |
|----------|--------|------|
| NEXT_PUBLIC_API_URL | `https://web-production-30ebb.up.railway.app` | **Build-time! Redeploy kerak** |

## 3. Railway Redeploy

O'zgartirgandan keyin **savdoai-web** servisni qayta deploy qiling:
- savdoai-web → Deployments → Redeploy

## 4. Tekshirish

```bash
# API ishlayaptimi?
curl https://web-production-30ebb.up.railway.app/healthz
# → {"status":"ok","version":"25.3"}

# Swagger
# Brauzerda: https://web-production-30ebb.up.railway.app/docs

# Web panel
# Brauzerda: https://savdoai-web-production.up.railway.app
# → Login sahifasi ko'rinishi kerak

# Bot
# Telegram da botga /ping yuboring
# → 🏓 Pong! javob kelishi kerak
```

## 5. Login test

```
# 1-usul: Token bilan
Telegram botga /token yuboring → token nusxalang → Web panel → Token tab → paste

# 2-usul: Login/parol
Telegram botga /parol <user_id> <login> <parol> yuboring
Web panel → Login tab → login + parol kiriting
```

## 6. Mini App (ixtiyoriy)

BotFather da:
```
/setmenubutton
→ Botni tanlang
→ URL: https://savdoai-web-production.up.railway.app/tg
→ Button text: 📱 SavdoAI
```

## 7. Monitoring (ixtiyoriy)

- Sentry: `SENTRY_DSN` env variable qo'shing (3 servisga)
- Health: `https://web-production-30ebb.up.railway.app/health` (DB + Redis ping)
