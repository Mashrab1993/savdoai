"""
Voice handlerlari: AI Copilot + Anomaliya detektori.

Foydalanuvchi: "Copilot: bu hafta sotuvim qanday?" deb ayti,
SavdoAI Opus 4.7 bilan javob beradi.
"""
from __future__ import annotations

import logging
import re
from datetime import date, timedelta

from telegram import Update
from telegram.ext import ContextTypes
from shared.database.pool import rls_conn

log = logging.getLogger(__name__)


async def voice_copilot(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                        matn: str) -> bool:
    """'copilot: ...' yoki 'AI: ...' — biznes savolni Opus 4.7 ga yuboradi."""
    m = matn.strip()
    m.lower()

    # Prefix: "copilot:" yoki "ai:" yoki "copilot ..." bilan boshlansa
    mt = re.match(r'^(?:copilot|ai|aida|AI)\s*[:,.]?\s*(.+)', m, re.IGNORECASE)
    if not mt:
        return False

    savol = mt.group(1).strip()
    if not savol or len(savol) < 5:
        await update.message.reply_text(
            "🤖 Copilot savolini tushunmadim.\n\n"
            "Misol: <b>Copilot: bu hafta sotuvim qanday?</b>\n"
            "Misol: <b>AI: qaysi klient muammoli?</b>",
            parse_mode="HTML",
        )
        return True

    uid = update.effective_user.id
    try:
        from services.cognitive.ai_extras import claude_opus
        if not claude_opus.ready:
            await update.message.reply_text("⚠️ AI Copilot hozir mavjud emas (API kaliti yo'q)")
            return True

        # Biznes kontekst
        async with rls_conn(uid) as c:
            row = await c.fetchrow("""
                SELECT COALESCE(SUM(jami), 0) AS tushum,
                       COUNT(*) AS soni,
                       COALESCE(SUM(jami - tolangan) FILTER (WHERE jami > tolangan), 0) AS qarz
                FROM sotuv_sessiyalar
                WHERE user_id=$1 AND sana >= NOW() - interval '7 days'
                  AND COALESCE(holat,'yangi') != 'bekor'
            """, uid)
            klient_soni = await c.fetchval(
                "SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid,
            ) or 0

        def fmt(v: float) -> str:
            return f"{v:,.0f}".replace(",", " ")

        system = f"""Sen SavdoAI biznes Copilot (Claude Opus 4.7).
O'zbek tilida, 150 so'zdan oshirma, aniq raqamlar bilan.

JORIY HOLAT (7 kun):
• Tushum: {fmt(float(row['tushum']))} so'm
• Zayavka: {row['soni']} ta
• Qarz: {fmt(float(row['qarz']))} so'm
• Klient: {klient_soni} ta
"""

        # Tezkor "thinking" xabar
        thinking = await update.message.reply_text("🧠 Opus 4.7 o'ylamoqda...")

        javob = await claude_opus.chat(system=system, user=savol, max_tokens=600)

        # Thinking xabarni o'chirib, javob yuborish
        try:
            await thinking.delete()
        except Exception:
            pass

        text = f"🧠 <b>AI Copilot javobi:</b>\n\n{javob}\n\n"
        text += f"<i>📊 7 kun tushum: {fmt(float(row['tushum']))} | {row['soni']} zayavka</i>\n"
        text += "<i>🌐 Web: /copilot sahifada to'liq chat</i>"
        await update.message.reply_text(text[:4000], parse_mode="HTML")
        return True
    except Exception as e:
        log.error("voice_copilot xato: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Copilot xato: {str(e)[:150]}")
        return True


