# SAVDOAI — 4 TA YANGI BOT FEATURE

> **Repo:** https://github.com/Mashrab1993/savdoai
> **Mavjud:** 907 qator main.py, 8 handler modul, 1222 test, 72 API endpoint
> **Qoida:** Har bir feature = alohida handler modul + test + API endpoint

---

## FEATURE 1: SHTRIX-KOD SKANERLASH

Foydalanuvchi shtrix-kod rasmini yuboradi → bot tovarni topadi yoki yangi yaratadi.

### 1.1 Yangi fayl: `services/bot/handlers/barcode.py`

```python
"""
SAVDOAI — Shtrix-kod skanerlash
Rasm → barcode dekod → tovar qidirish/yaratish
"""
from __future__ import annotations
import io, logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import ContextTypes
import services.bot.db as db
from services.bot.bot_helpers import faol_tekshir, cfg
from shared.utils.fmt import pul

log = logging.getLogger("savdoai.bot.barcode")


async def barcode_qidirish(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Rasmdan shtrix-kodni aniqlash va tovar topish."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    msg = await update.message.reply_text("🔍 Shtrix-kod tekshirilmoqda...")

    try:
        # 1. Rasmni yuklab olish
        photo = update.message.photo[-1]  # eng katta
        file = await ctx.bot.get_file(photo.file_id)
        buf = io.BytesIO()
        await file.download_to_memory(buf)
        buf.seek(0)

        # 2. Barcode dekod (pyzbar yoki AI vision)
        barcode_value = await _decode_barcode(buf.getvalue())

        if not barcode_value:
            await msg.edit_text(
                "❌ Shtrix-kod topilmadi.\n"
                "📸 Rasmni yaqinroq va aniqroq olib qayta yuboring."
            )
            return

        # 3. DB dan qidirish
        tovar = await _tovar_barcode_bilan(uid, barcode_value)

        if tovar:
            await msg.edit_text(
                f"✅ *Tovar topildi!*\n\n"
                f"📦 {tovar['nomi']}\n"
                f"🏷 Shtrix-kod: `{barcode_value}`\n"
                f"📊 Qoldiq: {tovar['qoldiq']} {tovar.get('birlik', 'dona')}\n"
                f"💰 Narx: {pul(tovar.get('sotish_narxi', 0))} so'm",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🛒 Sotish", callback_data=f"bc:sell:{tovar['id']}")],
                    [InlineKeyboardButton("📝 Tahrirlash", callback_data=f"bc:edit:{tovar['id']}")],
                ])
            )
        else:
            # Tovar yo'q — yaratish taklifi
            ctx.user_data["pending_barcode"] = barcode_value
            await msg.edit_text(
                f"🆕 Yangi shtrix-kod: `{barcode_value}`\n\n"
                f"Bu kod bazada yo'q. Tovar yaratmoqchimisiz?\n"
                f"Tovar nomini yozing:",
                parse_mode=ParseMode.MARKDOWN
            )

    except Exception as e:
        log.error("barcode: %s", e, exc_info=True)
        await msg.edit_text("❌ Shtrix-kod tekshirishda xato yuz berdi.")


async def _decode_barcode(image_bytes: bytes) -> str | None:
    """Rasmdan barcode qiymatini olish."""
    # Variant 1: pyzbar (lokal, tez)
    try:
        from pyzbar.pyzbar import decode as pyzbar_decode
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        results = pyzbar_decode(img)
        if results:
            return results[0].data.decode("utf-8")
    except ImportError:
        log.debug("pyzbar o'rnatilmagan, AI vision ishlatiladi")
    except Exception as e:
        log.debug("pyzbar xato: %s", e)

    # Variant 2: Gemini Vision (cloud, har doim ishlaydi)
    try:
        import google.genai as genai
        import os
        key = os.getenv("GEMINI_API_KEY", "")
        if not key:
            return None
        client = genai.Client(api_key=key)
        import base64
        b64 = base64.b64encode(image_bytes).decode()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {"text": "Bu rasmdagi shtrix-kod yoki QR-kod raqamini aniqla. "
                         "FAQAT raqamni qaytar, boshqa hech narsa yozma. "
                         "Agar shtrix-kod topilmasa 'NONE' yoz."},
                {"inline_data": {"mime_type": "image/jpeg", "data": b64}},
            ]
        )
        result = response.text.strip()
        if result and result != "NONE" and len(result) >= 4:
            return result
    except Exception as e:
        log.debug("Gemini barcode: %s", e)

    return None


async def _tovar_barcode_bilan(uid: int, barcode: str) -> dict | None:
    """DB dan barcode bo'yicha tovar topish."""
    async with db._P().acquire() as c:
        row = await c.fetchrow(
            "SELECT id, nomi, qoldiq, birlik, sotish_narxi, olish_narxi, barcode "
            "FROM tovarlar WHERE user_id=$1 AND barcode=$2",
            uid, barcode
        )
        return dict(row) if row else None


async def barcode_cb(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Barcode callback — sotish/tahrirlash."""
    q = update.callback_query
    await q.answer()
    data = q.data  # bc:sell:123 yoki bc:edit:123
    parts = data.split(":")
    action = parts[1]
    tovar_id = int(parts[2])
    uid = q.from_user.id

    if action == "sell":
        # Savdo oynasiga yo'naltirish
        ctx.user_data["barcode_sell"] = tovar_id
        await q.message.reply_text(
            "📝 Miqdorni kiriting (masalan: `3` yoki `2.5 kg`):",
            parse_mode=ParseMode.MARKDOWN
        )
    elif action == "edit":
        await q.message.reply_text(
            "✏️ Tovarni tahrirlash uchun /tovar buyrug'ini ishlating."
        )
```

