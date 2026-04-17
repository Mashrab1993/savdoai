"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — EXPEDITOR KPI BOT HANDLERS                   ║
║                                                                   ║
║   /shogird_kpi [shogird_id]  — bitta shogird to'liq KPI          ║
║   /kpi_reyting               — barcha shogirdlar reyting          ║
║                                                                   ║
║  Ovoz: "Akbar KPI" / "Shogirdlar reyting" / "KPI ko'rsat"        ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


async def cmd_shogird_kpi(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/shogird_kpi [shogird_id] — bitta shogird to'liq KPI."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "📊 *Shogird KPI*\n\n"
            "Format: `/shogird_kpi [shogird_id]`\n"
            "Misol: `/shogird_kpi 5`\n\n"
            "Barcha shogirdlar: /kpi_reyting",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    shogird_id = int(parts[1])
    try:
        from shared.services.expeditor_kpi import shogird_kpi
        from shared.database.pool import get_pool
        async with get_pool().acquire() as c:
            k = await shogird_kpi(c, uid, shogird_id, kun=30)
    except Exception as e:
        log.error("cmd_shogird_kpi xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ KPI olishda xato.")
        return
    if not k:
        await update.message.reply_text(f"⚠️ Shogird #{shogird_id} topilmadi.")
        return
    await update.message.reply_text(_format_kpi(k), parse_mode=ParseMode.MARKDOWN)


async def cmd_kpi_reyting(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/kpi_reyting — barcha shogirdlar reyting."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.expeditor_kpi import barcha_shogirdlar_kpi
        from shared.database.pool import get_pool
        async with get_pool().acquire() as c:
            ns = await barcha_shogirdlar_kpi(c, uid, kun=30)
    except Exception as e:
        log.error("cmd_kpi_reyting xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Reyting olinmadi.")
        return
    if not ns:
        await update.message.reply_text(
            "📭 Shogirdlar yo'q.\n\nQo'shish: `/shogird_qosh [telegram_id] [ism]`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    lines = [f"🏆 *SHOGIRDLAR KPI REYTING* (oxirgi 30 kun)", ""]
    for i, k in enumerate(ns, 1):
        emoji_place = "🥇" if i == 1 else ("🥈" if i == 2 else ("🥉" if i == 3 else f"{i}."))
        lines.append(
            f"{emoji_place} *{k['ism']}* — {k['umumiy_score']}/100 {k['holat']}\n"
            f"  💰 Sotuv: {k['sotuv']['soni']} ta ({k['sotuv']['jami']:,.0f})\n"
            f"  🏪 Tashrif: {k['tashrif']['soni']} ta | ✅ Vazifa: {k['vazifa']['bajarish_foiz']:.0f}%\n"
            f"  💸 Xarajat: {k['xarajat']['oylik_foiz']:.0f}% limitdan"
        )
    lines.append("")
    lines.append("Batafsil: /shogird_kpi [id]")
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


def _format_kpi(k: dict) -> str:
    """Bitta shogird KPI formatlash."""
    lines = [
        f"📊 *{k['ism']}* — KPI (30 kun)",
        f"*Umumiy:* {k['umumiy_score']}/100 {k['holat']}",
        f"Lavozim: {k.get('lavozim') or '—'}",
        "",
        "━━━━━━━━━━━━━━━━━━",
        f"💰 *SOTUV* ({k['sotuv']['score']}/100)",
        f"  Soni: {k['sotuv']['soni']} ta",
        f"  Jami: {k['sotuv']['jami']:,.0f} so'm",
        f"  Naqd: {k['sotuv']['naqd']:,.0f} | Qarz: {k['sotuv']['qarz']:,.0f}",
        f"  Noyob klient: {k['sotuv']['noyob_klient']}",
        "",
        f"🏪 *TASHRIF (Storecheck)* ({k['tashrif']['score']}/100)",
        f"  Soni: {k['tashrif']['soni']} ta",
        f"  Ortacha: {k['tashrif']['ortacha_daqiqa']:.1f} daqiqa",
        f"  Noyob klient: {k['tashrif']['noyob_klient']}",
        "",
        f"✅ *VAZIFALAR* ({k['vazifa']['score']}/100)",
        f"  Jami: {k['vazifa']['jami']}",
        f"  Bajarildi: {k['vazifa']['bajarildi']}",
        f"  Muddati o'tgan: {k['vazifa']['muddati_otgan']}",
        "",
        f"💸 *XARAJAT* ({k['xarajat']['score']}/100)",
        f"  Oylik: {k['xarajat']['oylik_jami']:,.0f} / {k['xarajat']['oylik_limit']:,.0f}",
        f"  Foiz: {k['xarajat']['oylik_foiz']:.1f}%",
        f"  Kutilayotgan tasdiq: {k['xarajat']['kutilayotgan']}",
    ]
    if k.get("plan") and k["plan"].get("plan_mavjud"):
        p = k["plan"]
        lines.extend([
            "",
            f"📅 *PLAN* ({p['yil']}.{p['oy']:02d})",
            f"  Sotuv: {p['sotuv']['foiz']:.1f}% {p['sotuv']['holati']}",
            f"  Yangi klient: {p['yangi_klient']['foiz']:.1f}%",
            f"  Tashrif: {p['tashrif']['foiz']:.1f}%",
        ])
    return "\n".join(lines)