async def voice_biznes_salomatlik(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                                    matn: str) -> bool:
    """'biznes salomatligi' / 'biznes ball' / 'biznesim qanday'."""
    m = matn.strip().lower()
    if not any(kw in m for kw in (
        "biznes salomatlig", "biznes ball", "biznesim qanday",
        "biznes holat", "health score", "biznesim sog",
    )):
        return False

    uid = update.effective_user.id
    try:
        # Tushum (7+7 kun), qarz, klient, anomaliya
        from datetime import date, timedelta
        today_ = date.today()
        week_ago = today_ - timedelta(days=7)
        two_weeks_ago = today_ - timedelta(days=14)
        month_ago = today_ - timedelta(days=30)

        async with rls_conn(uid) as c:
            sotuv_shu = float(await c.fetchval("""
                SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar
                WHERE user_id=$1 AND sana::date >= $2 AND sana::date < $3
                  AND COALESCE(holat, 'yangi') != 'bekor'
            """, uid, week_ago, today_) or 0)
            sotuv_otgan = float(await c.fetchval("""
                SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar
                WHERE user_id=$1 AND sana::date >= $2 AND sana::date < $3
                  AND COALESCE(holat, 'yangi') != 'bekor'
            """, uid, two_weeks_ago, week_ago) or 0)
            jami_qarz = float(await c.fetchval("""
                SELECT COALESCE(SUM(jami - tolangan), 0) FROM sotuv_sessiyalar
                WHERE user_id=$1 AND jami > tolangan
                  AND COALESCE(holat, 'yangi') != 'bekor'
            """, uid) or 0)
            jami_oborot = float(await c.fetchval("""
                SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar
                WHERE user_id=$1 AND sana::date >= $2
                  AND COALESCE(holat, 'yangi') != 'bekor'
            """, uid, month_ago) or 1)

        # Quick score
        if sotuv_otgan > 0:
            o_sish_foiz = (sotuv_shu - sotuv_otgan) / sotuv_otgan * 100
        else:
            o_sish_foiz = 0

        qarz_foiz = (jami_qarz / jami_oborot * 100) if jami_oborot > 0 else 0

        # Sodda ball taxmini
        sotuv_ball = min(30, max(0, 15 + o_sish_foiz * 0.5))
        qarz_ball = 20 if qarz_foiz < 10 else 15 if qarz_foiz < 20 else 10 if qarz_foiz < 40 else 5
        ball = int(sotuv_ball + qarz_ball + 30)  # +30 for other components default

        if ball >= 85:
            emoji, daraja = "🏆", "A+ — A'lo"
        elif ball >= 70:
            emoji, daraja = "🟢", "A — Yaxshi"
        elif ball >= 55:
            emoji, daraja = "🟡", "B — O'rtacha"
        elif ball >= 40:
            emoji, daraja = "🟠", "C — Ehtiyot bo'ling"
        else:
            emoji, daraja = "🔴", "D — Kritik"

        def fmt(v: float) -> str:
            return f"{v:,.0f}".replace(",", " ")

        text = f"{emoji} <b>BIZNES SALOMATLIGI</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n"
        text += f"<b>{ball}/100 ball</b> — {daraja}\n\n"
        text += f"📈 Sotuv o'sishi: {o_sish_foiz:+.1f}% (shu hafta vs o'tgan)\n"
        text += f"📊 Qarz nisbati: {qarz_foiz:.1f}% (oborotdan)\n"
        text += f"💰 Shu hafta: {fmt(sotuv_shu)} so'm\n"
        text += f"💰 O'tgan hafta: {fmt(sotuv_otgan)} so'm\n"
        text += f"⚠️ Jami qarz: {fmt(jami_qarz)} so'm\n\n"
        text += "<i>🌐 To'liq: web /biznes-salomatlik sahifasida</i>"
        await update.message.reply_text(text, parse_mode="HTML")
        return True
    except Exception as e:
        log.error("voice_biznes_salomatlik xato: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {str(e)[:150]}")
        return True


