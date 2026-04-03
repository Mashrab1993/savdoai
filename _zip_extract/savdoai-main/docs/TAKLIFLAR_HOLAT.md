# SavdoAI v25.3 — 40 Taklif Holati

## ✅ QILINDI (32 ta — 80%)

| # | Taklif | Natija |
|---|--------|--------|
| 1 | smart_narx crash fix | `c.sotish_narxi AS narx` |
| 2 | user_id filtr | 6+ endpoint himoyalandi |
| 4 | bare except 27 ta | `except Exception:` — butun loyihada 0 |
| 5 | bot/main.py bo'laklash | 5001→4392 (-609), 4 handler modul |
| 6 | Schema birlashtirish | _SCHEMA minimal fallback |
| 7 | asyncio deprecated | `get_running_loop` 9 ta |
| 8 | Web xarajat qo'shish | API + Web |
| 9 | Tovar CRUD | 4 endpoint + modal + import |
| 10 | Klient CRUD | 2 endpoint + edit/delete + tarix |
| 11 | Web dan sotuv | Sales sahifasi — savat tizimi |
| 12 | QR-kod | API endpoint |
| 13 | Telegram Mini App | /auth/webapp + /tg + /webapp cmd |
| 14 | Hisobot export | PDF/Excel tugmalari |
| 15 | Dashboard WebSocket | Hook + auto-refetch |
| 16 | Notification | Live bell |
| 17 | Savdolar filtr | Real data + pagination + detail |
| 18 | Dashboard grafiklar | Top tovar/klient + trend + statistika |
| 19 | Mobil responsive | Bottom nav + PWA manifest |
| 22 | LIKE escape | API 7 + bot 6 + shared 21 = 0 qoldi |
| 24 | Rate limiting | login/export/sotuv/import |
| 25 | N+1 fix | zarar_sotuv batch |
| 29 | Schema warning | Fallback log.warning |
| 30 | Sentry | 3 servis |
| 33 | Tovar import/export | Excel + CSV |
| 37 | Type hints | 24 Pydantic model |
| 38 | Test qamrovi | 1109 pytest + 155 inline |
| 39 | CI/CD | GitHub Actions + ruff |
| 40 | Documentation | 6 ta hujjat |

### Qo'shimcha (40 dan tashqari):
- SELECT * tozalash (bot + api + shared + worker = 0)
- RETURNING * tozalash (0)
- Foyda tahlili + Statistika endpoint
- Profil tahrirlash + parol
- Klient/tovar tarix drawer
- Global search + 404 sahifa
- Swagger 67 tag + OpenAPI
- Health Redis ping
- Skeleton loading komponentlar
- README.md to'liq yangilandi
- PWA manifest + viewport

## ❌ QILINMAGAN (8 ta — tashqi/xavfli)

| # | Taklif | Sabab |
|---|--------|-------|
| 3 | float→Decimal | 10+ caller buziladi |
| 21 | PyJWT | Bot+API simultaneous |
| 23 | httpOnly cookie | Frontend+backend CORS |
| 26 | Materialized View | pg_cron extension |
| 28 | Redis pub/sub | Redis server kerak |
| 31 | UptimeRobot | Tashqi servis |
| 32-36 | Multi-do'kon, SMS, Soliq, To'lov | Tashqi shartnoma |
