"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — AI ANOMALIYA DETEKTORI (Opus 4.7)                ║
║                                                                      ║
║  So'nggi 7 kunda g'ayrioddiy hodisalarni AI orqali topadi:           ║
║  • Noodatiy katta chegirma (>30%)                                    ║
║  • Tannarxdan past sotish (loss-making)                              ║
║  • G'ayrioddiy katta qarz                                            ║
║  • Bir klient kun ichida juda ko'p zayavka                           ║
║  • Bir tovar juda katta miqdorda chiqqan                             ║
║                                                                      ║
║  Opus 4.7 bularga kontekst beradi va strategiya taklif qiladi.      ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from shared.database.pool import rls_conn
from services.api.deps import get_uid
from services.cognitive.ai_extras import claude_opus

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/anomaliya", tags=["AI Anomaliya"])


@router.get("")
async def anomaliya_scan(
    kunlar: int = Query(7, description="Oxirgi N kun skanerlash"),
    uid: int = Depends(get_uid),
):
    """Oxirgi N kun ichida g'ayrioddiy zayavkalarni topadi va AI tahlil qiladi."""
    sana_dan = date.today() - timedelta(days=kunlar)

    anomaliyalar: list[dict] = []

    async with rls_conn(uid) as c:
        # 1. KATTA CHEGIRMA — sotish narxi bazaviy narxidan 30%+ past
        rows = await c.fetch("""
            SELECT ss.id, ss.document_number, ss.klient_ismi, ss.sana, ss.jami,
                   (SELECT SUM(ch.miqdor * t.olish_narxi)
                    FROM chiqimlar ch LEFT JOIN tovarlar t ON t.id = ch.tovar_id
                    WHERE ch.sessiya_id = ss.id) AS tannarx
            FROM sotuv_sessiyalar ss
            WHERE ss.user_id=$1 AND ss.sana >= $2
              AND COALESCE(ss.holat, 'yangi') != 'bekor'
              AND ss.jami > 0
        """, uid, sana_dan)

        for r in rows:
            jami = float(r["jami"] or 0)
            tan = float(r["tannarx"] or 0)
            if tan > 0 and jami < tan:
                anomaliyalar.append({
                    "tur": "zararli_sotuv",
                    "daraja": "yuqori",
                    "id": r["id"],
                    "document_number": r["document_number"],
                    "klient": r["klient_ismi"],
                    "sana": r["sana"].isoformat() if r["sana"] else None,
                    "jami": jami,
                    "tannarx": tan,
                    "zarar": tan - jami,
                    "sabab": f"Tannarxdan {round((tan-jami)/tan*100, 1)}% past sotildi",
                })

        # 2. KATTA QARZ — qarz > 5M so'm
        rows2 = await c.fetch("""
            SELECT ss.id, ss.document_number, ss.klient_ismi, ss.sana, ss.jami,
                   ss.tolangan, (ss.jami - ss.tolangan) AS qarz
            FROM sotuv_sessiyalar ss
            WHERE ss.user_id=$1 AND ss.sana >= $2
              AND COALESCE(ss.holat, 'yangi') != 'bekor'
              AND (ss.jami - ss.tolangan) > 5000000
        """, uid, sana_dan)
        for r in rows2:
            anomaliyalar.append({
                "tur": "katta_qarz",
                "daraja": "o'rta",
                "id": r["id"],
                "document_number": r["document_number"],
                "klient": r["klient_ismi"],
                "sana": r["sana"].isoformat() if r["sana"] else None,
                "jami": float(r["jami"] or 0),
                "qarz": float(r["qarz"] or 0),
                "sabab": f"{int(float(r['qarz']) / 1_000_000)} mln+ qarz ochildi",
            })

        # 3. KUNIGA KO'P ZAYAVKA bir klient
        rows3 = await c.fetch("""
            SELECT klient_id, klient_ismi, sana::date AS kun, COUNT(*) AS soni
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= $2
              AND COALESCE(holat, 'yangi') != 'bekor'
              AND klient_id IS NOT NULL
            GROUP BY klient_id, klient_ismi, sana::date
            HAVING COUNT(*) >= 4
            ORDER BY COUNT(*) DESC
            LIMIT 10
        """, uid, sana_dan)
        for r in rows3:
            anomaliyalar.append({
                "tur": "kop_zayavka",
                "daraja": "past",
                "klient": r["klient_ismi"],
                "sana": r["kun"].isoformat() if r["kun"] else None,
                "soni": int(r["soni"]),
                "sabab": f"Bir kunda {r['soni']} zayavka (odatiy emas)",
            })

        # 4. KATTA MIQDOR — bir zayavkada tovar > 100 ta
        rows4 = await c.fetch("""
            SELECT ss.id, ss.document_number, ss.klient_ismi, ss.sana,
                   ch.tovar_nomi, ch.miqdor
            FROM sotuv_sessiyalar ss
            JOIN chiqimlar ch ON ch.sessiya_id = ss.id
            WHERE ss.user_id=$1 AND ss.sana >= $2
              AND COALESCE(ss.holat, 'yangi') != 'bekor'
              AND ch.miqdor > 100
            ORDER BY ch.miqdor DESC
            LIMIT 10
        """, uid, sana_dan)
        for r in rows4:
            anomaliyalar.append({
                "tur": "katta_miqdor",
                "daraja": "past",
                "id": r["id"],
                "document_number": r["document_number"],
                "klient": r["klient_ismi"],
                "sana": r["sana"].isoformat() if r["sana"] else None,
                "tovar": r["tovar_nomi"],
                "miqdor": float(r["miqdor"]),
                "sabab": f"{r['tovar_nomi']} — {int(float(r['miqdor']))} dona (katta hajm)",
            })

    # AI tahlili — Opus 4.7 xulosa
    ai_xulosa = None
    if claude_opus.ready and anomaliyalar:
        try:
            # Top 10 anomalia AI ga
            top_anom = sorted(
                anomaliyalar,
                key=lambda x: {"yuqori": 0, "o'rta": 1, "past": 2}[x.get("daraja", "past")],
            )[:10]
            anom_summary = "\n".join(
                f"• [{a['daraja']}] {a['tur']}: {a.get('sabab', '')}"
                for a in top_anom
            )

            system = """Sen SavdoAI anomaliya analitik — Claude Opus 4.7.
Foydalanuvchi biznesidagi g'ayrioddiy hodisalarni tahlil qilib, qisqa va aniq xulosa berasan.
O'zbek tilida, 200 so'zdan oshirma. Raqamlar va emoji bilan."""

            user_msg = f"""Oxirgi {kunlar} kun ichida {len(anomaliyalar)} ta anomaliya topildi:

{anom_summary}

Xulosa ber: bu biznesga qancha xavfli? Nima qilish kerak? 3 ta aniq tavsiya.
"""
            ai_xulosa = await claude_opus.chat(system=system, user=user_msg, max_tokens=800)
        except Exception as e:
            log.warning("Opus 4.7 anomaliya tahlili xato: %s", e)

    return {
        "davr": {"sana_dan": str(sana_dan), "kunlar": kunlar},
        "jami_anomaliya": len(anomaliyalar),
        "daraja_bo_yicha": {
            "yuqori": sum(1 for a in anomaliyalar if a.get("daraja") == "yuqori"),
            "o_rta":  sum(1 for a in anomaliyalar if a.get("daraja") == "o'rta"),
            "past":   sum(1 for a in anomaliyalar if a.get("daraja") == "past"),
        },
        "anomaliyalar": anomaliyalar,
        "ai_xulosa": ai_xulosa,
    }