### 1.2 DB o'zgartirish — `barcode` ustuni

```sql
-- shared/migrations/versions/009_v25_3_barcode.sql
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE INDEX IF NOT EXISTS idx_tovarlar_barcode ON tovarlar(user_id, barcode)
    WHERE barcode IS NOT NULL;
```

### 1.3 Ro'yxatga olish — `main.py`

```python
# ilovani_qur() ichida:
from services.bot.handlers.barcode import barcode_qidirish, barcode_cb

# Rasm handler OLDIDA — barcode uchun caption tekshiruv
# Agar caption "barcode" yoki "shtrix" bo'lsa → barcode handler
app.add_handler(CallbackQueryHandler(barcode_cb, pattern=r"^bc:"))
```

### 1.4 Requirements

```
# services/bot/requirements.txt ga qo'sh:
pyzbar>=0.1.9
```

### 1.5 /barcode buyrug'i

```python
# commands.py ga qo'sh:
async def cmd_barcode(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Shtrix-kod skanerlash rejimini yoqish."""
    await update.message.reply_text(
        "📸 *Shtrix-kod skanerlash*\n\n"
        "Tovar shtrix-kodining rasmini yuboring.\n"
        "Bot avtomatik tovarni topadi yoki yangi yaratadi.\n\n"
        "💡 Rasm aniq va yaqindan bo'lishi kerak.",
        parse_mode=ParseMode.MARKDOWN
    )
```

---

## FEATURE 2: KUNLIK AUTO-HISOBOT (ERTALAB 9:00)

Har kuni ertalab 9:00 (Toshkent vaqti) — barcha faol foydalanuvchilarga kunlik hisobot.

### 2.1 `handlers/jobs.py` ga qo'shish