async def voice_anomaliya(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                           matn: str) -> bool:
    """'anomaliya' / 'g'ayrioddiy' / 'xavf'."""
    m = matn.strip().lower()
    if not any(kw in m for kw in (
        "anomaliya", "g'ayrioddiy", "gayrioddiy", "noanormal", "xavf",
        "zarar", "zararli sotuv", "nima xavfli",
    )):
        return False

    uid = update.effective_user.id
    try:
        from services.cognitive.ai_extras import claude_opus
        kunlar = 7

        sana_dan = date.today() - timedelta(days=kunlar)
        anom_text: list[str] = []

        async with rls_conn(uid) as c:
            # Zararli sotuvlar
            rows = await c.fetch("""
                SELECT ss.document_number, ss.klient_ismi, ss.jami,
                       (SELECT SUM(ch.miqdor * t.olish_narxi)
                        FROM chiqimlar ch LEFT JOIN tovarlar t ON t.id = ch.tovar_id
                        WHERE ch.sessiya_id = ss.id) AS tannarx
                FROM sotuv_sessiyalar ss
                WHERE ss.user_id=$1 AND ss.sana >= $2
                  AND COALESCE(ss.holat, 'yangi') != 'bekor'
                  AND ss.jami > 0
                LIMIT 50
            """, uid, sana_dan)
            for r in rows:
                jami = float(r["jami"] or 0)
                tan = float(r["tannarx"] or 0)
                if tan > 0 and jami < tan:
                    anom_text.append(
                        f"🔴 {r['document_number'] or '?'} ({r['klient_ismi'] or '?'}): "
                        f"zarar {(tan-jami)/1000:.0f}K"
                    )

            # Katta qarz
            rows2 = await c.fetch("""
                SELECT document_number, klient_ismi, jami - tolangan AS qarz
                FROM sotuv_sessiyalar
                WHERE user_id=$1 AND sana >= $2
                  AND COALESCE(holat, 'yangi') != 'bekor'
                  AND jami - tolangan > 5000000
                LIMIT 10
            """, uid, sana_dan)
            for r in rows2:
                q = float(r["qarz"] or 0)
                anom_text.append(
                    f"🟡 {r['document_number'] or '?'} ({r['klient_ismi'] or '?'}): "
                    f"qarz {q/1_000_000:.1f}M"
                )

        jami = len(anom_text)
        if jami == 0:
            await update.message.reply_text(
                "🛡️ <b>Anomaliya topilmadi — biznes normal!</b>\n\n"
                f"Oxirgi {kunlar} kun ichida g'ayrioddiy hodisa yo'q. "
                "Zararli sotuv va katta qarz yo'q. Davom eting.",
                parse_mode="HTML",
            )
            return True

        text = f"🛡️ <b>ANOMALIYA DETEKTORI</b> — Oxirgi {kunlar} kun\n━━━━━━━━━━━━━━━━━━━━━\n\n"
        text += f"⚠️ Jami <b>{jami}</b> ta anomaliya topildi:\n\n"
        text += "\n".join(anom_text[:15])
        if jami > 15:
            text += f"\n\n... va yana {jami - 15} ta"

        # AI xulosa
        if claude_opus.ready and jami > 0:
            try:
                system = "Sen SavdoAI anomaliya analitik. O'zbek tilida, 80 so'zdan kam."
                user_msg = f"{jami} ta anomaliya topildi:\n" + "\n".join(anom_text[:10]) + \
                    "\n\nQisqa xulosa va 1-2 aniq tavsiya ber."
                xulosa = await claude_opus.chat(system=system, user=user_msg, max_tokens=400)
                text += f"\n\n<b>🧠 Opus 4.7 tavsiya:</b>\n{xulosa}"
            except Exception as e:
                log.warning("Opus anomaliya xulosasi: %s", e)

        text += "\n\n<i>🌐 Web: /anomaliya sahifasida to'liq</i>"
        await update.message.reply_text(text[:4000], parse_mode="HTML")
        return True
    except Exception as e:
        log.error("voice_anomaliya xato: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Anomaliya xato: {str(e)[:150]}")
        return True
