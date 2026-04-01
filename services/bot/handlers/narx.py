"""
Narx guruhlari buyruqlari.
/narx_guruh, /narx_qoy, /klient_narx, /klient_guruh
"""
from __future__ import annotations
import logging
from decimal import Decimal

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes, CommandHandler

import services.bot.db as db
from shared.utils import like_escape
from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("savdoai.bot.narx")


async def cmd_narx_guruh(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Narx guruh yaratish/ko'rish. /narx_guruh [nom]"""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split(maxsplit=1)

    try:
        from shared.services.smart_narx import guruhlar_royxati, guruh_yaratish
        async with db._P().acquire() as c:
            if len(qismlar) > 1:
                nom = qismlar[1].strip()
                gid = await guruh_yaratish(c, uid, nom)
                await update.message.reply_text(
                    f"✅ *Narx guruhi yaratildi!*\n\n"
                    f"🏷 Nomi: *{nom}*\n"
                    f"ID: #{gid}\n\n"
                    f"Narx qo'yish: `/narx_qoy {nom} Ariel 45000`",
                    parse_mode=ParseMode.MARKDOWN)
            else:
                guruhlar = await guruhlar_royxati(c, uid)
                if not guruhlar:
                    await update.message.reply_text(
                        "📋 Hali narx guruhi yo'q.\n\n"
                        "Yaratish: `/narx_guruh Ulgurji`\n"
                        "Masalan: Ulgurji, Chakana, VIP",
                        parse_mode=ParseMode.MARKDOWN)
                    return
                matn = "🏷 *NARX GURUHLARI*\n━━━━━━━━━━━━━━━━━━\n\n"
                for g in guruhlar:
                    matn += (
                        f"🏷 *{g['nomi']}*\n"
                        f"   📦 {g['tovar_soni']} ta tovar narxi\n"
                        f"   👥 {g['klient_soni']} ta klient\n\n"
                    )
                matn += "Yangi guruh: `/narx_guruh <nom>`\nNarx qo'yish: `/narx_qoy <guruh> <tovar> <narx>`"
                await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_narx_guruh: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def cmd_narx_qoy(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Narx qo'yish. /narx_qoy <guruh> <tovar> <narx>"""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split()

    if len(qismlar) < 4:
        await update.message.reply_text(
            "📝 *Narx qo'yish*\n\n"
            "Format: `/narx_qoy <guruh> <tovar> <narx>`\n\n"
            "Masalan:\n"
            "`/narx_qoy Ulgurji Ariel 43000`\n"
            "`/narx_qoy VIP Tide 38000`",
            parse_mode=ParseMode.MARKDOWN)
        return

    guruh_nom = qismlar[1]
    tovar_nom = qismlar[2]
    try:
        narx = float(qismlar[3].replace(",", ""))
    except ValueError:
        await update.message.reply_text("❌ Narx raqam bo'lishi kerak.")
        return

    try:
        from shared.services.smart_narx import guruh_narx_qoyish
        async with db._P().acquire() as c:
            guruh = await c.fetchrow(
                "SELECT id FROM narx_guruhlari WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2)",
                uid, f"%{like_escape(guruh_nom)}%")
            if not guruh:
                await update.message.reply_text(
                    f"❌ *{guruh_nom}* guruhi topilmadi.\n/narx_guruh bilan yarating.",
                    parse_mode=ParseMode.MARKDOWN)
                return
            tovar = await c.fetchrow(
                "SELECT id, nomi FROM tovarlar WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2)",
                uid, f"%{like_escape(tovar_nom)}%")
            if not tovar:
                await update.message.reply_text(
                    f"❌ *{tovar_nom}* tovari topilmadi.", parse_mode=ParseMode.MARKDOWN)
                return
            await guruh_narx_qoyish(c, uid, guruh["id"], tovar["id"], Decimal(str(narx)))
        await update.message.reply_text(
            f"✅ *Narx qo'yildi!*\n\n"
            f"🏷 Guruh: *{guruh_nom}*\n"
            f"📦 Tovar: *{tovar['nomi']}*\n"
            f"💰 Narx: *{narx:,.0f} so'm*",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_narx_qoy: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def cmd_klient_narx(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Klientga shaxsiy narx. /klient_narx <klient> <tovar> <narx>"""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split()

    if len(qismlar) < 4:
        await update.message.reply_text(
            "📝 *Klient shaxsiy narx*\n\n"
            "Format: `/klient_narx <klient> <tovar> <narx>`\n\n"
            "Masalan:\n"
            "`/klient_narx Salimov Ariel 43000`\n"
            "`/klient_narx Karimov Tide 38000`",
            parse_mode=ParseMode.MARKDOWN)
        return

    klient_nom = qismlar[1]
    tovar_nom = qismlar[2]
    try:
        narx = float(qismlar[3].replace(",", ""))
    except ValueError:
        await update.message.reply_text("❌ Narx raqam bo'lishi kerak.")
        return

    try:
        from shared.services.smart_narx import shaxsiy_narx_qoyish
        async with db._P().acquire() as c:
            klient = await c.fetchrow(
                "SELECT id, ism FROM klientlar WHERE user_id=$1 AND LOWER(ism) LIKE LOWER($2)",
                uid, f"%{like_escape(klient_nom)}%")
            if not klient:
                await update.message.reply_text(
                    f"❌ *{klient_nom}* klienti topilmadi.", parse_mode=ParseMode.MARKDOWN)
                return
            tovar = await c.fetchrow(
                "SELECT id, nomi FROM tovarlar WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2)",
                uid, f"%{like_escape(tovar_nom)}%")
            if not tovar:
                await update.message.reply_text(
                    f"❌ *{tovar_nom}* tovari topilmadi.", parse_mode=ParseMode.MARKDOWN)
                return
            await shaxsiy_narx_qoyish(c, uid, klient["id"], tovar["id"], Decimal(str(narx)))
        await update.message.reply_text(
            f"✅ *Shaxsiy narx qo'yildi!*\n\n"
            f"👤 Klient: *{klient['ism']}*\n"
            f"📦 Tovar: *{tovar['nomi']}*\n"
            f"💰 Narx: *{narx:,.0f} so'm*\n\n"
            f"Endi \"{klient['ism']}ga {tovar['nomi']}\" desangiz, narx avtomatik qo'yiladi.",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_klient_narx: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def cmd_klient_guruh(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Klientni guruhga biriktirish. /klient_guruh <klient> <guruh>"""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split()

    if len(qismlar) < 3:
        await update.message.reply_text(
            "📝 *Klientni guruhga biriktirish*\n\n"
            "Format: `/klient_guruh <klient> <guruh>`\n\n"
            "Masalan:\n"
            "`/klient_guruh Salimov Ulgurji`",
            parse_mode=ParseMode.MARKDOWN)
        return

    klient_nom = qismlar[1]
    guruh_nom = qismlar[2]

    try:
        from shared.services.smart_narx import klient_guruhga_qoyish
        async with db._P().acquire() as c:
            klient = await c.fetchrow(
                "SELECT id, ism FROM klientlar WHERE user_id=$1 AND LOWER(ism) LIKE LOWER($2)",
                uid, f"%{like_escape(klient_nom)}%")
            if not klient:
                await update.message.reply_text(
                    f"❌ *{klient_nom}* topilmadi.", parse_mode=ParseMode.MARKDOWN)
                return
            guruh = await c.fetchrow(
                "SELECT id, nomi FROM narx_guruhlari WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2)",
                uid, f"%{like_escape(guruh_nom)}%")
            if not guruh:
                await update.message.reply_text(
                    f"❌ *{guruh_nom}* guruhi topilmadi.", parse_mode=ParseMode.MARKDOWN)
                return
            await klient_guruhga_qoyish(c, uid, klient["id"], guruh["id"])
        await update.message.reply_text(
            f"✅ *Biriktirildi!*\n\n"
            f"👤 *{klient['ism']}* → 🏷 *{guruh['nomi']}*\n\n"
            f"Endi {klient['ism']}ga sotuv qilsangiz, {guruh['nomi']} narxlari avtomatik qo'yiladi.",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_klient_guruh: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


def register_narx_handlers(app):
    """Narx buyruqlarini ro'yxatga olish"""
    app.add_handler(CommandHandler("narx_guruh", cmd_narx_guruh))
    app.add_handler(CommandHandler("narx_qoy", cmd_narx_qoy))
    app.add_handler(CommandHandler("klient_narx", cmd_klient_narx))
    app.add_handler(CommandHandler("klient_guruh", cmd_klient_guruh))
