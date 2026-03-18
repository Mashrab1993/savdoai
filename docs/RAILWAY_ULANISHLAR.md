# Railway: Postgres va Redis ulanishlari

Bot javob bermasa, ko‘pincha **Postgres** yoki **Redis** servisga ulanmagan bo‘ladi. Barcha ilova servislari ikkalasiga ham ulanishi kerak.

## Kim nima uchun kerak

| Servis         | Postgres (DATABASE_URL) | Redis (REDIS_URL) |
|----------------|-------------------------|-------------------|
| **savdoai-bot**  | ✅ Shart (users, sotuv, jurnal) | ✅ Shart (polling lock, cache) |
| **savdoai-api**  | ✅ Shart                  | ✅ Shart (cache, rate limit)   |
| **savdoai-worker** | ✅ Shart                | ✅ Shart (Celery broker)       |

Agar **savdoai-bot** ga faqat Redis ulansa va Postgres ulanishi bo‘lmasa — `DATABASE_URL` bo‘sh bo‘ladi, bot DB ga ulanmaydi va `/start` ga javob bermaydi.

---

## Railway Dashboard da qanday ulash kerak

### 1. Postgres va Redis servislari borligini tekshiring
- **Postgres** — Database → PostgreSQL (yoki mavjud DB servisi).
- **Redis** — Database → Redis.

### 2. Har bir ilova servisiga ikkalasini ham ulang

**savdoai-bot uchun:**

1. **savdoai-bot** servisini oching.
2. **Variables** (yoki **Settings** → **Variables**) bo‘limiga kiring.
3. Quyidagilar bor-yo‘qligini tekshiring:
   - `DATABASE_URL` — **Postgres** dan olinadi.  
     Agar yo‘q bo‘lsa: **Variables** → **Add Variable** → **Add Reference** (yoki **New Variable** → **Reference**) → **Postgres** servisini tanlang → **DATABASE_URL** ni tanlang.
   - `REDIS_URL` — **Redis** dan olinadi.  
     Xuddi shunday **Add Reference** → **Redis** → **REDIS_URL**.

**savdoai-api uchun:**
- `DATABASE_URL` ← Postgres reference.
- `REDIS_URL` ← Redis reference.

**savdoai-worker uchun:**
- `DATABASE_URL` ← Postgres reference.
- `REDIS_URL` ← Redis reference.

### 3. Reference qo‘shish (tipik usul)
Railway da odatda:
- Servisni ochasiz → **Variables** → **Add Variable** yoki **New Variable**.
- **Reference** (yoki **From Service**) tanlaysiz.
- **Postgres** servisini tanlab **DATABASE_URL** ni qo‘shasiz.
- **Redis** servisini tanlab **REDIS_URL** ni qo‘shasiz.

Yoki servis **Settings** da **Dependencies** / **Connected Services** bo‘lsa — Postgres va Redis ni ulab qo‘yasiz; keyin ularning `DATABASE_URL` va `REDIS_URL` o‘zgaruvchilari avtomatik inject qilinishi mumkin (Railway versiyasiga qarab).

### 4. Tekshirish
Deploy qilib, **savdoai-bot** loglarida quyidagilarni ko‘ring:
- `✅ Ma'lumotlar bazasi ulandi`
- `✅ Redis ulandi`
- `✅ Polling lock olindi`

Agar `DATABASE_URL` bo‘sh bo‘lsa, config xatolik chiqadi yoki "DATABASE_URL" talab qilinadi degan xabar keladi.

---

## Qisqacha

- **Ha** — barcha uchta servis (api, bot, worker) **o‘ziga** ham **Postgres**, ham **Redis** ulanishi kerak.
- **savdoai-bot** uchun Postgres ulanishi bo‘lmasa — bot DB ga ulanmaydi va javob bermaydi; Redis bo‘lmasa polling Conflict xavfi bor.
- Railway’da har bir servis uchun **Variables** da `DATABASE_URL` (Postgres) va `REDIS_URL` (Redis) reference qilib qo‘ying.
