"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — FEEDBACK BOT HANDLERS                        ║
║                                                                   ║
║  Klient (yoki admin o'zi):                                        ║
║   /fikr [matn]                        — yangi fikr/shikoyat       ║
║  Admin:                                                           ║
║   /fikrlar                            — hamma fikrlar             ║
║   /shikoyatlar                        — faqat shikoyatlar         ║
║   /javob [feedback_id] [javob matni]  — javob berish              ║
║   /fikr_stat                          — 30 kunlik statistika      ║
║                                                                   ║
║  Ovoz:                                                            ║
║   "Shikoyat: Ariel sovuq kelgan" → turi=shikoyat                 ║
║   "Fikr: yaxshi xizmat rahmat"   → turi=maqtov (avto)            ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir, cfg

log = logging.getLogger("mm")


async def cmd_fikr(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/fikr [matn] — yangi feedback yozish."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=1)
    matn = parts[1].strip() if len(parts) > 1 else ""
    if not matn:
        await update.message.reply_text(
            "💬 *Fikr/Shikoyat qoldirish*\n\n"
            "Format: `/fikr [matningiz]`\n\n"
            "Misollar:\n"
            "  `/fikr Xizmat ajoyib, rahmat!` — maqtov\n"
            "  `/fikr Ariel sovuq keldi` — shikoyat\n"
            "  `/fikr Yangi brend qo'shsangiz` — taklif\n\n"
            "Ovoz: _\"Fikr: xizmat ajoyib rahmat\"_ (turi avtomatik aniqlanadi)",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    try:
        from shared.services.feedback_svc import feedback_qoshish, turi_aniqla
        from shared.database.pool import rls_conn
        turi = turi_aniqla(matn)
        async with rls_conn(uid) as c:
            # Agar /fikr user admin bo'lmasa, uni klient sifatida saqlash
            # Hozirda oddiy — user_id = admin_uid (self-feedback)
            fid = await feedback_qoshish(c, uid, matn, turi=turi)
        turi_emoji = {"shikoyat": "⚠️", "maqtov": "🎉", "taklif": "💡",
                       "fikr": "💬"}
        await update.message.reply_text(
            f"{turi_emoji.get(turi, '💬')} Fikringiz saqlandi (#{fid}, turi: *{turi}*)\n\n"
            f"Rahmat! Admin tez orada javob beradi.",
            parse_mode=ParseMode.MARKDOWN,
        )
        # Adminlarga bildirish
        try:
            for aid in cfg().admin_ids:
                if aid != uid:  # o'ziga yubormaymiz
                    await ctx.bot.send_message(
                        aid,
                        f"{turi_emoji.get(turi, '💬')} *Yangi {turi}* #{fid}\n\n"
                        f"_{matn[:300]}_\n\n"
                        f"Javob: `/javob {fid} [javob matni]`",
                        parse_mode=ParseMode.MARKDOWN,
                    )
        except Exception as _e:
            log.debug("Admin feedback bildirish: %s", _e)
    except Exception as e:
        log.error("cmd_fikr xato uid=%s: %s", uid, e, exc_info=True)
        await update.message.reply_text("⚠️ Fikr saqlashda xato.")


async def cmd_fikrlar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/fikrlar — barcha fikrlar (javobsizlari birinchi)."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.feedback_svc import feedback_royxat
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            rows = await feedback_royxat(c, uid, faqat_javobsiz=False, limit=20)
    except Exception as e:
        log.error("cmd_fikrlar xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Fikrlar olishda xato.")
        return
    if not rows:
        await update.message.reply_text("📭 Hali fikr yo'q.")
        return
    turi_emoji = {"shikoyat": "⚠️", "maqtov": "🎉", "taklif": "💡", "fikr": "💬"}
    lines = [f"💬 *Fikrlar ({len(rows)} ta):*", ""]
    for r in rows:
        emoji = turi_emoji.get(r["turi"], "💬")
        status = "✅" if r["javob_berildi"] else "⏳"
        klient = f" [{r['klient_ismi']}]" if r.get("klient_ismi") else ""
        vaqt = r["yaratilgan"].strftime("%d.%m %H:%M") if r.get("yaratilgan") else ""
        lines.append(
            f"{status} {emoji} *#{r['id']}* [{r['turi']}]{klient} — {vaqt}\n"
            f"  {r['matn'][:120]}"
        )
    lines.append("\nJavob: `/javob [id] [matn]`")
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_shikoyatlar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/shikoyatlar — faqat shikoyatlar (javobsizlari)."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.feedback_svc import feedback_royxat
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            rows = await feedback_royxat(c, uid, faqat_javobsiz=True,
                                          turi="shikoyat", limit=20)
    except Exception as e:
        log.error("cmd_shikoyatlar xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xato.")
        return
    if not rows:
        await update.message.reply_text("✅ Javobsiz shikoyat yo'q!")
        return
    lines = [f"⚠️ *Javobsiz shikoyatlar ({len(rows)} ta):*", ""]
    for r in rows:
        klient = f" [{r['klient_ismi']}]" if r.get("klient_ismi") else ""
        vaqt = r["yaratilgan"].strftime("%d.%m %H:%M") if r.get("yaratilgan") else ""
        lines.append(
            f"⏳ *#{r['id']}*{klient} — {vaqt}\n"
            f"  {r['matn']}"
        )
    lines.append("\nJavob: `/javob [id] [matn]`")
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_javob(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/javob [feedback_id] [matn] — admin feedback'ga javob berish."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=2)
    if len(parts) < 3 or not parts[1].isdigit():
        await update.message.reply_text(
            "Format: `/javob [feedback_id] [javob matni]`\n"
            "Misol: `/javob 5 Rahmat, ertangacha yetkazib beramiz`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    fid = int(parts[1])
    javob_matn = parts[2].strip()
    try:
        from shared.services.feedback_svc import feedback_javob
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            ok = await feedback_javob(c, uid, fid, javob_matn)
        if ok:
            await update.message.reply_text(f"✅ Feedback #{fid}'ga javob yozildi.")
        else:
            await update.message.reply_text(
                f"⚠️ Feedback #{fid} topilmadi yoki allaqachon javob berilgan."
            )
    except Exception as e:
        log.error("cmd_javob xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Javob saqlashda xato.")


async def cmd_fikr_stat(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/fikr_stat — 30 kunlik feedback statistikasi."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.feedback_svc import feedback_statistika
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            s = await feedback_statistika(c, uid, kun=30)
    except Exception as e:
        log.error("cmd_fikr_stat xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Statistika olinmadi.")
        return
    if s["jami"] == 0:
        await update.message.reply_text("📭 Oxirgi 30 kunda fikr yo'q.")
        return
    lines = [
        f"💬 *FIKR STATISTIKA — 30 kun*",
        "",
        f"📋 Jami: *{s['jami']}*",
        f"  ⏳ Javobsiz: {s['javobsiz']}",
    ]
    if s["ortacha_baho"] > 0:
        lines.append(f"  ⭐ Ortacha baho: {s['ortacha_baho']}/5")
    lines.append("")
    lines.append("*Turlari:*")
    turi_emoji = {"shikoyat": "⚠️", "maqtov": "🎉", "taklif": "💡", "fikr": "💬"}
    for t in s["turlar"]:
        emoji = turi_emoji.get(t["turi"], "💬")
        javob_foiz = (int(t["javob_berildi"]) / int(t["jami"]) * 100) if int(t["jami"]) else 0
        lines.append(
            f"  {emoji} {t['turi']}: {int(t['jami'])} ta "
            f"(javob: {javob_foiz:.0f}%)"
        )
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
