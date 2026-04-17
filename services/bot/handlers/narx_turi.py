"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — NARX TURLARI BOT HANDLERS                    ║
║                                                                   ║
║   /narx_turi_qosh [nomi] [foiz_chegirma]                         ║
║   /narx_turlari                       — ro'yxat                  ║
║   /narx_turi_default                  — standart 4 turni yaratish║
║   /klient_narx [klient_id] [narx_turi_id] — biriktirish          ║
║                                                                   ║
║  Ovoz:                                                            ║
║   "Narx turi VIP qo'sh 15% chegirma"                            ║
║   "Narx turlari ko'rsat"                                         ║
║   "Karim aka VIP narxga"                                         ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import re
from decimal import Decimal, InvalidOperation

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


async def cmd_narx_turlari(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/narx_turlari — barcha narx turlari."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.narx_turlari import narx_turlari_royxat
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            rows = await narx_turlari_royxat(c, uid)
    except Exception as e:
        log.error("cmd_narx_turlari: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xato.")
        return
    if not rows:
        await update.message.reply_text(
            "📋 Narx turlari yo'q.\n\n"
            "Standart 4 tasini yaratish: /narx_turi_default\n"
            "Yoki qo'lda: `/narx_turi_qosh VIP 15`\n\n"
            "Ovoz: _\"Narx turi VIP qo'sh 15%\"_",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    lines = [f"💰 *Narx turlari ({len(rows)} ta):*", ""]
    for r in rows:
        foiz = float(r["foiz_chegirma"])
        if foiz == 0:
            foiz_str = "bazaviy"
        elif foiz < 0:
            foiz_str = f"**{foiz:+.0f}%** chegirma"
        else:
            foiz_str = f"**{foiz:+.0f}%** qo'shimcha"
        lines.append(f"• *#{r['id']}* {r['nomi']} — {foiz_str}")
    lines.extend([
        "",
        "Yangi qo'shish: `/narx_turi_qosh [nomi] [foiz]`",
        "Klientga biriktirish: `/klient_narx [klient_id] [narx_turi_id]`",
    ])
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_narx_turi_qosh(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/narx_turi_qosh [nomi] [foiz] — yangi narx turi."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=2)
    if len(parts) < 2:
        await update.message.reply_text(
            "Format: `/narx_turi_qosh [nomi] [foiz_chegirma]`\n"
            "Misol: `/narx_turi_qosh VIP -15`\n\n"
            "Foiz: manfiy = chegirma, musbat = qo'shimcha. Standart — 0.",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    nomi = parts[1].strip()
    foiz = 0.0
    if len(parts) >= 3:
        try:
            foiz_str = parts[2].replace("%", "").strip()
            foiz = float(foiz_str)
        except ValueError:
            foiz = 0.0
    try:
        from shared.services.narx_turlari import narx_turi_qoshish
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            nid = await narx_turi_qoshish(c, uid, nomi, foiz_chegirma=foiz)
        await update.message.reply_text(
            f"✅ Narx turi qo'shildi (#{nid}):\n"
            f"*{nomi}* — {foiz:+.0f}% chegirma/qo'shimcha",
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as e:
        log.error("cmd_narx_turi_qosh: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Narx turi qo'shishda xato (ehtimol shu nom allaqachon bor).")


async def cmd_narx_turi_default(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/narx_turi_default — standart 4 turni yaratish (Chakana, Optom, VIP, Diler)."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.narx_turlari import default_narx_turlari_yaratish
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            ids = await default_narx_turlari_yaratish(c, uid)
        await update.message.reply_text(
            f"✅ *Standart narx turlari tayyor*\n\n"
            f"Yaratildi yoki mavjud (ID lar):\n"
            f"  • Chakana (#{ids[0]}) — bazaviy\n"
            f"  • Optom (#{ids[1]}) — -10%\n"
            f"  • VIP (#{ids[2]}) — -15%\n"
            f"  • Diler (#{ids[3]}) — -20%\n\n"
            f"Klientga biriktirish: `/klient_narx [klient_id] [id]`\n"
            f"Ovoz: _\"Karim aka VIP narxga\"_",
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as e:
        log.error("cmd_narx_turi_default: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Yaratishda xato.")


async def cmd_klient_narx(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/klient_narx [klient_id] [narx_turi_id] — klientga narx turini biriktirish."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 3 or not parts[1].isdigit() or not parts[2].isdigit():
        await update.message.reply_text(
            "Format: `/klient_narx [klient_id] [narx_turi_id]`\n"
            "Misol: `/klient_narx 15 3` (klient #15 → VIP narx)",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    klient_id = int(parts[1])
    narx_turi_id = int(parts[2])
    try:
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            klient = await c.fetchrow(
                "SELECT id, ism FROM klientlar WHERE id=$1 AND user_id=$2",
                klient_id, uid,
            )
            if not klient:
                await update.message.reply_text(f"⚠️ Klient #{klient_id} topilmadi.")
                return
            nt = await c.fetchrow(
                "SELECT id, nomi, foiz_chegirma FROM narx_turlari WHERE id=$1 AND user_id=$2",
                narx_turi_id, uid,
            )
            if not nt:
                await update.message.reply_text(
                    f"⚠️ Narx turi #{narx_turi_id} topilmadi. /narx_turlari"
                )
                return
            await c.execute("""
                UPDATE klientlar SET narx_turi_id=$1 WHERE id=$2 AND user_id=$3
            """, narx_turi_id, klient_id, uid)
        await update.message.reply_text(
            f"✅ *{klient['ism']}* endi *{nt['nomi']}* narx turida "
            f"({float(nt['foiz_chegirma']):+.0f}%)",
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as e:
        log.error("cmd_klient_narx: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Biriktirishda xato.")


# ════════════════════════════════════════════════════════════════════
#  OVOZDAN: "Narx turi VIP qo'sh 15%" / "Karim aka VIP narxga"
# ════════════════════════════════════════════════════════════════════

async def voice_narx_turi(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                           matn: str) -> bool:
    """Narx turi ovoz intent'lari.

    Qo'shish: "Narx turi VIP qo'sh 15" / "15% chegirma VIP narx qo'sh"
    Biriktirish: "Karim aka VIP narxga" / "Karim VIP"
    """
    m = matn.lower()
    # Yangi narx turi qo'shish
    qosh_match = re.search(
        r'narx\s+turi[:\s]+([a-zA-Z\u0400-\u04ff]+)\s*(?:qo[\'\u2018\u2019]sh)?\s*(-?\d+)?\s*%?',
        m, re.IGNORECASE,
    )
    if qosh_match:
        nomi = qosh_match.group(1).strip().capitalize()
        foiz_str = qosh_match.group(2)
        foiz = float(foiz_str) if foiz_str else 0
        update.message.text = f"/narx_turi_qosh {nomi} {foiz}"
        try:
            await cmd_narx_turi_qosh(update, ctx)
            return True
        except Exception as e:
            log.warning("voice narx_turi qosh: %s", e)
    # Ro'yxat
    if _any(m, ("narx turlari", "narx turlar", "narx jadvali")):
        try:
            await cmd_narx_turlari(update, ctx)
            return True
        except Exception as e:
            log.warning("voice narx_turlari: %s", e)
    # Klientga biriktirish: "Karim aka VIP narxga" / "Karim VIP"
    kl_match = re.search(
        r'^([a-zA-Z\u0400-\u04ff\s\']+?)\s+(chakana|optom|vip|diler)(?:\s*narx)?',
        m, re.IGNORECASE,
    )
    if kl_match:
        klient_qidiruv = kl_match.group(1).strip()
        narx_nomi = kl_match.group(2).strip().capitalize()
        if len(klient_qidiruv) < 3:
            return False
        uid = update.effective_user.id
        try:
            from shared.database.pool import rls_conn
            async with rls_conn(uid) as c:
                klient = await c.fetchrow("""
                    SELECT id FROM klientlar
                    WHERE user_id=$1 AND lower(ism) LIKE '%' || lower($2) || '%'
                    LIMIT 1
                """, uid, klient_qidiruv)
                nt = await c.fetchrow("""
                    SELECT id FROM narx_turlari
                    WHERE user_id=$1 AND lower(nomi)=lower($2) LIMIT 1
                """, uid, narx_nomi)
            if not klient:
                await update.message.reply_text(f"⚠️ Klient _{klient_qidiruv}_ topilmadi.",
                                                 parse_mode=ParseMode.MARKDOWN)
                return True
            if not nt:
                await update.message.reply_text(
                    f"⚠️ Narx turi _{narx_nomi}_ topilmadi. /narx_turi_default bilan yarating.",
                    parse_mode=ParseMode.MARKDOWN,
                )
                return True
            update.message.text = f"/klient_narx {klient['id']} {nt['id']}"
            await cmd_klient_narx(update, ctx)
            return True
        except Exception as e:
            log.warning("voice klient_narx: %s", e)
    return False


def _any(matn: str, keywords: tuple) -> bool:
    return any(kw in matn for kw in keywords)
