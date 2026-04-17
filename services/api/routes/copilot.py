"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — AI BIZNES COPILOT (Opus 4.7)                     ║
║                                                                      ║
║  Foydalanuvchi biznes savolini ayti, Copilot javob beradi,          ║
║  kontekst sifatida joriy sotuv/klient/tovar ma'lumotlari ishlatiladi║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from shared.database.pool import rls_conn
from services.api.deps import get_uid
from services.cognitive.ai_extras import claude_opus

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/copilot", tags=["AI Copilot"])


class CopilotIn(BaseModel):
    savol: str = Field(..., min_length=3, max_length=1000)
    kontekst: Optional[str] = Field(None, description="Qo'shimcha kontekst (sahifa)")


@router.post("/ask")
async def copilot_ask(body: CopilotIn, uid: int = Depends(get_uid)):
    """AI Copilot — biznes savolga Opus 4.7 javob beradi.

    Joriy biznes holat avtomatik kontekstga qo'shiladi:
    - So'nggi 7 kun sotuv jami
    - Klient soni (jami / qarzdor)
    - Tovar soni (jami / kam qoldiq)
    - Shogirdlar soni
    """
    if not claude_opus.ready:
        raise HTTPException(503, "AI Copilot hozir mavjud emas (API kalit yo'q)")

    async with rls_conn(uid) as c:
        # Kontekst ma'lumotlari
        sotuv = await c.fetchrow("""
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
        qarzdor_soni = await c.fetchval("""
            SELECT COUNT(DISTINCT klient_id) FROM sotuv_sessiyalar
            WHERE user_id=$1 AND jami > tolangan
        """, uid) or 0
        tovar_soni = await c.fetchval(
            "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid,
        ) or 0
        kam_qoldiq = await c.fetchval("""
            SELECT COUNT(*) FROM tovarlar
            WHERE user_id=$1 AND qoldiq < COALESCE(min_qoldiq, 10)
        """, uid) or 0
        shogird_soni = 0
        try:
            shogird_soni = await c.fetchval(
                "SELECT COUNT(*) FROM shogirdlar WHERE admin_uid=$1 AND faol=TRUE", uid,
            ) or 0
        except Exception:
            pass

    # System prompt
    def fmt(v: float) -> str:
        return f"{v:,.0f}".replace(",", " ")

    system = f"""Sen SavdoAI biznes Copilot — Claude Opus 4.7 modelidasan.
Foydalanuvchi savdo-sotiq biznesi egasi, Uzbek tilida savol beradi.

JORIY BIZNES HOLAT:
━━━━━━━━━━━━━━━━━━━━━━━━━
📈 So'nggi 7 kun tushum: {fmt(float(sotuv['tushum']))} so'm
📦 Zayavkalar soni: {sotuv['soni']} ta
💰 Qarz qoldiq: {fmt(float(sotuv['qarz']))} so'm
👥 Jami klient: {klient_soni} ({qarzdor_soni} ta qarzdor)
🛒 Jami tovar: {tovar_soni} ({kam_qoldiq} ta kam qoldiq)
🧑‍🔧 Faol shogird: {shogird_soni} ta

JAVOB USLUBI:
• O'zbek tilida, qisqa va aniq
• Aniq raqamlar bilan javob ber (yuqoridagi ma'lumotlardan foydalan)
• Iloji bo'lsa 1-3 ta amaliy tavsiya ber
• Web sahifa havolalar: /rfm, /pnl, /reports/agent, /categories
• Emoji ishlatish — aqlli va kam
• 300 so'zdan oshirma

Agar savol biznesga aloqador bo'lmasa — "Men faqat biznes savollariga javob beraman" deb qaytar.
"""

    kontekst = body.kontekst.strip() if body.kontekst else ""
    user_msg = body.savol.strip()
    if kontekst:
        user_msg = f"[Sahifa: {kontekst}]\n\n{user_msg}"

    try:
        javob = await claude_opus.chat(
            system=system, user=user_msg, max_tokens=1500,
        )
    except Exception as e:
        log.error("Copilot chat xato: %s", e)
        raise HTTPException(502, f"AI xato: {e}")

    return {
        "javob": javob,
        "kontekst_stat": {
            "tushum_7kun": float(sotuv["tushum"]),
            "zayavkalar": int(sotuv["soni"]),
            "qarz": float(sotuv["qarz"]),
            "klient_soni": int(klient_soni),
            "qarzdor": int(qarzdor_soni),
            "tovar_soni": int(tovar_soni),
            "kam_qoldiq": int(kam_qoldiq),
            "shogird_soni": int(shogird_soni),
        },
    }
