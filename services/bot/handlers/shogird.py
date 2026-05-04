"""
Shogird xarajat nazorati buyruqlari.
/shogird_qosh, /shogirdlar, /xarajatlar, sx:* callback
"""
from __future__ import annotations
import json
import logging
import os
import re
from decimal import Decimal

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes, CommandHandler, CallbackQueryHandler

import services.bot.db as db
from shared.database.pool import rls_conn as _rls_conn
from services.bot.bot_helpers import faol_tekshir, cfg, tg

log = logging.getLogger("savdoai.bot.shogird")


_XARAJAT_AI_PROMPT = """Bu o'zbek tilidagi xabar — xarajat (rasxod) yozuvimi?

⚠️ JUDA MUHIM:
- DD.MM.YYYY (01.05.2026, 02.05.2026) — bu SANA, summa EMAS!
- Yil (2026, 2025) — summa EMAS!
- "Urgut", "Bulungʻur", "Kattaqoʻrgʻon" — bu joy, summa/kategoriya EMAS

Xabarda BIR NECHTA xarajat bo'lsa, har birini "items" massivida alohida ko'rsating.

JSON qaytaring:
{
  "type": "expense" | "other",
  "amount": <jami son>,
  "items": [{"amount": <son>, "category": "benzin|gaz|oylik|abed|transport|tamir|aloqa|qarz|mahsulot|boshqa", "description": "<10-50 belgi>"}]
}

Qoidalar:
- "65.000" yoki "65,000" → 65000 (nuqta/vergul - ming ajratuvchi)
- "100k" → 100000, "1.5 mln" → 1500000, "20 ming" → 20000
- "65.000 gaz" → amount=65000, category=gaz
- "65.000gaz / 60.000 abet / Urgut 02.05.2026" → amount=125000, items=[{65000,gaz},{60000,abed}]
- "60.000 abet, 60.000 gaz, 5.000 Xudoyberdi oylik, 5.000 Kamol oylik, 01.05.2026" → 4 items
- "salom", "rahmat" → other

Faqat JSON.

Xabar: """


def _parse_xarajat_ai(matn: str) -> dict:
    """Gemini AI bilan xarajatni multi-item parse qilish."""
    try:
        from google import genai
        key = os.getenv("GEMINI_API_KEY", "")
        if not key:
            return {"type": "other"}
        client = genai.Client(api_key=key)
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-pro"),
            contents=[_XARAJAT_AI_PROMPT + matn],
            config={"response_mime_type": "application/json"},
        )
        return json.loads(resp.text or "{}")
    except Exception as e:
        log.warning("AI xarajat parse xatosi: %s", e)
        return {"type": "other"}


