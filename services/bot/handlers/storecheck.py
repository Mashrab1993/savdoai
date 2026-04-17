"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — STORECHECK BOT HANDLERLARI                   ║
║                                                                   ║
║  Shogird buyruqlari:                                             ║
║   /tashrif_boshla [klient_id]  — yangi tashrif boshlash          ║
║   /tashrif_tovar               — SKU tekshiruv menyusi           ║
║   /tashrif_foto                — foto yuborish rejimi            ║
║   /tashrif_yop                 — tashrifni yakunlash             ║
║                                                                   ║
║  Admin:                                                           ║
║   /tashriflar        — barcha oxirgi tashriflar ro'yxati         ║
║   /tashrif_hisobot   — 7 kunlik statistika + TOP yo'q tovarlar   ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Optional

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


# ════════════════════════════════════════════════════════════════════
#  /tashrif_boshla [klient_id] — yangi tashrif
# ════════════════════════════════════════════════════════════════════

async def cmd_tashrif_boshla(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/tashrif_boshla [klient_id] — yangi storecheck tashrif."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "🏪 *Tashrif boshlash*\n\n"
            "Format: `/tashrif_boshla [klient_id]`\n"
            "Misol: `/tashrif_boshla 15`\n\n"
            "Klient ID olish: /klientlar ro'yxatdan.",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    klient_id = int(parts[1])
    try:
        from shared.services.storecheck import (
            session_boshla, session_ochiq, template_ol, session_sku_bulk_qoshish,
        )
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            # Avval ochiq sessiya bormi?
            ochiq = await session_ochiq(c, uid)
            if ochiq:
                klient_nom = ochiq.get("klient_ismi") or "?"
                await update.message.reply_text(
                    f"⚠️ Oldingi tashrif hali ochiq (#{ochiq['id']}, klient: {klient_nom}).\n\n"
                    "Avval uni yoping: /tashrif_yop",
                )
                return
            # Klient borligini tekshirish va turi bilan olish
            klient = await c.fetchrow(
                "SELECT id, ism, narx_turi_id FROM klientlar WHERE id=$1 AND user_id=$2",
                klient_id, uid,
            )
            if not klient:
                await update.message.reply_text(f"⚠️ Klient #{klient_id} topilmadi.")
                return
            # Yangi sessiya ochish
            sid = await session_boshla(c, uid, klient_id=klient_id)
            # Template'dan SKU ro'yxat yuklash (agar bor bo'lsa)
            tmpl = await template_ol(c, uid, klient_turi_id=None)
            sku_soni = 0
            if tmpl and tmpl.get("tovar_idlari"):
                sku_soni = await session_sku_bulk_qoshish(
                    c, uid, sid, list(tmpl["tovar_idlari"])
                )
        # Sessiya ID'ni saqlash (ctx orqali keyingi buyruqlar ishlatadi)
        ctx.user_data["storecheck_session"] = sid
        msg = (
            f"✅ *Tashrif boshlandi!*\n\n"
            f"🏪 Klient: *{klient['ism']}*\n"
            f"🆔 Sessiya: #{sid}\n"
            f"📋 SKU ro'yxati: {sku_soni} ta (template'dan)\n\n"
            f"Keyingi qadamlar:\n"
            f"  /tashrif_tovar — SKU tekshiruv menyusi\n"
            f"  /tashrif_foto — javon rasmini yuborish\n"
            f"  /tashrif_yop — yakunlash"
        )
        await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_tashrif_boshla xato uid=%s: %s", uid, e, exc_info=True)
        await update.message.reply_text("⚠️ Tashrif boshlashda xato.")


# ════════════════════════════════════════════════════════════════════
#  /tashrif_tovar — SKU ro'yxat va mavjud/yo'q belgilash
# ════════════════════════════════════════════════════════════════════

async def cmd_tashrif_tovar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/tashrif_tovar — hozirgi tashrif SKU ro'yxati bilan inline tugmalar."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    sid = ctx.user_data.get("storecheck_session")
    if not sid:
        await update.message.reply_text(
            "⚠️ Hozir ochiq tashrif yo'q. Avval: `/tashrif_boshla [klient_id]`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    try:
        from shared.services.storecheck import session_sku_royxat
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            sku_list = await session_sku_royxat(c, uid, sid)
        if not sku_list:
            await update.message.reply_text(
                "📋 Bu tashrif uchun SKU ro'yxat bo'sh.\n"
                "Template yo'q — tovar qo'shing: /tashrif_sku_qosh [tovar_id]"
            )
            return
        # 10 tadan tugmalar sahifasida
        lines = [f"📋 *Tashrif #{sid} SKU ({len(sku_list)}):*\n"]
        rows = []
        for s in sku_list[:20]:
            emoji = "✅" if s["mavjud"] else "❓"
            narx = f" — {s['narx']:,.0f}" if s.get("narx") else ""
            lines.append(f"{emoji} *#{s['id']}* {s['tovar_nomi'][:35]}{narx}")
            rows.append([
                InlineKeyboardButton(f"✅ #{s['id']}", callback_data=f"sc:bor:{s['id']}"),
                InlineKeyboardButton(f"❌ #{s['id']}", callback_data=f"sc:yoq:{s['id']}"),
            ])
        if len(sku_list) > 20:
            lines.append(f"\n... yana {len(sku_list) - 20} ta")
        await update.message.reply_text(
            "\n".join(lines),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(rows),
        )
    except Exception as e:
        log.error("cmd_tashrif_tovar xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ SKU ro'yxat olishda xato.")


async def tashrif_sku_cb(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Inline tugma — SKU mavjud/yo'q belgilash."""
    q = update.callback_query
    await q.answer()
    uid = update.effective_user.id
    parts = q.data.split(":")
    if len(parts) != 3:
        return
    amal = parts[1]  # "bor" yoki "yoq"
    try:
        sku_id = int(parts[2])
    except ValueError:
        return
    try:
        from shared.services.storecheck import sku_yangila
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            ok = await sku_yangila(c, uid, sku_id, mavjud=(amal == "bor"))
        if ok:
            belgi = "✅ bor" if amal == "bor" else "❌ yo'q"
            await q.answer(f"SKU #{sku_id} → {belgi}", show_alert=False)
        else:
            await q.answer("SKU topilmadi", show_alert=True)
    except Exception as e:
        log.error("tashrif_sku_cb xato: %s", e, exc_info=True)
        await q.answer("Xato!", show_alert=True)


# ════════════════════════════════════════════════════════════════════
#  /tashrif_yop — yakunlash
# ════════════════════════════════════════════════════════════════════

async def cmd_tashrif_yop(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/tashrif_yop — hozirgi tashrifni yopish va xulosa."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    sid = ctx.user_data.get("storecheck_session")
    if not sid:
        await update.message.reply_text("⚠️ Hozir ochiq tashrif yo'q.")
        return
    text = update.message.text or ""
    parts = text.split(maxsplit=1)
    izoh = parts[1].strip()[:500] if len(parts) > 1 else ""
    try:
        from shared.services.storecheck import (
            session_yop, session_sku_royxat, session_fotolar,
        )
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            sku_list = await session_sku_royxat(c, uid, sid)
            fotolar = await session_fotolar(c, uid, sid)
            ok = await session_yop(c, uid, sid, izoh=izoh)
        ctx.user_data.pop("storecheck_session", None)
        mavjud_soni = sum(1 for s in sku_list if s["mavjud"])
        yoq_soni = sum(1 for s in sku_list if not s["mavjud"])
        belgilanmagan = len(sku_list) - mavjud_soni - yoq_soni  # (lekin FALSE default, bu 0)
        msg = (
            f"✅ *Tashrif #{sid} yakunlandi*\n\n"
            f"📋 SKU tekshirildi: {len(sku_list)}\n"
            f"  ✅ Bor: {mavjud_soni}\n"
            f"  ❌ Yo'q: {yoq_soni}\n"
            f"📸 Fotolar: {len(fotolar)}\n"
        )
        if izoh:
            msg += f"📝 Izoh: _{izoh[:100]}_\n"
        msg += "\n✅ Yangi tashrif boshlash uchun: /tashrif_boshla [klient_id]"
        await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_tashrif_yop xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Tashrif yopishda xato.")


# ════════════════════════════════════════════════════════════════════
#  /tashriflar — oxirgi 7 kun ro'yxat (admin + o'zinki)
# ════════════════════════════════════════════════════════════════════

async def cmd_tashriflar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/tashriflar — oxirgi 7 kun tashriflari."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.storecheck import sessiyalar_royxat
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            rows = await sessiyalar_royxat(c, uid, kun=7)
        if not rows:
            await update.message.reply_text("📭 Oxirgi 7 kunda tashrif yo'q.")
            return
        lines = [f"🏪 *Tashriflar (oxirgi 7 kun, {len(rows)} ta):*", ""]
        for r in rows[:20]:
            emoji = "🟢" if r["holat"] == "ochiq" else "✅"
            vaqt = r["boshlangan"].strftime("%d.%m %H:%M") if r.get("boshlangan") else ""
            klient = r.get("klient_ismi") or "?"
            bor_soni = int(r.get("sku_bor") or 0)
            sku_soni = int(r.get("sku_soni") or 0)
            lines.append(
                f"{emoji} *#{r['id']}* {vaqt} — {klient[:25]}\n"
                f"   SKU: {bor_soni}/{sku_soni} 📸 {int(r.get('foto_soni') or 0)}"
            )
        if len(rows) > 20:
            lines.append(f"\n... yana {len(rows) - 20} ta")
        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_tashriflar xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Tashriflarni olishda xato.")


# ════════════════════════════════════════════════════════════════════
#  /tashrif_hisobot — admin 7-kunlik statistika
# ════════════════════════════════════════════════════════════════════

async def cmd_tashrif_hisobot(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/tashrif_hisobot — admin uchun 7 kunlik storecheck statistikasi."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.storecheck import statistika
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            s = await statistika(c, uid, kun=7)
    except Exception as e:
        log.error("cmd_tashrif_hisobot xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Statistika olinmadi.")
        return

    lines = [
        "📊 *Storecheck hisobot — 7 kun*",
        "",
        f"🏪 Tashriflar: *{s['tashrif_soni']}*",
        f"👥 Noyob klient: {s['noyob_klient']}",
        f"👷 Ishlagan shogird: {s['ishlagan_shogird']}",
        f"⏱ Ortacha tashrif: {s['ortacha_daqiqa']:.1f} daqiqa",
        "",
        f"📋 Tekshirilgan SKU: *{s['jami_tekshirilgan_sku']}*",
        f"  ✅ Mavjud: {s['jami_mavjud_sku']}",
        f"  ❌ Yo'q: {s['jami_tekshirilgan_sku'] - s['jami_mavjud_sku']}",
        f"🎯 Ortacha facing: {s['ortacha_facing']:.1f}",
    ]
    if s["eng_yoq_tovarlar"]:
        lines.append("")
        lines.append("🔴 *Eng ko'p YO'Q bo'lgan tovarlar (TOP-10):*")
        for t in s["eng_yoq_tovarlar"]:
            lines.append(
                f"  • {t['tovar_nomi'][:35]} — {int(t['yoq_soni'])}/{int(t['tekshirilgan'])} "
                f"({float(t['yoq_foiz']):.0f}%)"
            )
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


# ════════════════════════════════════════════════════════════════════
#  Foto qabul qilish — storecheck kontekstida
# ════════════════════════════════════════════════════════════════════

async def storecheck_foto_qabul(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> bool:
    """Agar user'da ochiq storecheck sessiyasi bor va foto kelsa — saqlash.

    Returns True agar foto qabul qilingan (boshqa handler chaqirmasin).
    """
    sid = ctx.user_data.get("storecheck_session")
    if not sid:
        return False
    if not update.message or not update.message.photo:
        return False
    uid = update.effective_user.id
    try:
        file_id = update.message.photo[-1].file_id
        caption = (update.message.caption or "").strip()[:200]
        # Caption'dan turi (facing, raqobat, brak) aniqlash
        turi = "facing"
        lower = caption.lower()
        if "raqobat" in lower or "konkurent" in lower:
            turi = "raqobat"
        elif "brak" in lower or "buzuq" in lower:
            turi = "brak"
        from shared.services.storecheck import foto_qoshish
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            pid = await foto_qoshish(c, uid, sid, file_id, turi=turi, izoh=caption)
        await update.message.reply_text(
            f"📸 Foto saqlandi (#{pid}, turi: {turi})"
        )
        return True
    except Exception as e:
        log.error("storecheck_foto_qabul xato: %s", e, exc_info=True)
        return False
