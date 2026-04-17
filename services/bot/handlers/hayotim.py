"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — HAYOTIM MODULI BOT HANDLERLARI                ║
║                                                                   ║
║  Admin uchun shaxsiy co-pilot buyruqlari:                        ║
║   /hayotim        — Dashboard                                     ║
║   /maqsad [matn]  — Yangi maqsad/reja                            ║
║   /goya [matn]    — Yangi g'oya                                   ║
║   /xarajatim [summa] [kategoriya]  — Shaxsiy xarajat             ║
║   /haftam         — Haftalik xulosa                               ║
║   /oyim           — Opus 4.7 30 kunlik chuqur tahlil             ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


# ════════════════════════════════════════════════════════════════════
#  /hayotim — DASHBOARD
# ════════════════════════════════════════════════════════════════════

async def cmd_hayotim(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/hayotim — shaxsiy dashboard (maqsad + g'oya + xarajat + biznes taqqoslash)."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.hayotim_engine import dashboard_data
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            d = await dashboard_data(c, uid)
    except Exception as e:
        log.error("cmd_hayotim xato uid=%s: %s", uid, e, exc_info=True)
        await update.message.reply_text("⚠️ Hayotim ma'lumoti olinmadi. Keyinroq urinib ko'ring.")
        return

    lines = [
        f"🌟 *HAYOTIM — {d['sana']}*",
        "",
        f"💰 *Bu oy*",
        f"  • Biznes daromad: *{d['biznes_daromad_oy']:,.0f}* so'm",
        f"  • Shaxsiy xarajat: *{d['xarajat_oy']:,.0f}* so'm",
        f"  • Sof qolgan: *{d['sof_oy']:,.0f}* so'm",
        f"  • Bugun xarajat: {d['xarajat_bugun']:,.0f} so'm",
        "",
    ]
    if d["maqsadlar_aktiv"]:
        lines.append(f"🎯 *Aktiv maqsadlar ({len(d['maqsadlar_aktiv'])}):*")
        for m in d["maqsadlar_aktiv"][:5]:
            emoji = "🔴" if m["ustuvorlik"] == 1 else ("🟡" if m["ustuvorlik"] == 2 else "🟢")
            ddl = f" → {m['deadline']}" if m.get("deadline") else ""
            lines.append(f"  {emoji} #{m['id']} {m['matn'][:60]}{ddl}")
        if len(d["maqsadlar_aktiv"]) > 5:
            lines.append(f"  ... yana {len(d['maqsadlar_aktiv']) - 5} ta")
        lines.append("")
    else:
        lines.append("🎯 Aktiv maqsad yo'q. /maqsad yangi kiriting.")
        lines.append("")
    if d["goyalar_yangi_7kun"]:
        lines.append(f"💡 *Yangi g'oyalar (oxirgi 7 kun, {len(d['goyalar_yangi_7kun'])}):*")
        for g in d["goyalar_yangi_7kun"][:5]:
            lines.append(f"  • #{g['id']} {g['matn'][:60]}")
        lines.append("")
    lines.extend([
        f"📊 Jami g'oyalar: {d['goyalar_jami_soni']} ta",
        "",
        "Buyruqlar:",
        "  /maqsad [matn] — yangi maqsad",
        "  /goya [matn] — yangi g'oya",
        "  /xarajatim [summa] [kategoriya] — xarajat",
        "  /oyim — Opus 4.7 30-kunlik chuqur tahlil",
    ])
    text = "\n".join(lines)
    try:
        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
    except Exception:
        await update.message.reply_text(text)


# ════════════════════════════════════════════════════════════════════
#  /maqsad [matn] — yangi maqsad
# ════════════════════════════════════════════════════════════════════

async def cmd_maqsad(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/maqsad [matn] — yangi maqsad/reja qo'shish. Matnsiz chaqirilsa — ro'yxat."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    # Extract args after /maqsad
    parts = text.split(maxsplit=1)
    matn = parts[1].strip() if len(parts) > 1 else ""

    try:
        from shared.services.hayotim_engine import maqsad_qoshish, maqsadlar_royxat
        from shared.database.pool import rls_conn

        if not matn:
            # Ro'yxat rejimi
            async with rls_conn(uid) as c:
                maqsadlar = await maqsadlar_royxat(c, uid, faqat_faol=True, limit=20)
            if not maqsadlar:
                await update.message.reply_text(
                    "🎯 Aktiv maqsad yo'q.\n\n"
                    "Yangi maqsad qo'shish:\n`/maqsad Oyda 30 mln sotuv`",
                    parse_mode=ParseMode.MARKDOWN,
                )
                return
            lines = [f"🎯 *Aktiv maqsadlar ({len(maqsadlar)}):*", ""]
            for m in maqsadlar:
                emoji = "🔴" if m["ustuvorlik"] == 1 else ("🟡" if m["ustuvorlik"] == 2 else "🟢")
                ddl = f" → {m['deadline']}" if m.get("deadline") else ""
                lines.append(f"{emoji} *#{m['id']}* {m['matn']}{ddl}")
            lines.extend(["", "Yangi qo'shish: `/maqsad [matn]`",
                          "Bajarildi deb belgilash: `/maqsad_bajardim [id]`"])
            await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
            return

        # Yangi qo'shish
        async with rls_conn(uid) as c:
            mid = await maqsad_qoshish(c, uid, matn)
        await update.message.reply_text(
            f"✅ Maqsad qo'shildi (#{mid}):\n{matn}\n\n"
            "Ustuvorlik o'zgartirish uchun: /maqsad_ustuvorlik [id] [1-3]\n"
            "Barchasini ko'rish: /maqsad",
        )
    except Exception as e:
        log.error("cmd_maqsad xato uid=%s: %s", uid, e, exc_info=True)
        await update.message.reply_text("⚠️ Maqsad qo'shish xato.")


async def cmd_maqsad_bajardim(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/maqsad_bajardim [id] — maqsadni bajarildi deb belgilash."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text("Foydalanish: `/maqsad_bajardim 5`", parse_mode=ParseMode.MARKDOWN)
        return
    maqsad_id = int(parts[1])
    try:
        from shared.services.hayotim_engine import maqsad_bajardi
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            ok = await maqsad_bajardi(c, uid, maqsad_id)
        if ok:
            await update.message.reply_text(f"🎉 Ajoyib! Maqsad #{maqsad_id} bajarildi!")
        else:
            await update.message.reply_text(f"⚠️ Maqsad #{maqsad_id} topilmadi.")
    except Exception as e:
        log.error("cmd_maqsad_bajardim xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xato yuz berdi.")


# ════════════════════════════════════════════════════════════════════
#  /goya [matn] — yangi g'oya
# ════════════════════════════════════════════════════════════════════

async def cmd_goya(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/goya [matn] — yangi g'oya yozish."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=1)
    matn = parts[1].strip() if len(parts) > 1 else ""

    try:
        from shared.services.hayotim_engine import goya_qoshish, goyalar_royxat
        from shared.database.pool import rls_conn

        if not matn:
            async with rls_conn(uid) as c:
                goyalar = await goyalar_royxat(c, uid, holat="yangi", limit=20)
            if not goyalar:
                await update.message.reply_text(
                    "💡 Yangi g'oya yo'q.\n\nQo'shish: `/goya [matn]`",
                    parse_mode=ParseMode.MARKDOWN,
                )
                return
            lines = [f"💡 *Yangi g'oyalar ({len(goyalar)}):*", ""]
            for g in goyalar:
                sana_str = g["yaratilgan"].strftime("%d.%m") if g.get("yaratilgan") else ""
                lines.append(f"• *#{g['id']}* [{sana_str}] {g['matn'][:100]}")
            lines.extend(["", "Yangi: `/goya [matn]`",
                          "Amalga oshirildi: `/goya_tayyor [id]`"])
            await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
            return

        async with rls_conn(uid) as c:
            gid = await goya_qoshish(c, uid, matn, manba="matn")
        await update.message.reply_text(
            f"💡 G'oya yozildi (#{gid}):\n{matn}\n\n"
            "Keyinroq ro'yxatni /goya bilan ko'rasiz.\n"
            "Opus 4.7 tahlil uchun: /oyim"
        )
    except Exception as e:
        log.error("cmd_goya xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ G'oya saqlashda xato.")


# ════════════════════════════════════════════════════════════════════
#  /xarajatim [summa] [kategoriya] [izoh]
# ════════════════════════════════════════════════════════════════════

_XARAJAT_KATEGORIYALAR = {
    "ovqat": "ovqat", "transport": "transport", "yolqilgi": "transport",
    "dokon": "dokon", "kiyim": "kiyim", "xizmat": "xizmat",
    "soglik": "soglik", "oila": "oila", "tolov": "xizmat",
}


async def cmd_xarajatim(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/xarajatim [summa] [kategoriya] [izoh] — shaxsiy xarajat yozish.

    Misol: /xarajatim 50000 ovqat choyxonada
    """
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=3)

    if len(parts) < 2:
        await update.message.reply_text(
            "💸 *Shaxsiy xarajat yozish*\n\n"
            "Foydalanish:\n"
            "  `/xarajatim 50000 ovqat`\n"
            "  `/xarajatim 120000 transport yoq'ilg'i`\n\n"
            "Kategoriyalar: ovqat, transport, dokon, kiyim, xizmat, soglik, oila, boshqa\n\n"
            "30 kunlik statistika: /xarajat_stat",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    try:
        # Raqam parse (minglarni probel bilan yozish uchun toleransiya)
        summa_text = parts[1].replace(" ", "").replace(",", "").replace(".", "")
        summa = Decimal(summa_text)
        if summa < 0 or summa > Decimal("999999999"):
            raise ValueError("summa chegaradan tashqari")
    except (ValueError, InvalidOperation):
        await update.message.reply_text(
            "Noto'g'ri summa. Raqam kiriting. Masalan: `/xarajatim 50000 ovqat`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    kategoriya = "boshqa"
    izoh = ""
    if len(parts) >= 3:
        k_in = parts[2].lower().strip()
        kategoriya = _XARAJAT_KATEGORIYALAR.get(k_in, k_in if k_in in ("boshqa",) else "boshqa")
    if len(parts) >= 4:
        izoh = parts[3].strip()[:200]

    try:
        from shared.services.hayotim_engine import xarajat_yoz
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            xid = await xarajat_yoz(c, uid, summa, kategoriya=kategoriya, izoh=izoh)
        msg = f"💸 Xarajat yozildi (#{xid}):\n  Summa: {summa:,.0f} so'm\n  Kategoriya: {kategoriya}"
        if izoh:
            msg += f"\n  Izoh: {izoh}"
        await update.message.reply_text(msg)
    except Exception as e:
        log.error("cmd_xarajatim xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xarajat saqlashda xato.")


async def cmd_xarajat_stat(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/xarajat_stat — 30 kunlik shaxsiy xarajat statistikasi."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.hayotim_engine import xarajat_statistika
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            s = await xarajat_statistika(c, uid, kun=30)
    except Exception as e:
        log.error("cmd_xarajat_stat xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Statistika olinmadi.")
        return

    lines = [
        f"💸 *30 kunlik shaxsiy xarajat*",
        "",
        f"  Jami: *{s['jami']:,.0f}* so'm",
        f"  Kunlik ortacha: *{s['ortacha_kunlik']:,.0f}* so'm",
        "",
    ]
    if s["kategoriyalar"]:
        lines.append("📊 *Kategoriyalar:*")
        for k in s["kategoriyalar"]:
            lines.append(f"  • {k['nomi']}: {k['jami']:,.0f} so'm ({k['soni']} marta)")
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


# ════════════════════════════════════════════════════════════════════
#  /oyim — Opus 4.7 30 kunlik chuqur tahlil
# ════════════════════════════════════════════════════════════════════

async def cmd_oyim(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/oyim — Claude Opus 4.7 bilan 30-kunlik chuqur Hayotim tahlili."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    msg = await update.message.reply_text(
        "🔭 Opus 4.7 30 kunlik chuqur tahlil qilinmoqda (1M kontekst)..."
    )
    try:
        from shared.services.hayotim_engine import opus_30kun_tahlil
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            result = await opus_30kun_tahlil(c, uid)
        if not result:
            await msg.edit_text(
                "⚠️ AI xizmat vaqtincha ishlamayapti yoki ANTHROPIC_API_KEY sozlanmagan.\n"
                "Statistika uchun: /hayotim"
            )
            return
        try:
            await msg.edit_text(result, parse_mode=ParseMode.MARKDOWN)
        except Exception:
            await msg.edit_text(result)
    except Exception as e:
        log.error("cmd_oyim xato uid=%s: %s", uid, e, exc_info=True)
        try:
            await msg.edit_text("⚠️ Tahlil tayyorlashda xato. /hayotim dashboardni ishlating.")
        except Exception:
            pass