```python
async def avto_ertalab_hisobot(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Har kuni 09:00 Toshkent — ertalab KUNLIK XULOSA."""
    log.info("☀️ Ertalab hisobot boshlandi...")
    try:
        users = await db.faol_users()
        yuborildi = 0

        for user in users:
            uid = user["id"]
            try:
                # Kechagi kunlik statistika
                d = await db.kunlik_hisobot(uid)

                # Agar kecha hech narsa bo'lmagan bo'lsa — o'tkazib yuborish
                if d.get("sotuv_soni", 0) == 0 and d.get("kirim_soni", 0) == 0:
                    continue

                # Bugungi vazifalar
                qarzlar = await db.muddati_otgan_qarzlar(uid)
                kam_qoldiq = await _kam_qoldiq_tovarlar(uid)

                matn = _ertalab_matn(d, qarzlar, kam_qoldiq, user.get("ism", ""))

                await ctx.bot.send_message(
                    uid, matn, parse_mode="Markdown"
                )
                yuborildi += 1

            except Exception as e:
                log.debug("ertalab hisobot uid=%s: %s", uid, e)

        log.info("☀️ Ertalab hisobot: %d ta yuborildi", yuborildi)

    except Exception as e:
        log.error("avto_ertalab_hisobot: %s", e, exc_info=True)


async def _kam_qoldiq_tovarlar(uid: int) -> list[dict]:
    """min_qoldiq dan kam tovarlar."""
    async with db._P().acquire() as c:
        rows = await c.fetch(
            "SELECT nomi, qoldiq, min_qoldiq, birlik "
            "FROM tovarlar WHERE user_id=$1 AND qoldiq < min_qoldiq AND min_qoldiq > 0 "
            "ORDER BY qoldiq ASC LIMIT 10",
            uid
        )
        return [dict(r) for r in rows]


def _ertalab_matn(d: dict, qarzlar: list, kam_qoldiq: list, ism: str) -> str:
    """Ertalab xulosa matni."""
    parts = [f"☀️ *Xayrli tong{', ' + ism if ism else ''}!*\n"]

    # Kechagi natija
    parts.append("📊 *Kechagi natija:*")
    if d.get("sotuv_soni", 0) > 0:
        parts.append(f"  💰 Sotuv: {d['sotuv_soni']} ta — {pul(d.get('jami_sotuv', 0))} so'm")
    if d.get("kirim_soni", 0) > 0:
        parts.append(f"  📦 Kirim: {d['kirim_soni']} ta — {pul(d.get('jami_kirim', 0))} so'm")
    if d.get("foyda", 0) > 0:
        parts.append(f"  📈 Foyda: {pul(d['foyda'])} so'm")
    parts.append("")

    # Muddati o'tgan qarzlar
    if qarzlar:
        jami_qarz = sum(q.get("qoldiq", 0) for q in qarzlar)
        parts.append(f"⚠️ *Muddati o'tgan qarzlar: {len(qarzlar)} ta*")
        parts.append(f"  💸 Jami: {pul(jami_qarz)} so'm")
        for q in qarzlar[:3]:
            parts.append(f"  • {q.get('klient_ismi', '?')} — {pul(q.get('qoldiq', 0))}")
        if len(qarzlar) > 3:
            parts.append(f"  ... va {len(qarzlar) - 3} ta boshqa")
        parts.append("")

    # Kam qoldiq
    if kam_qoldiq:
        parts.append(f"📦 *Kam qoldiq: {len(kam_qoldiq)} ta tovar*")
        for t in kam_qoldiq[:5]:
            parts.append(f"  • {t['nomi']}: {t['qoldiq']}/{t['min_qoldiq']} {t.get('birlik', '')}")
        parts.append("")

    parts.append("🚀 Bugun ham omad tilayman!")
    return "\n".join(parts)
```

### 2.2 Scheduler ro'yxatga olish — `main.py`

```python
# boshlash() ichida, job_queue bo'limida:
import datetime, pytz
toshkent = pytz.timezone("Asia/Tashkent")

# Ertalab 09:00 Toshkent
job_queue.run_daily(
    avto_ertalab_hisobot,
    time=datetime.time(hour=9, minute=0, tzinfo=toshkent),
    name="ertalab_hisobot"
)
```

### 2.3 Sozlamalar — hisobotni o'chirish/yoqish

```python
# /hisobot_sozlama buyrug'i
async def cmd_hisobot_sozlama(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("☀️ Ertalab 09:00 — " + ("✅" if enabled else "❌"),
                              callback_data="hsoz:ertalab")],
        [InlineKeyboardButton("🌙 Kechqurun 20:00 — " + ("✅" if enabled else "❌"),
                              callback_data="hsoz:kechqurun")],
    ])
    await update.message.reply_text("⚙️ Avtomatik hisobot sozlamalari:", reply_markup=kb)
```

---

## FEATURE 3: KLIENT TELEGRAM MINI-DO'KON

Klientlar Telegram Mini App orqali tovar ko'rib, buyurtma qiladi. Do'konchi tasdiqlaydi.

### 3.1 Yangi API endpointlar — `services/api/main.py`

