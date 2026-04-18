"""
Voice handlerlari: ekspeditor, sklad, agent hisobot, PnL.

SalesDoc kabi keng qamrovli ovoz-first tizim uchun yangi intentlar.
"""
from __future__ import annotations

import logging
import re
from typing import Optional

from telegram import Update
from telegram.ext import ContextTypes
from shared.database.pool import rls_conn

log = logging.getLogger(__name__)


def _extract_phone(m: str) -> str | None:
    """+998 90 123 45 67 yoki 99890... kabi raqamlarni topish."""
    mt = re.search(r'(?:\+?998)?\s*\(?(\d{2})\)?\s*(\d{3})[\s-]*(\d{2})[\s-]*(\d{2})', m)
    if mt:
        return f"+998 {mt.group(1)} {mt.group(2)} {mt.group(3)} {mt.group(4)}"
    return None


async def voice_ekspeditor(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                           matn: str) -> bool:
    """'yangi ekspeditor Karim aka +99890...' intent."""
    m = matn.strip().lower()
    if not (("yangi ekspeditor" in m or "ekspeditor qo'sh" in m or "ekspeditor qosh" in m)):
        return False

    # Ismni olish — ekspeditor so'zidan keyin
    ism_match = re.search(
        r'ekspeditor\s+(.+?)(?:\s+(?:qo\'?shish|qoshish|qo\'?sh|\+|998|\+998|telefon|raqam)|\s*$)',
        m, re.IGNORECASE,
    )
    ism = ism_match.group(1).strip() if ism_match else ""
    telefon = _extract_phone(matn)

    if not ism or len(ism) < 2:
        await update.message.reply_text(
            "🤔 Ekspeditor ismini tushunmadim.\n\nMisol: <b>Yangi ekspeditor Karim aka +998901234567</b>",
            parse_mode="HTML",
        )
        return True

    uid = update.effective_user.id
    try:
        async with rls_conn(uid) as c:
            row = await c.fetchrow("""
                INSERT INTO ekspeditorlar (user_id, ism, telefon, faol)
                VALUES ($1, $2, $3, TRUE)
                RETURNING id, ism
            """, uid, ism.title(), telefon)
        text = f"🚚 <b>Ekspeditor qo'shildi</b>\n\n"
        text += f"📝 Ism: <b>{row['ism']}</b>\n"
        if telefon:
            text += f"📞 Telefon: {telefon}\n"
        text += f"\n<i>Web: /ekspeditorlar sahifasida ko'rish mumkin.</i>"
        await update.message.reply_text(text, parse_mode="HTML")
        return True
    except Exception as e:
        log.error("voice_ekspeditor xato: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")
        return True


async def voice_sklad(update: Update, ctx: ContextTypes.DEFAULT_TYPE, matn: str) -> bool:
    """'sklad Asosiy qo'shish', 'yangi sklad aksiya'."""
    m = matn.strip().lower()
    if not (("yangi sklad" in m or "sklad qo'sh" in m or "sklad qosh" in m)):
        return False

    nomi_match = re.search(
        r'sklad\s+(.+?)(?:\s+(?:qo\'?shish|qoshish|qo\'?sh)|\s*$)',
        m, re.IGNORECASE,
    )
    nomi = nomi_match.group(1).strip() if nomi_match else ""
    if not nomi or len(nomi) < 2:
        await update.message.reply_text(
            "🤔 Sklad nomini tushunmadim.\n\nMisol: <b>Yangi sklad Asosiy qo'shish</b>",
            parse_mode="HTML",
        )
        return True

    # Turi aniqlash
    turi = "asosiy"
    if "brak" in m or "sifatsiz" in m:
        turi = "brak"
    elif "aksiya" in m:
        turi = "aksiya"
    elif "qaytarish" in m:
        turi = "qaytarish"

    uid = update.effective_user.id
    try:
        async with rls_conn(uid) as c:
            row = await c.fetchrow("""
                INSERT INTO skladlar (user_id, nomi, turi, faol)
                VALUES ($1, $2, $3, TRUE) RETURNING id, nomi, turi
            """, uid, nomi.title(), turi)
        emoji = {"asosiy": "🏪", "brak": "⚠️", "aksiya": "🎁", "qaytarish": "🔄"}.get(turi, "📦")
        await update.message.reply_text(
            f"{emoji} <b>Sklad qo'shildi</b>\n\n"
            f"📝 Nomi: <b>{row['nomi']}</b>\n"
            f"🏷️ Turi: {turi}\n\n"
            f"<i>Web: /skladlar sahifasida ko'rish mumkin.</i>",
            parse_mode="HTML",
        )
        return True
    except Exception as e:
        log.error("voice_sklad xato: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")
        return True


