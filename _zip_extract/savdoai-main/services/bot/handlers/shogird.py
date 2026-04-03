"""
Shogird xarajat nazorati buyruqlari.
/shogird_qosh, /shogirdlar, /xarajatlar, sx:* callback
"""
from __future__ import annotations
import logging
from decimal import Decimal

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes, CommandHandler, CallbackQueryHandler

import services.bot.db as db
from shared.database.pool import rls_conn as _rls_conn
from services.bot.bot_helpers import faol_tekshir, cfg, tg

log = logging.getLogger("savdoai.bot.shogird")


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
    """Shogird xarajat yubordi — qayta ishlash"""
    from shared.services.shogird_xarajat import xarajat_saqlash, kategoriya_aniqla
    import re

    raqamlar = re.findall(r'[\d,]+(?:\.\d+)?', matn.replace(" ", ""))
    if not raqamlar:
        return False

    summa = max(float(r.replace(",", "")) for r in raqamlar)
    if summa < 1000:
        return False

    kat_nomi, kat_emoji = kategoriya_aniqla(matn)
    izoh = matn.strip()

    admin_uid = shogird["admin_uid"]
    shogird_id = shogird["id"]

    try:
        async with _rls_conn(admin_uid) as c:
            result = await xarajat_saqlash(c, admin_uid, shogird_id, kat_nomi, summa, izoh)

        limit_info = result.get("limit_info", {})
        ogohlantirish = limit_info.get("ogohlantirish", [])

        javob = (
            f"✅ *Xarajat saqlandi!*\n\n"
            f"{kat_emoji} Kategoriya: *{kat_nomi}*\n"
            f"💰 Summa: *{summa:,.0f} so'm*\n"
            f"📝 Izoh: _{izoh[:50]}_\n"
            f"\n📊 Bugun jami: *{limit_info.get('bugungi', 0) + Decimal(str(summa)):,.0f}* / "
            f"{limit_info.get('kunlik_limit', 0):,.0f}\n"
        )

        if ogohlantirish:
            javob += "\n" + "\n".join(ogohlantirish)

        if not limit_info.get("ruxsat", True):
            javob += "\n\n🔴 *LIMIT OSHDI! Admin xabardor qilinadi.*"
            try:
                admin_msg = (
                    f"🔴 *LIMIT OGOHLANTIRISH!*\n\n"
                    f"👤 Shogird: *{shogird['ism']}*\n"
                    f"{kat_emoji} {kat_nomi}: *{summa:,.0f} so'm*\n"
                    f"📊 Bugun: *{limit_info.get('bugungi', 0) + Decimal(str(summa)):,.0f}* / "
                    f"{limit_info.get('kunlik_limit', 0):,.0f}"
                )
                for aid in cfg().admin_ids:
                    try:
                        await ctx.bot.send_message(aid, admin_msg, parse_mode=ParseMode.MARKDOWN)
                    except Exception:
                        pass
            except Exception as _ae:
                log.warning("Admin xabar: %s", _ae)

        await update.message.reply_text(javob, parse_mode=ParseMode.MARKDOWN)
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