```python
# ═══ KLIENT MINI-DO'KON ═══

@app.get("/api/v1/dokon/{dokon_id}/tovarlar", tags=["Mini-Do'kon"])
async def dokon_tovarlar(dokon_id: int, q: str = "", kategoriya: str = ""):
    """Ommaviy katalog — auth kerak emas."""
    async with get_pool().acquire() as c:
        query = """
            SELECT id, nomi, kategoriya, sotish_narxi, birlik, qoldiq, barcode, rasm_url
            FROM tovarlar
            WHERE user_id=$1 AND qoldiq > 0
        """
        params = [dokon_id]
        if q:
            query += " AND LOWER(nomi) LIKE LOWER($2)"
            params.append(f"%{like_escape(q)}%")
        query += " ORDER BY nomi LIMIT 100"
        rows = await c.fetch(query, *params)
    return [dict(r) for r in rows]


@app.post("/api/v1/dokon/{dokon_id}/buyurtma", tags=["Mini-Do'kon"])
async def dokon_buyurtma(dokon_id: int, data: dict):
    """Klient buyurtma yaratish.
    Body: { klient_ismi, telefon, tovarlar: [{id, miqdor}], izoh }
    """
    tovarlar = data.get("tovarlar", [])
    if not tovarlar:
        raise HTTPException(400, "Tovarlar ro'yxati bo'sh")

    async with get_pool().acquire() as c:
        # Buyurtma yaratish
        row = await c.fetchrow("""
            INSERT INTO buyurtmalar (user_id, klient_ismi, telefon, izoh, holat)
            VALUES ($1, $2, $3, $4, 'yangi')
            RETURNING id
        """, dokon_id, data.get("klient_ismi", ""), data.get("telefon", ""), data.get("izoh", ""))

        buyurtma_id = row["id"]

        # Tovarlar
        for t in tovarlar:
            tovar = await c.fetchrow(
                "SELECT id, nomi, sotish_narxi FROM tovarlar WHERE id=$1 AND user_id=$2",
                t["id"], dokon_id
            )
            if tovar:
                await c.execute("""
                    INSERT INTO buyurtma_tovarlar (buyurtma_id, tovar_id, nomi, miqdor, narx)
                    VALUES ($1, $2, $3, $4, $5)
                """, buyurtma_id, tovar["id"], tovar["nomi"], t["miqdor"], tovar["sotish_narxi"])

    # Do'konchiga Telegram xabar
    try:
        import httpx
        bot_token = os.getenv("BOT_TOKEN", "")
        matn = (
            f"🛒 *Yangi buyurtma!*\n\n"
            f"👤 {data.get('klient_ismi', 'Noma')}\n"
            f"📞 {data.get('telefon', '-')}\n"
            f"📦 {len(tovarlar)} ta tovar\n"
            f"📝 {data.get('izoh', '-')}"
        )
        await httpx.AsyncClient().post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": dokon_id, "text": matn, "parse_mode": "Markdown"}
        )
    except Exception as e:
        log.debug("Buyurtma telegram: %s", e)

    return {"buyurtma_id": buyurtma_id, "status": "yangi"}
```

### 3.2 DB — buyurtmalar jadvali

```sql
-- shared/migrations/versions/010_v25_3_buyurtmalar.sql
CREATE TABLE IF NOT EXISTS buyurtmalar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    klient_ismi TEXT        DEFAULT '',
    telefon     TEXT        DEFAULT '',
    izoh        TEXT        DEFAULT '',
    holat       TEXT        DEFAULT 'yangi',  -- yangi, tasdiqlangan, bekor
    yaratilgan  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyurtma_user ON buyurtmalar(user_id, yaratilgan DESC);

CREATE TABLE IF NOT EXISTS buyurtma_tovarlar (
    id           BIGSERIAL PRIMARY KEY,
    buyurtma_id  BIGINT NOT NULL REFERENCES buyurtmalar(id) ON DELETE CASCADE,
    tovar_id     BIGINT REFERENCES tovarlar(id),
    nomi         TEXT NOT NULL,
    miqdor       NUMERIC(12,3) NOT NULL DEFAULT 1,
    narx         NUMERIC(18,2) NOT NULL DEFAULT 0
);
SELECT enable_rls('buyurtmalar');
```

### 3.3 Web sahifa — `services/web/app/shop/[id]/page.tsx`

```tsx
// Mini-do'kon sahifasi — klient tovar ko'radi, savatchaga qo'shadi, buyurtma beradi
// URL: /shop/123456789 (do'konchi user_id)
// Auth kerak EMAS — ommaviy sahifa

"use client"
import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { Search, ShoppingCart, Plus, Minus, Send } from "lucide-react"
// ... to'liq POS-style mobile-first UI
// Tovar grid + savat + buyurtma formasi
```

