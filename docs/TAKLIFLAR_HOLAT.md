# SavdoAI v25.3 — 40 Taklif Holati

## ✅ QILINDI (30 ta — 75%)

| # | Taklif | Natija |
|---|--------|--------|
| 1 | smart_narx crash fix | `c.sotish_narxi AS narx` |
| 2 | user_id filtr | 6+ endpoint himoyalandi |
| 4 | bare except 27 ta | `except Exception:` ga o'zgartirildi |
| 6 | Schema birlashtirish | _SCHEMA minimal fallback + WARNING |
| 7 | asyncio deprecated | `get_running_loop` 9 ta joy |
| 8 | Web xarajat qo'shish | API + Web tugma ishlaydi |
| 9 | Tovar CRUD | 4 endpoint + modal + import |
| 10 | Klient CRUD | 2 endpoint + edit/delete + tarix |
| 11 | Web dan sotuv | Sales sahifasi — savat tizimi |
| 12 | QR-kod | API endpoint tayyor |
| 14 | Hisobot export | PDF/Excel tugmalari |
| 15 | Dashboard WebSocket | Hook + auto-refetch |
| 16 | Notification | Live bell + auto-refresh |
| 17 | Savdolar filtr | Real data + pagination + detail |
| 18 | Dashboard grafiklar | Top tovar/klient + 7 kun trend |
| 19 | Mobil responsive | Bottom navigation bar |
| 22 | LIKE escape | API 7 + bot 6 = 13 ta |
| 24 | Rate limiting | login/export/sotuv/import |
| 25 | N+1 fix | zarar_sotuv → batch query |
| 29 | Schema warning | Fallback da log.warning |
| 30 | Sentry | 3 servis (bot, API, cognitive) |
| 33 | Tovar import/export | Excel + CSV import |
| 37 | Type hints | 24 Pydantic model |
| 38 | Test qamrovi | 987 pytest (339 TITAN) |
| 39 | CI/CD | GitHub Actions + ruff lint |
| 40 | Documentation | API + Bot + Developer guide |

### Qo'shimcha (40 ta taklifdan tashqari):
- SELECT * tozalash (bot + api = 0)
- RETURNING * tozalash (bot + api = 0)
- Foyda tahlili endpoint
- Statistika endpoint
- Debts qisman to'lash
- Profil tahrirlash + parol o'zgartirish
- Klient sotuv tarixi drawer
- Tovar sotuv tarixi drawer
- Global search sahifasi
- Swagger 64 ta tag
- API landing yangilash
- RUNBOOK yangilash
- .env.example yangilash
- Version sync (v25.3)

## ❌ QILINMAGAN (10 ta — tashqi/xavfli)

| # | Taklif | Sabab |
|---|--------|-------|
| 3 | float→Decimal | 10+ caller buziladi, staging kerak |
| 5 | bot/main.py bo'laklash | 4972 qator, staging kerak |
| 13 | Telegram Mini App | BotFather sozlash kerak |
| 21 | PyJWT | Bot+API bir vaqtda o'zgartirish |
| 23 | httpOnly cookie | Frontend+backend CORS kerak |
| 26 | Materialized View | pg_cron extension kerak |
| 28 | Redis pub/sub | Redis server kerak |
| 31 | UptimeRobot | Tashqi servis |
| 32-36 | Multi-do'kon, SMS, Soliq, To'lov | Tashqi API/shartnoma |
