"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — RFM BOT HANDLERS                             ║
║                                                                   ║
║   /rfm              — segmentlar xulosasi (Champions, Loyal, ...) ║
║   /rfm_champions    — TOP klientlar ro'yxati                      ║
║   /rfm_atrisk       — Xavfli klientlar ro'yxati                   ║
║   /rfm_lost         — Yo'qolgan klientlar                         ║
║   /rfm_klient [id]  — bitta klient profil + R/F/M                 ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


async def cmd_rfm(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/rfm — barcha segmentlar umumiy xulosa."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.rfm_segment import segment_xulosasi, SEGMENT_IZOH
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            s = await segment_xulosasi(c, uid, hafta_soni=26)
    except Exception as e:
        log.error("cmd_rfm xato uid=%s: %s", uid, e, exc_info=True)
        await update.message.reply_text("⚠️ RFM tahlil qilishda xato.")
        return

    if s["jami_klient"] == 0:
        await update.message.reply_text(
            "📊 RFM tahlil uchun ma'lumot yetarli emas.\n"
            "Kamida bir nechta klient + sotuv bo'lishi kerak."
        )
        return

    lines = [
        f"📊 *RFM SEGMENTATSIYA* (oxirgi 6 oy)",
        "",
        f"👥 Jami klient: *{s['jami_klient']}*",
        f"💰 Jami aylanma: *{s['jami_monetary']:,.0f}* so'm",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
    ]
    # Segmentlar tartibi (muhimlik bo'yicha)
    tartib = ["Champions", "Loyal", "At Risk", "Potential", "Hibernating", "Lost", "Regular"]
    for seg in tartib:
        if seg not in s["segmentlar"]:
            continue
        v = s["segmentlar"][seg]
        if v["soni"] == 0:
            continue
        lines.append("")
        lines.append(
            f"{v['emoji']} *{seg}* — {v['soni']} ta klient "
            f"({v['monetary_foiz']}% aylanmaga)"
        )
        lines.append(f"  💰 {v['monetary_sum']:,.0f} so'm")
        if v["misol_klientlar"]:
            misol = ", ".join(v["misol_klientlar"][:3])
            lines.append(f"  Misol: _{misol}_")
        lines.append(f"  💡 {SEGMENT_IZOH.get(seg, '')}")

    lines.extend([
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
        "Batafsil ro'yxat:",
        "  /rfm_champions — TOP klientlar",
        "  /rfm_atrisk    — xavfli klientlar",
        "  /rfm_lost      — yo'qolgan klientlar",
    ])
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def _segment_royxat(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                           segment_nom: str, emoji: str, max_show: int = 15):
    """Ichki yordamchi: segment ro'yxatini ko'rsatish."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.rfm_segment import rfm_hisobla
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            all_ = await rfm_hisobla(c, uid, hafta_soni=26)
        filtr = [k for k in all_ if k["segment"] == segment_nom]
    except Exception as e:
        log.error("segment_royxat xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xato.")
        return

    if not filtr:
        await update.message.reply_text(f"📭 *{segment_nom}* segmentida klient yo'q.",
                                         parse_mode=ParseMode.MARKDOWN)
        return
    lines = [
        f"{emoji} *{segment_nom} — {len(filtr)} ta klient*",
        "",
    ]
    for k in filtr[:max_show]:
        tel = f" 📞 {k['telefon']}" if k.get("telefon") else ""
        lines.append(
            f"*{k['ism']}*{tel}\n"
            f"  💰 {k['monetary']:,.0f} so'm ({k['frequency']} xarid, "
            f"oxirgi {k['recency_days']} kun oldin)\n"
            f"  R={k['R']} F={k['F']} M={k['M']}"
        )
    if len(filtr) > max_show:
        lines.append(f"\n... yana {len(filtr) - max_show} ta")
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_rfm_champions(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await _segment_royxat(update, ctx, "Champions", "🏆")


async def cmd_rfm_loyal(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await _segment_royxat(update, ctx, "Loyal", "💎")


async def cmd_rfm_atrisk(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await _segment_royxat(update, ctx, "At Risk", "⚠️")


async def cmd_rfm_lost(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await _segment_royxat(update, ctx, "Lost", "💀")


async def cmd_rfm_hibernating(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await _segment_royxat(update, ctx, "Hibernating", "😴")


async def cmd_rfm_klient(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/rfm_klient [klient_id] — bitta klient uchun R/F/M batafsil."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "Format: `/rfm_klient [klient_id]`\n"
            "Misol: `/rfm_klient 15`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    klient_id = int(parts[1])
    try:
        from shared.services.rfm_segment import rfm_hisobla, SEGMENT_IZOH
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            all_ = await rfm_hisobla(c, uid, hafta_soni=26)
    except Exception as e:
        log.error("cmd_rfm_klient xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xato.")
        return
    klient = next((k for k in all_ if k["klient_id"] == klient_id), None)
    if not klient:
        await update.message.reply_text(
            f"⚠️ Klient #{klient_id} RFM tahlilda topilmadi (ehtimol sotuv yo'q)."
        )
        return
    msg = (
        f"{klient['emoji']} *{klient['ism']}* — {klient['segment']}\n"
        f"{'━' * 28}\n\n"
        f"📅 *Recency:* {klient['recency_days']} kun oldin ({klient['R']}/5)\n"
        f"🔁 *Frequency:* {klient['frequency']} xarid ({klient['F']}/5)\n"
        f"💰 *Monetary:* {klient['monetary']:,.0f} so'm ({klient['M']}/5)\n"
        f"🎯 *Jami bal:* {klient['jami_bal']}/15\n\n"
        f"💡 {SEGMENT_IZOH.get(klient['segment'], '')}"
    )
    await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN)