async def voice_agent_hisobot(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                               matn: str) -> bool:
    """'Agent hisoboti', 'Agentlar hisobot', 'Kim qancha sotdi'."""
    m = matn.strip().lower()
    if not any(kw in m for kw in (
        "agent hisobot", "agentlar hisobot", "agent stat", "agent reyting",
        "kim qancha sotdi", "qaysi agent yaxshi",
    )):
        return False

    uid = update.effective_user.id
    try:
        async with rls_conn(uid) as c:
            jami = await c.fetchrow("""
                SELECT COALESCE(SUM(jami), 0) AS jami,
                       COALESCE(SUM(tolangan), 0) AS tolangan,
                       COUNT(*) AS soni,
                       COUNT(DISTINCT klient_id) AS akb
                FROM sotuv_sessiyalar
                WHERE user_id=$1 AND sana >= NOW() - interval '30 days'
                  AND COALESCE(holat, 'yangi') != 'bekor'
            """, uid)

            agentlar = await c.fetch("""
                SELECT s.ism, COALESCE(SUM(ss.jami), 0) AS summa,
                       COUNT(ss.id) AS soni
                FROM shogirdlar s
                LEFT JOIN sotuv_sessiyalar ss
                  ON ss.shogird_id = s.id
                  AND ss.sana >= NOW() - interval '30 days'
                  AND COALESCE(ss.holat, 'yangi') != 'bekor'
                WHERE s.admin_uid = $1 AND s.faol = TRUE
                GROUP BY s.id, s.ism
                ORDER BY SUM(ss.jami) DESC NULLS LAST
                LIMIT 10
            """, uid)

        def format_currency(v: float) -> str:
            return f"{v:,.0f} so'm".replace(",", " ")
        text = "📊 <b>AGENT HISOBOTI</b> — Oxirgi 30 kun\n━━━━━━━━━━━━━━━━━━━━\n\n"
        text += f"💰 Jami sotuv: <b>{format_currency(float(jami['jami']))}</b>\n"
        text += f"💸 To'langan: {format_currency(float(jami['tolangan']))}\n"
        text += f"📦 Zayavkalar: {jami['soni']} ta\n"
        text += f"👥 AKB: {jami['akb']} mijoz\n\n"

        if agentlar:
            text += "🏆 <b>Top agentlar:</b>\n"
            for i, a in enumerate(agentlar, 1):
                summa = float(a["summa"] or 0)
                text += f"{i}. {a['ism']}: {format_currency(summa)} ({a['soni']} ta)\n"
        else:
            text += "<i>Shogirdlar yo'q yoki sotuv yo'q.</i>\n"

        text += f"\n<i>To'liq: /reports/agent web sahifasida</i>"
        await update.message.reply_text(text, parse_mode="HTML")
        return True
    except Exception as e:
        log.error("voice_agent_hisobot xato: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")
        return True


async def voice_pnl(update: Update, ctx: ContextTypes.DEFAULT_TYPE, matn: str) -> bool:
    """'PnL', 'foyda hisobot', 'foyda zarar'."""
    m = matn.strip().lower()
    if not any(kw in m for kw in (
        "pnl", "p n l", "foyda hisobot", "foyda zarar",
        "sof foyda", "yalpi foyda", "moliyaviy holat",
    )):
        return False

    uid = update.effective_user.id
    try:
        async with rls_conn(uid) as c:
            row = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(ss.jami), 0) AS tushum,
                    COALESCE(SUM(
                        (SELECT SUM(ch.miqdor * ch.olish_narxi)
                         FROM chiqimlar ch WHERE ch.sessiya_id = ss.id)
                    ), 0) AS tannarx
                FROM sotuv_sessiyalar ss
                WHERE user_id = $1 AND sana >= NOW() - interval '30 days'
                  AND COALESCE(holat, 'yangi') != 'bekor'
            """, uid)
            xarajat = await c.fetchval("""
                SELECT COALESCE(SUM(summa), 0) FROM xarajatlar
                WHERE user_id = $1 AND sana >= NOW() - interval '30 days'
                  AND COALESCE(bekor_qilingan, FALSE) = FALSE
            """, uid) or 0

        tushum = float(row["tushum"])
        tannarx = float(row["tannarx"])
        yalpi = tushum - tannarx
        sof = yalpi - float(xarajat)

        def format_currency(v: float) -> str:
            return f"{v:,.0f} so'm".replace(",", " ")
        marja_yalpi = (yalpi / tushum * 100) if tushum > 0 else 0
        marja_sof = (sof / tushum * 100) if tushum > 0 else 0

        text = "💹 <b>FOYDA-ZARAR (PnL)</b> — Oxirgi 30 kun\n━━━━━━━━━━━━━━━━━━━━\n\n"
        text += f"📈 Tushum:     <b>{format_currency(tushum)}</b>\n"
        text += f"📉 Tannarx:    {format_currency(tannarx)}\n"
        text += f"💰 Yalpi foyda: <b>{format_currency(yalpi)}</b> ({marja_yalpi:.1f}%)\n"
        text += f"💸 Xarajat:    {format_currency(xarajat)}\n"
        text += f"✨ Sof foyda:  <b>{format_currency(sof)}</b> ({marja_sof:.1f}%)\n\n"
        text += "<i>To'liq: /pnl web sahifasida (grafiklar + kategoriyalar)</i>"
        await update.message.reply_text(text, parse_mode="HTML")
        return True
    except Exception as e:
        log.error("voice_pnl xato: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")
        return True
