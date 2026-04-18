"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — PLANNING BOT HANDLERS                        ║
║                                                                   ║
║  /plan [summa]      — Bu oyga sotuv plan qo'yish (matn)          ║
║  /plan              — Hozirgi plan va progress                    ║
║  /plan_shogird [shogird_id] [summa] — shogirdga plan             ║
║  /outlet_plan [klient_id] [summa]   — klient (do'kon) plan       ║
║                                                                   ║
║  Ovoz: "Bu oy 30 million plan" → avtomatik parse                 ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import re
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Optional

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")

_OY_NOMI = [
    "", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
]


def _parse_summa(text: str) -> Decimal | None:
    """Matn'dan summa ajratish. '30 mln', '30 million', '500 ming', '30000000'."""
    m = text.lower().replace(",", "").replace(".", "")
    # mln / million
    mln_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:mln|million|mln)', m)
    if mln_match:
        try:
            return Decimal(mln_match.group(1)) * Decimal("1000000")
        except InvalidOperation:
            pass
    # ming
    ming_match = re.search(r'(\d+(?:\.\d+)?)\s*ming', m)
    if ming_match:
        try:
            return Decimal(ming_match.group(1)) * Decimal("1000")
        except InvalidOperation:
            pass
    # raw raqam
    raw_match = re.search(r'(\d{4,})', m.replace(" ", ""))
    if raw_match:
        try:
            return Decimal(raw_match.group(1))
        except InvalidOperation:
            pass
    return None


async def cmd_plan(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/plan [summa] — bu oyga sotuv plan. Raqamsiz bo'lsa — progress ko'rsatadi."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=1)
    matn = parts[1].strip() if len(parts) > 1 else ""

    bugun = date.today()
    try:
        from shared.services.planning import plan_qoy, plan_progress
        from shared.database.pool import rls_conn

        if not matn:
            # Progress rejimi
            async with rls_conn(uid) as c:
                p = await plan_progress(c, uid, bugun.year, bugun.month)
            if not p.get("plan_mavjud"):
                await update.message.reply_text(
                    f"📅 *{_OY_NOMI[bugun.month]} {bugun.year}* oyi uchun plan yo'q.\n\n"
                    "Plan qo'yish:\n"
                    "  `/plan 30 mln`\n"
                    "  `/plan 30000000`\n"
                    "  Ovoz: _\"Bu oy o'ttiz million plan\"_",
                    parse_mode=ParseMode.MARKDOWN,
                )
                return
            lines = [
                f"📅 *{_OY_NOMI[p['oy']]} {p['yil']} — plan VS natija*",
                "",
                f"⏳ Oyning {p['otgan_kun']}/{p['oy_kunlari']} kun o'tdi "
                f"(kutilgan: {p['kutilgan_foiz']}%)",
                "",
                "💰 *Sotuv:*",
                f"  Plan: *{p['sotuv']['plan']:,.0f}* so'm",
                f"  Natija: *{p['sotuv']['fact']:,.0f}* so'm ({p['sotuv']['foiz']:.1f}%)",
                f"  {p['sotuv']['holati']}",
                "",
                "👥 *Yangi klient:*",
                f"  Plan: {p['yangi_klient']['plan']} ta",
                f"  Natija: {p['yangi_klient']['fact']} ta ({p['yangi_klient']['foiz']:.1f}%)",
                f"  {p['yangi_klient']['holati']}",
                "",
                "🏪 *Tashrif (storecheck):*",
                f"  Plan: {p['tashrif']['plan']} ta",
                f"  Natija: {p['tashrif']['fact']} ta ({p['tashrif']['foiz']:.1f}%)",
                f"  {p['tashrif']['holati']}",
            ]
            await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
            return

        # Plan qo'yish rejimi
        summa = _parse_summa(matn)
        if not summa:
            await update.message.reply_text(
                "⚠️ Summa tushunmadim. Misollar:\n"
                "  `/plan 30 mln`\n"
                "  `/plan 30000000`\n"
                "  `/plan 500 ming`",
                parse_mode=ParseMode.MARKDOWN,
            )
            return

        async with rls_conn(uid) as c:
            plan_id = await plan_qoy(
                c, uid, bugun.year, bugun.month,
                sotuv_plan=summa, izoh=matn[:200],
            )
        await update.message.reply_text(
            f"✅ *{_OY_NOMI[bugun.month]} {bugun.year}* uchun plan qo'yildi:\n\n"
            f"💰 Sotuv: *{summa:,.0f}* so'm\n\n"
            f"Kundalik kuzatuv: /plan\n"
            f"Shogird plani: `/plan_shogird [id] [summa]`\n"
            f"Klient plani: `/outlet_plan [klient_id] [summa]`",
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as e:
        log.error("cmd_plan xato uid=%s: %s", uid, e, exc_info=True)
        await update.message.reply_text("⚠️ Plan bilan ishlashda xato.")


async def cmd_plan_shogird(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/plan_shogird [shogird_id] [summa] — shogirdga oylik plan."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=2)
    if len(parts) < 3 or not parts[1].isdigit():
        await update.message.reply_text(
            "Format: `/plan_shogird [shogird_id] [summa]`\n"
            "Misol: `/plan_shogird 5 15 mln`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    shogird_id = int(parts[1])
    summa = _parse_summa(parts[2])
    if not summa:
        await update.message.reply_text("⚠️ Summa tushunmadim (misol: 15 mln)")
        return
    bugun = date.today()
    try:
        from shared.services.planning import plan_qoy
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            # Shogird borligini tekshirish
            shogird = await c.fetchrow(
                "SELECT ism FROM shogirdlar WHERE id=$1 AND admin_uid=$2",
                shogird_id, uid,
            )
            if not shogird:
                await update.message.reply_text(f"⚠️ Shogird #{shogird_id} topilmadi.")
                return
            await plan_qoy(c, uid, bugun.year, bugun.month,
                            sotuv_plan=summa, shogird_id=shogird_id)
        await update.message.reply_text(
            f"✅ *{shogird['ism']}* uchun {_OY_NOMI[bugun.month]} {bugun.year} plan:\n"
            f"💰 Sotuv: *{summa:,.0f}* so'm",
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as e:
        log.error("cmd_plan_shogird: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Plan qo'yishda xato.")


async def cmd_outlet_plan(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/outlet_plan [klient_id] [summa] — klient (do'kon) uchun plan."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=2)
    if len(parts) < 3 or not parts[1].isdigit():
        await update.message.reply_text(
            "Format: `/outlet_plan [klient_id] [summa]`\n"
            "Misol: `/outlet_plan 15 5 mln`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    klient_id = int(parts[1])
    summa = _parse_summa(parts[2])
    if not summa:
        await update.message.reply_text("⚠️ Summa tushunmadim.")
        return
    bugun = date.today()
    try:
        from shared.services.planning import outlet_plan_qoy
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            klient = await c.fetchrow(
                "SELECT ism FROM klientlar WHERE id=$1 AND user_id=$2",
                klient_id, uid,
            )
            if not klient:
                await update.message.reply_text(f"⚠️ Klient #{klient_id} topilmadi.")
                return
            await outlet_plan_qoy(c, uid, klient_id, bugun.year, bugun.month,
                                   sotuv_plan=summa)
        await update.message.reply_text(
            f"✅ *{klient['ism']}* do'koni uchun {_OY_NOMI[bugun.month]} plan:\n"
            f"💰 {summa:,.0f} so'm",
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as e:
        log.error("cmd_outlet_plan: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Klient plan qo'yishda xato.")