### 3.4 Do'konchi /dokon buyrug'i

```python
async def cmd_dokon(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Do'kon havolasini olish."""
    uid = update.effective_user.id
    web_url = os.getenv("WEB_URL", "https://savdoai-web-production.up.railway.app")
    link = f"{web_url}/shop/{uid}"
    await update.message.reply_text(
        f"🏪 *Sizning mini-do'koningiz:*\n\n"
        f"`{link}`\n\n"
        f"Bu havolani klientlaringizga yuboring.\n"
        f"Ular Telegram ichida tovar ko'rib, buyurtma bera oladi.\n"
        f"Buyurtma kelganda sizga xabar keladi.",
        parse_mode=ParseMode.MARKDOWN
    )
```

---

## FEATURE 4: AI NARX TAVSIYASI (FOYDA OPTIMIZATSIYA)

AI sotuv tarixini tahlil qilib, narx o'zgartirish tavsiya qiladi.

### 4.1 Yangi fayl: `shared/services/ai_narx_tavsiya.py`

```python
"""
SAVDOAI — AI Narx Tavsiya
Sotuv tarixini tahlil qilib, optimal narxni tavsiya qiladi.
"""
from __future__ import annotations
import logging
from decimal import Decimal

log = logging.getLogger(__name__)


async def narx_tavsiyalar(conn, uid: int, limit: int = 10) -> list[dict]:
    """Eng ko'p sotilgan tovarlar uchun narx tavsiya.
    
    Tahlil:
    1. Oxirgi 30 kun sotuv trendi
    2. Foyda marginali (olish vs sotish)
    3. Qoldiq tezligi (qancha tez sotilmoqda)
    4. Raqobat narxi (agar mavjud)
    
    Qaytaradi: [{tovar_id, nomi, joriy_narx, tavsiya_narx, sabab, kutilgan_foyda_oshishi}]
    """
    # 1. Top tovarlar
    rows = await conn.fetch("""
        WITH sotuv_30 AS (
            SELECT
                c.tovar_id,
                t.nomi,
                t.sotish_narxi AS joriy_narx,
                t.olish_narxi,
                t.qoldiq,
                COUNT(*) AS sotuv_soni,
                SUM(c.miqdor) AS jami_miqdor,
                SUM(c.summa) AS jami_summa,
                AVG(c.narx) AS ortacha_sotuv_narx,
                MIN(c.narx) AS min_narx,
                MAX(c.narx) AS max_narx
            FROM chiqimlar c
            JOIN tovarlar t ON t.id = c.tovar_id
            WHERE c.user_id=$1
              AND c.yaratilgan >= NOW() - INTERVAL '30 days'
            GROUP BY c.tovar_id, t.nomi, t.sotish_narxi, t.olish_narxi, t.qoldiq
            ORDER BY jami_summa DESC
            LIMIT $2
        )
        SELECT * FROM sotuv_30
    """, uid, limit)

    tavsiyalar = []
    for r in rows:
        joriy = Decimal(str(r["joriy_narx"] or 0))
        olish = Decimal(str(r["olish_narxi"] or 0))
        ortacha = Decimal(str(r["ortacha_sotuv_narx"] or 0))
        qoldiq = r["qoldiq"] or 0
        sotuv_soni = r["sotuv_soni"] or 0

        if olish <= 0 or joriy <= 0:
            continue

        margin = ((joriy - olish) / olish * 100).quantize(Decimal("0.1"))
        tavsiya_narx = joriy
        sabab = ""

        # Strategiya 1: Margin juda past (< 15%)
        if margin < 15:
            tavsiya_narx = (olish * Decimal("1.20")).quantize(Decimal("1000"))
            sabab = f"⚠️ Margin juda past ({margin}%). 20% ga oshiring"

        # Strategiya 2: Ko'p sotilmoqda + qoldiq kam → narx oshirish
        elif sotuv_soni > 10 and qoldiq < 20:
            oshirish = joriy * Decimal("0.05")
            tavsiya_narx = (joriy + oshirish).quantize(Decimal("1000"))
            sabab = f"🔥 Talab yuqori ({sotuv_soni} ta/oy), qoldiq kam ({qoldiq}). 5% oshiring"

        # Strategiya 3: Kam sotilmoqda → chegirma tavsiya
        elif sotuv_soni < 3 and qoldiq > 50:
            kamaytirish = joriy * Decimal("0.10")
            tavsiya_narx = (joriy - kamaytirish).quantize(Decimal("1000"))
            sabab = f"📉 Kam sotilmoqda ({sotuv_soni}/oy), ko'p qoldiq ({qoldiq}). 10% chegirma"

        # Strategiya 4: Ortacha narx farqi
        elif abs(ortacha - joriy) > joriy * Decimal("0.1"):
            tavsiya_narx = ortacha.quantize(Decimal("1000"))
            sabab = f"📊 Amalda {pul(ortacha)} da sotilmoqda (farq: {pul(abs(ortacha - joriy))})"

        else:
            continue  # O'zgartirish kerak emas

        if tavsiya_narx != joriy:
            kutilgan = (tavsiya_narx - olish) * sotuv_soni - (joriy - olish) * sotuv_soni
            tavsiyalar.append({
                "tovar_id": r["tovar_id"],
                "nomi": r["nomi"],
                "joriy_narx": float(joriy),
                "tavsiya_narx": float(tavsiya_narx),
                "olish_narxi": float(olish),
                "margin": float(margin),
                "sabab": sabab,
                "kutilgan_foyda_oshishi": float(kutilgan),
                "sotuv_soni": sotuv_soni,
            })

    return tavsiyalar


def pul(n) -> str:
    """Pul formatlash."""
    from shared.utils.fmt import pul as _pul
    return _pul(n)
```