async def cmd_shogird_qosh(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Admin: yangi shogird qo'shish. Format: /shogird_qosh <telegram_id> <ism>"""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun.")
        return

    matn = (update.message.text or "").strip()
    qismlar = matn.split(maxsplit=2)
    if len(qismlar) < 3:
        await update.message.reply_text(
            "📝 *Shogird qo'shish*\n\n"
            "Format: `/shogird_qosh <telegram_id> <ism>`\n\n"
            "Masalan:\n"
            "`/shogird_qosh 123456789 Akbar haydovchi`\n\n"
            "Telegram ID bilish: shogird @userinfobot ga /start yuborsin",
            parse_mode=ParseMode.MARKDOWN)
        return

    try:
        tg_id = int(qismlar[1])
        ism = qismlar[2]
    except ValueError:
        await update.message.reply_text("❌ Telegram ID raqam bo'lishi kerak.")
        return

    try:
        from shared.services.shogird_xarajat import shogird_qoshish
        async with db._P().acquire() as c:
            await shogird_qoshish(c, uid, tg_id, ism)
        await update.message.reply_text(
            f"✅ *Shogird qo'shildi!*\n\n"
            f"👤 Ism: *{ism}*\n"
            f"📱 Telegram ID: `{tg_id}`\n"
            f"💰 Kunlik limit: 500,000 so'm\n"
            f"📊 Oylik limit: 10,000,000 so'm\n\n"
            f"Endi {ism} botga ovoz/matn yuborib xarajat kiritadi.",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("shogird_qosh: %s", e, exc_info=True)
        await update.message.reply_text("❌ Shogird qo'shishda xato yuz berdi.")


async def cmd_shogirdlar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Admin: shogirdlar ro'yxati"""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun.")
        return

    try:
        from shared.services.shogird_xarajat import shogirdlar_royxati
        async with db._P().acquire() as c:
            shogirdlar = await shogirdlar_royxati(c, uid)

        if not shogirdlar:
            await update.message.reply_text(
                "📋 Hali shogird yo'q.\n\n"
                "Qo'shish: `/shogird_qosh <telegram_id> <ism>`",
                parse_mode=ParseMode.MARKDOWN)
            return

        matn = "👥 *SHOGIRDLAR*\n━━━━━━━━━━━━━━━━━━\n\n"
        jami_bugun = Decimal('0')
        jami_oy = Decimal('0')

        for s in shogirdlar:
            bugun = s['bugungi_xarajat']
            oy = s['oylik_xarajat']
            jami_bugun += bugun
            jami_oy += oy

            limit_pct = int((bugun / s['kunlik_limit']) * 100) if s['kunlik_limit'] > 0 else 0
            bar = "🟢" if limit_pct < 70 else "🟡" if limit_pct < 100 else "🔴"

            matn += (
                f"{bar} *{s['ism']}* ({s['lavozim']})\n"
                f"   📱 `{s['telegram_uid']}`\n"
                f"   Bugun: *{bugun:,.0f}* / {s['kunlik_limit']:,.0f}\n"
                f"   Oy: *{oy:,.0f}* / {s['oylik_limit']:,.0f}\n"
            )
            if s['kutilmoqda'] > 0:
                matn += f"   ⏳ Kutilmoqda: {s['kutilmoqda']} ta\n"
            matn += "\n"

        matn += f"━━━━━━━━━━━━━━━━━━\n💰 Bugun jami: *{jami_bugun:,.0f}*\n📊 Oy jami: *{jami_oy:,.0f}*"
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_shogirdlar: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def cmd_xarajatlar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Admin: tasdiqlanmagan xarajatlar"""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun.")
        return

    try:
        from shared.services.shogird_xarajat import kutilmoqda_royxati
        async with db._P().acquire() as c:
            kutilmoqda = await kutilmoqda_royxati(c, uid)

        if not kutilmoqda:
            await update.message.reply_text("✅ Barcha xarajatlar tasdiqlangan!")
            return

        matn = "⏳ *KUTILMOQDA*\n━━━━━━━━━━━━━━━━━━\n\n"
        buttons = []
        for x in kutilmoqda[:10]:
            sana = str(x['sana'])[11:16]
            matn += (
                f"#{x['id']} {x['kategoriya_nomi']}\n"
                f"👤 {x['shogird_ismi']} | 💰 *{x['summa']:,.0f}*\n"
                f"📝 {x['izoh'] or '-'} | ⏰ {sana}\n\n"
            )
            buttons.append([
                (f"✅ #{x['id']}", f"sx:tasdiq:{x['id']}"),
                (f"❌ #{x['id']}", f"sx:bekor:{x['id']}"),
            ])

        markup = tg(*buttons) if buttons else None
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN, reply_markup=markup)
    except Exception as e:
        log.error("cmd_xarajatlar: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def shogird_xarajat_cb(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Admin: xarajatni tasdiqlash/bekor qilish"""
    q = update.callback_query
    await q.answer()
    uid = update.effective_user.id
    qismlar = q.data.split(":")
    amal = qismlar[1]
    xarajat_id = int(qismlar[2])

    try:
        from shared.services.shogird_xarajat import xarajat_tasdiqlash, xarajat_bekor
        async with db._P().acquire() as c:
            if amal == "tasdiq":
                ok = await xarajat_tasdiqlash(c, xarajat_id, uid)
                await q.message.reply_text(f"✅ Xarajat #{xarajat_id} tasdiqlandi!" if ok else "❌ Topilmadi.")
            elif amal == "bekor":
                ok = await xarajat_bekor(c, xarajat_id, uid)
                await q.message.reply_text(f"❌ Xarajat #{xarajat_id} bekor qilindi!" if ok else "❌ Topilmadi.")
    except Exception as e:
        log.error("shogird_xarajat_cb: %s", e, exc_info=True)
        await q.message.reply_text("❌ Xato yuz berdi.")


async def _shogird_xarajat_qabul(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                                   matn: str, shogird: dict) -> bool:
    """Shogird xarajat yubordi — Gemini AI bilan multi-item qayta ishlash."""
    from shared.services.shogird_xarajat import xarajat_saqlash, kategoriya_aniqla

    # AI parsing — sana avtomat ajratiladi, multi-item topiladi
    parsed = _parse_xarajat_ai(matn)
    if parsed.get("type") != "expense" or not parsed.get("amount"):
        return False

    items = parsed.get("items") or []
    # Agar items bo'sh bo'lsa, bitta item sifatida amount/category dan tuzamiz
    if not items:
        kat_nomi_g, kat_emoji_g = kategoriya_aniqla(matn)
        items = [{
            "amount": parsed["amount"],
            "category": parsed.get("category") or kat_nomi_g.lower(),
            "description": matn[:80],
        }]

    admin_uid = shogird["admin_uid"]
    shogird_id = shogird["id"]
    saved_items = []  # [{"id": xarajat_id, "kat_nomi": ..., "kat_emoji": ..., "summa": ..., "izoh": ...}]

    try:
        async with _rls_conn(admin_uid) as c:
            for item in items:
                summa = item.get("amount")
                if not summa or summa < 1000:
                    continue
                # Kategoriya nomini xaritalash
                kat_input = (item.get("category") or "").lower()
                if kat_input:
                    # User text orqali emas, AI dan keladigan kategoriyani aniq xaritalash
                    kat_nomi, kat_emoji = kategoriya_aniqla(kat_input)
                else:
                    kat_nomi, kat_emoji = kategoriya_aniqla(matn)
                izoh = item.get("description") or matn[:80]
                result = await xarajat_saqlash(c, admin_uid, shogird_id, kat_nomi, summa, izoh)
                saved_items.append({
                    "id": result.get("id"),
                    "kat_nomi": kat_nomi,
                    "kat_emoji": kat_emoji,
                    "summa": float(summa),
                    "izoh": izoh,
                    "auto_tasdiq": result.get("auto_tasdiqlangan", False),
                    "limit_info": result.get("limit_info", {}),
                })

        if not saved_items:
            return False

        jami_summa = sum(it["summa"] for it in saved_items)
        oxirgi_limit = saved_items[-1]["limit_info"]
        bugungi = oxirgi_limit.get("bugungi", 0)
        kunlik_limit = oxirgi_limit.get("kunlik_limit", 0)

        # Shogird'ga javob — har item alohida + tugmalar
        if len(saved_items) == 1:
            it = saved_items[0]
            if it["auto_tasdiq"]:
                javob = (
                    f"✅ *Xarajat yozildi va tasdiqlandi!*\n\n"
                    f"{it['kat_emoji']} Kategoriya: *{it['kat_nomi']}*\n"
                    f"💰 Summa: *{it['summa']:,.0f} so'm*\n"
                    f"📝 Izoh: _{it['izoh'][:60]}_\n"
                    f"\n📊 Bugun jami: *{bugungi:,.0f}* / {kunlik_limit:,.0f}\n"
                )
            else:
                javob = (
                    f"⏳ *Xarajat yozildi — tasdiq kutilmoqda*\n\n"
                    f"{it['kat_emoji']} *{it['kat_nomi']}*: *{it['summa']:,.0f} so'm*\n"
                    f"📝 _{it['izoh'][:60]}_\n"
                    f"\n🔴 LIMIT OSHDI — admin tekshirishi kerak.\n"
                )
            buttons = [[
                (f"✅ Tasdiq #{it['id']}", f"sx:tasdiq:{it['id']}"),
                (f"❌ Bekor #{it['id']}", f"sx:bekor:{it['id']}"),
            ]]
        else:
            # Multi-item — har birini alohida ko'rsatish
            javob = f"📋 *{len(saved_items)} ta xarajat yozildi (jami: {jami_summa:,.0f} so'm)*\n\n"
            buttons = []
            for i, it in enumerate(saved_items, 1):
                tasdiq_marker = "✅" if it["auto_tasdiq"] else "⏳"
                javob += (
                    f"*#{i}* {tasdiq_marker} {it['kat_emoji']} *{it['kat_nomi']}*: "
                    f"{it['summa']:,.0f} so'm\n"
                    f"   _{it['izoh'][:50]}_\n\n"
                )
                buttons.append([
                    (f"✅ Tasdiq #{it['id']}", f"sx:tasdiq:{it['id']}"),
                    (f"❌ Bekor #{it['id']}", f"sx:bekor:{it['id']}"),
                ])
            javob += f"📊 Bugun jami: *{bugungi:,.0f}* / {kunlik_limit:,.0f}"

        markup = tg(*buttons)

        # Admin'ga bildirish
        try:
            if len(saved_items) == 1:
                it = saved_items[0]
                admin_msg = (
                    f"🤖 *AVTONOM TASDIQLANDI*\n\n"
                    f"👤 Shogird: *{shogird['ism']}*\n"
                    f"{it['kat_emoji']} {it['kat_nomi']}: *{it['summa']:,.0f} so'm*\n"
                    f"📝 {it['izoh'][:60]}\n"
                    f"📊 Bugun: {bugungi:,.0f} / {kunlik_limit:,.0f}"
                )
            else:
                admin_msg = (
                    f"🤖 *AVTONOM — {len(saved_items)} ta xarajat*\n\n"
                    f"👤 Shogird: *{shogird['ism']}*\n"
                    f"💰 Jami: *{jami_summa:,.0f} so'm*\n"
                )
                for i, it in enumerate(saved_items, 1):
                    admin_msg += f"#{i} {it['kat_emoji']} {it['kat_nomi']}: {it['summa']:,.0f}\n"
                admin_msg += f"\n📊 Bugun: {bugungi:,.0f} / {kunlik_limit:,.0f}"
            for aid in cfg().admin_ids:
                try:
                    await ctx.bot.send_message(aid, admin_msg,
                                                parse_mode=ParseMode.MARKDOWN,
                                                reply_markup=markup)
                except Exception:
                    pass
        except Exception as _ae:
            log.warning("Admin xabar: %s", _ae)

        await update.message.reply_text(javob, parse_mode=ParseMode.MARKDOWN, reply_markup=markup)
        return True
    except Exception as e:
        log.error("shogird_xarajat: %s", e, exc_info=True)
        return False


def register_shogird_handlers(app):
    """Shogird buyruqlarini ro'yxatga olish"""
    app.add_handler(CommandHandler("shogird_qosh", cmd_shogird_qosh))
    app.add_handler(CommandHandler("shogirdlar", cmd_shogirdlar))
    app.add_handler(CommandHandler("xarajatlar", cmd_xarajatlar))
    app.add_handler(CallbackQueryHandler(shogird_xarajat_cb, pattern=r"^sx:"))
