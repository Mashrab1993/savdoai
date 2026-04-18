"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — QAYTARISH BOT HANDLERS                       ║
║                                                                   ║
║  /qaytarish [klient_id] [tovar] [miqdor] [sabab]                 ║
║  /qaytarishlar       — ro'yxat                                    ║
║  /qaytarish_tasdiq [id]  — admin tasdiqlash                      ║
║  /qaytarish_stat     — 30 kun statistika                          ║
║                                                                   ║
║  Ovoz:                                                            ║
║   "Karim aka 5 ta Ariel qaytardi muddati o'tgan"                 ║
║   "Akmal do'kon 3 ta Persil almashtir"                           ║
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


async def cmd_qaytarishlar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/qaytarishlar — oxirgi 30 kun qaytarishlar."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.qaytarish_svc import qaytarishlar_royxat
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            rows = await qaytarishlar_royxat(c, uid, kun=30, limit=30)
    except Exception as e:
        log.error("cmd_qaytarishlar: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xato.")
        return
    if not rows:
        await update.message.reply_text(
            "📭 Oxirgi 30 kunda qaytarish yo'q.\n\n"
            "Yangi qaytarish ovozda: _\"Karim aka 5 ta Ariel qaytardi brak\"_",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    holat_emoji = {
        "yangi": "⏳", "tasdiqlandi": "✅",
        "qaytarildi": "🔄", "bekor": "❌",
    }
    sabab_emoji = {
        "brak": "🔴", "muddati": "⏰", "sifatsiz": "⚠️",
        "kelishuv": "🤝", "boshqa": "📦",
    }
    lines = [f"🔄 *Qaytarishlar ({len(rows)} ta)*", ""]
    for r in rows:
        h_em = holat_emoji.get(r["holat"], "⏳")
        s_em = sabab_emoji.get(r["sabab"], "📦")
        klient = f" [{r['klient_ismi']}]" if r.get("klient_ismi") else ""
        vaqt = r["yaratilgan"].strftime("%d.%m") if r.get("yaratilgan") else ""
        turi = "🔄" if r["turi"] == "almashtirish" else "↩️"
        lines.append(
            f"{h_em} {turi} *#{r['id']}*{klient} [{vaqt}]\n"
            f"  {s_em} {r['tovar_nomi']} — {r['miqdor']} ({r['sabab']})\n"
            f"  💰 {r['summa']:,.0f}"
        )
    lines.append("\nTasdiq: `/qaytarish_tasdiq [id]`")
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_qaytarish_tasdiq(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/qaytarish_tasdiq [id] — admin tasdiqlaydi, stock yangilanadi."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "Format: `/qaytarish_tasdiq [id]`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    qid = int(parts[1])
    try:
        from shared.services.qaytarish_svc import qaytarish_tasdiq
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            ok = await qaytarish_tasdiq(c, uid, qid)
        if ok:
            await update.message.reply_text(
                f"✅ Qaytarish #{qid} tasdiqlandi va stock yangilandi."
            )
        else:
            await update.message.reply_text(
                f"⚠️ #{qid} topilmadi yoki allaqachon qayta ishlangan."
            )
    except Exception as e:
        log.error("cmd_qaytarish_tasdiq: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Tasdiqlashda xato.")


async def cmd_qaytarish_stat(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/qaytarish_stat — 30 kunlik statistika."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.qaytarish_svc import qaytarish_statistika
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            s = await qaytarish_statistika(c, uid, kun=30)
    except Exception as e:
        log.error("cmd_qaytarish_stat: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xato.")
        return
    if s["jami"] == 0:
        await update.message.reply_text("📭 30 kunda qaytarish yo'q.")
        return
    sabab_emoji = {"brak": "🔴", "muddati": "⏰", "sifatsiz": "⚠️",
                    "kelishuv": "🤝", "boshqa": "📦"}
    lines = [
        "📊 *Qaytarish statistika — 30 kun*",
        "",
        f"🔄 Jami: *{s['jami']}* ta",
        f"  ✅ Tasdiqlandi: {s['tasdiqlangan']}",
        f"  ⏳ Kutilayotgan: {s['kutilayotgan']}",
        f"  💰 Tasdiqlangan jami: *{s['jami_summa']:,.0f}* so'm",
        "",
        "*Sabablar:*",
    ]
    for sb in s["sabablar"]:
        em = sabab_emoji.get(sb["sabab"], "📦")
        lines.append(f"  {em} {sb['sabab']}: {int(sb['soni'])} ta ({float(sb['jami_summa']):,.0f})")
    if s["top_tovarlar"]:
        lines.append("")
        lines.append("🔴 *Eng ko'p qaytgan tovarlar:*")
        for t in s["top_tovarlar"][:5]:
            lines.append(f"  • {t['tovar_nomi']} — {int(t['soni'])} marta")
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


# ════════════════════════════════════════════════════════════════════
#  OVOZDAN QAYTARISH — fuzzy klient + tovar + sabab
# ════════════════════════════════════════════════════════════════════

_SABAB_KEYWORDS = {
    "brak":     ("brak", "buzuq", "siniq", "shikastlangan"),
    "muddati":  ("muddat", "o'tgan", "eskirgan", "yaroqsiz"),
    "sifatsiz": ("sifat", "yaxshi emas", "sifatsiz"),
    "kelishuv": ("kelishuv", "kelishgan", "ortiqcha"),
}


def _sabab_aniqla(matn: str) -> str:
    m = matn.lower()
    for sabab, kws in _SABAB_KEYWORDS.items():
        if any(kw in m for kw in kws):
            return sabab
    return "boshqa"


async def voice_qaytarish(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                           matn: str) -> bool:
    """Ovozdan qaytarish yozish. Keyword: "qaytardi" / "qaytargan".

    Format: "Karim aka 5 ta Ariel qaytardi brak"
            [klient] [miqdor] ta [tovar] qaytardi [sabab]
    """
    m = matn.lower()
    if not any(kw in m for kw in ("qaytardi", "qaytargan", "qaytarmoqchi", "qaytaray", "qaytarib ber")):
        return False
    # Raqam (miqdor) ajratish
    miqdor_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:ta|dona|kg|kilo|litr)?', m)
    if not miqdor_match:
        return False
    try:
        miqdor = Decimal(miqdor_match.group(1))
    except InvalidOperation:
        return False

    # Tovar nomi — "qaytardi" kelmasdan oldingi so'zdan oldingi 2-3 so'z
    # Oddiy yondashuv: so'zlarni split qilib, raqamdan keyingi 1-3 so'z
    words = matn.split()
    tovar_nomi = ""
    klient_qidiruv = ""
    try:
        # Raqam indeksini topish
        raqam_idx = next(
            (i for i, w in enumerate(words) if re.match(r'\d', w)),
            None,
        )
        if raqam_idx is not None:
            # Raqamdan keyingi so'zlar — tovar nomi (3 tagacha)
            after = words[raqam_idx + 1 : raqam_idx + 5]
            # "ta", "dona" kabi so'zlarni o'tkazish
            skip = {"ta", "dona", "kg", "kilo", "litr", "bir", "qaytardi",
                    "qaytargan", "qaytarmoqchi", "qaytarib", "ber"}
            parts = [w for w in after if w.lower() not in skip][:3]
            tovar_nomi = " ".join(parts).strip(".,! ")
            # Raqam'dan oldingi so'zlar — klient nomi
            before = words[:raqam_idx]
            klient_qidiruv = " ".join(before).strip(".,! ")
    except Exception:
        pass

    if not tovar_nomi or not klient_qidiruv:
        await update.message.reply_text(
            "🔄 Qaytarish ma'lumoti to'liq emas.\n"
            "Misol: _\"Karim aka 5 ta Ariel qaytardi brak\"_",
            parse_mode=ParseMode.MARKDOWN,
        )
        return True

    sabab = _sabab_aniqla(matn)
    uid = update.effective_user.id

    try:
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            # Klient fuzzy
            klient = await c.fetchrow("""
                SELECT id, ism FROM klientlar
                WHERE user_id=$1 AND lower(ism) LIKE '%' || lower($2) || '%'
                ORDER BY jami_sotib DESC LIMIT 1
            """, uid, klient_qidiruv)
            # Tovar fuzzy
            tovar = await c.fetchrow("""
                SELECT id, nomi, sotish_narxi FROM tovarlar
                WHERE user_id=$1 AND lower(nomi) LIKE '%' || lower($2) || '%'
                ORDER BY id DESC LIMIT 1
            """, uid, tovar_nomi)
            from shared.services.qaytarish_svc import qaytarish_yarat
            summa = (Decimal(str(tovar["sotish_narxi"])) * miqdor) if tovar else Decimal(0)
            qid = await qaytarish_yarat(
                c, uid,
                klient_id=klient["id"] if klient else None,
                tovar_id=tovar["id"] if tovar else None,
                tovar_nomi=tovar["nomi"] if tovar else tovar_nomi,
                miqdor=miqdor, sabab=sabab, summa=summa,
                izoh=matn[:300],
            )
        emoji = {"brak": "🔴", "muddati": "⏰", "sifatsiz": "⚠️",
                  "kelishuv": "🤝", "boshqa": "📦"}.get(sabab, "📦")
        await update.message.reply_text(
            f"🔄 *Qaytarish yaratildi #{qid}*\n\n"
            f"👤 Klient: *{klient['ism'] if klient else '?'}*\n"
            f"📦 Tovar: *{tovar['nomi'] if tovar else tovar_nomi}*\n"
            f"🔢 Miqdor: *{miqdor}*\n"
            f"{emoji} Sabab: *{sabab}*\n"
            f"💰 Summa: *{summa:,.0f}* so'm\n\n"
            f"Tasdiqlash: `/qaytarish_tasdiq {qid}`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return True
    except Exception as e:
        log.error("voice_qaytarish xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Qaytarish saqlashda xato.")
        return True