### 4.2 Bot buyrug'i — `/narx_tavsiya`

```python
# handlers/commands.py ga qo'sh:
async def cmd_narx_tavsiya(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """AI narx tavsiyasi — foyda optimizatsiya."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    msg = await update.message.reply_text("🧠 AI narx tahlil qilmoqda...")

    try:
        from shared.services.ai_narx_tavsiya import narx_tavsiyalar
        async with db._P().acquire() as c:
            tavsiyalar = await narx_tavsiyalar(c, uid, limit=10)

        if not tavsiyalar:
            await msg.edit_text(
                "✅ Barcha narxlar optimal!\n"
                "Hozircha o'zgartirish kerak emas."
            )
            return

        jami_foyda = sum(t["kutilgan_foyda_oshishi"] for t in tavsiyalar)

        parts = [
            f"🧠 *AI NARX TAVSIYASI*\n"
            f"📊 {len(tavsiyalar)} ta tovar uchun tavsiya:\n"
            f"💰 Kutilgan qo'shimcha foyda: *{pul(jami_foyda)}* so'm/oy\n"
        ]

        for i, t in enumerate(tavsiyalar, 1):
            parts.append(
                f"\n*{i}. {t['nomi']}*\n"
                f"  Hozir: {pul(t['joriy_narx'])} → Tavsiya: *{pul(t['tavsiya_narx'])}*\n"
                f"  {t['sabab']}"
            )

        parts.append(f"\n\n💡 Narxni o'zgartirish uchun /narx buyrug'ini ishlating.")

        await msg.edit_text("\n".join(parts), parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        log.error("narx_tavsiya: %s", e, exc_info=True)
        await msg.edit_text("❌ Tahlil xatosi.")
```

### 4.3 API endpoint

```python
@app.get("/api/v1/narx/tavsiya", tags=["Narxlar"])
async def narx_tavsiya(uid: int = Depends(get_uid)):
    """AI narx tavsiyasi."""
    from shared.services.ai_narx_tavsiya import narx_tavsiyalar
    async with rls_conn(uid) as c:
        return await narx_tavsiyalar(c, uid, limit=20)
```

---

## MIGRATSIYALAR TARTIB

```bash
# 1. Barcode ustuni
psql $DATABASE_URL < shared/migrations/versions/009_v25_3_barcode.sql

# 2. Buyurtmalar jadvali
psql $DATABASE_URL < shared/migrations/versions/010_v25_3_buyurtmalar.sql
```

## TESTLAR

Har bir feature uchun kamida 5 ta test:
- Import test
- Funksiya mavjudligi
- DB migration
- API endpoint
- Edge cases

## TARTIB

1. Barcode skanerlash (eng tez natija beradi)
2. Kunlik auto-hisobot (foydalanuvchi doimiy qiymat oladi)
3. AI narx tavsiya (savdoni oshiradi)
4. Mini-do'kon (eng katta feature — oxirgi)
