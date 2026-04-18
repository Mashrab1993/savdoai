"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — KLIENT SEGMENTATSIYA (RFM TAHLILI)          ║
║                                                                  ║
║  Klientlarni AVTOMATIK tasnif qiladi:                           ║
║                                                                  ║
║  RFM modeli (Recency-Frequency-Monetary):                       ║
║  R = Oxirgi sotib olish (yaqindami?)                            ║
║  F = Tez-tez sotib oladimi?                                    ║
║  M = Qancha pul sarflaydi?                                     ║
║                                                                  ║
║  SEGMENTLAR:                                                     ║
║  👑 CHAMPION    — Eng yaxshi klient (tez-tez, ko'p)            ║
║  💎 LOYAL       — Doimiy, ishonchli                             ║
║  ⭐ POTENTIAL   — Ko'p sarflaydi, lekin kam keladi              ║
║  😴 SLEEPING    — Oldin yaxshi edi, hozir yo'q                  ║
║  🆕 NEW         — Yangi klient                                  ║
║  ⚠️ AT_RISK     — Yo'qolib ketish xavfi                        ║
║  ❌ LOST        — 60+ kun sotib olmagan                         ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")

SEGMENTLAR = {
    "champion":  {"emoji": "👑", "nomi": "Champion",  "rang": "#10b981"},
    "loyal":     {"emoji": "💎", "nomi": "Loyal",     "rang": "#3b82f6"},
    "potential":  {"emoji": "⭐", "nomi": "Potential",  "rang": "#f59e0b"},
    "sleeping":  {"emoji": "😴", "nomi": "Sleeping",  "rang": "#6b7280"},
    "new":       {"emoji": "🆕", "nomi": "New",       "rang": "#8b5cf6"},
    "at_risk":   {"emoji": "⚠️", "nomi": "At Risk",   "rang": "#ef4444"},
    "lost":      {"emoji": "❌", "nomi": "Lost",      "rang": "#991b1b"},
}


def rfm_segment(recency_days: int, frequency: int, monetary: float) -> str:
    """
    RFM skori asosida segment aniqlash.
    
    recency_days: Oxirgi sotib olishdan necha kun o'tdi
    frequency: 90 kunda necha marta sotib oldi
    monetary: 90 kunda qancha pul sarfladi
    """
    # Recency score (1-5)
    if recency_days <= 7:
        r = 5
    elif recency_days <= 14:
        r = 4
    elif recency_days <= 30:
        r = 3
    elif recency_days <= 60:
        r = 2
    else:
        r = 1

    # Frequency score (1-5)
    if frequency >= 20:
        f = 5
    elif frequency >= 10:
        f = 4
    elif frequency >= 5:
        f = 3
    elif frequency >= 2:
        f = 2
    else:
        f = 1

    # Monetary score (1-5)
    if monetary >= 10_000_000:
        m = 5
    elif monetary >= 5_000_000:
        m = 4
    elif monetary >= 1_000_000:
        m = 3
    elif monetary >= 200_000:
        m = 2
    else:
        m = 1

    # Segment aniqlash
    score = r + f + m  # 3-15

    if score >= 13:
        return "champion"
    elif r >= 4 and f >= 3:
        return "loyal"
    elif r <= 2 and f >= 3:
        return "sleeping"
    elif r >= 3 and m >= 4 and f <= 2:
        return "potential"
    elif f <= 1 and recency_days <= 30:
        return "new"
    elif r <= 2 and f <= 2:
        return "lost"
    else:
        return "at_risk"


async def klientlar_segmentatsiya(conn, uid: int) -> dict:
    """Barcha klientlarni segmentatsiya qilish."""
    rows = await conn.fetch("""
        SELECT
            k.id,
            k.ism,
            k.telefon,
            COUNT(ss.id) AS sotuv_soni_90,
            COALESCE(SUM(ss.jami), 0) AS jami_summa_90,
            MAX(ss.sana) AS oxirgi_sotuv,
            COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE), 0) AS faol_qarz
        FROM klientlar k
        LEFT JOIN sotuv_sessiyalar ss
            ON ss.klient_id = k.id AND ss.sana >= NOW() - interval '90 days'
        LEFT JOIN qarzlar q
            ON q.klient_id = k.id
        WHERE k.user_id = $1
        GROUP BY k.id
        ORDER BY jami_summa_90 DESC
    """, uid)

    bugun = datetime.now(TZ)
    segmentlar_count = {k: 0 for k in SEGMENTLAR}
    klientlar = []

    for r in rows:
        # RFM hisoblash
        oxirgi = r["oxirgi_sotuv"]
        if oxirgi:
            recency = (bugun - oxirgi.astimezone(TZ)).days
        else:
            recency = 999

        frequency = int(r["sotuv_soni_90"])
        monetary = float(r["jami_summa_90"])

        seg = rfm_segment(recency, frequency, monetary)
        seg_info = SEGMENTLAR[seg]
        segmentlar_count[seg] += 1

        klientlar.append({
            "id": r["id"],
            "ism": r["ism"],
            "telefon": r["telefon"],
            "segment": seg,
            "segment_nomi": seg_info["nomi"],
            "segment_emoji": seg_info["emoji"],
            "recency_kun": recency if recency < 999 else None,
            "frequency_90": frequency,
            "monetary_90": round(monetary),
            "faol_qarz": float(r["faol_qarz"]),
        })

    # Segment xulosa
    jami = len(klientlar)
    xulosa = {}
    for seg, count in segmentlar_count.items():
        if count > 0:
            info = SEGMENTLAR[seg]
            xulosa[seg] = {
                "nomi": info["nomi"],
                "emoji": info["emoji"],
                "soni": count,
                "foiz": round(count / jami * 100, 1) if jami > 0 else 0,
            }

    return {
        "klientlar": klientlar,
        "xulosa": xulosa,
        "jami": jami,
    }


def segmentatsiya_matn(data: dict) -> str:
    """Bot uchun segment xulosa matni."""
    if not data.get("xulosa"):
        return "📊 Klientlar segmentatsiyasi uchun yetarli ma'lumot yo'q."

    matn = "📊 *KLIENT SEGMENTATSIYA*\n━━━━━━━━━━━━━━━━━━━━━\n\n"

    # Segment tartibida ko'rsatish
    for seg_key in ["champion", "loyal", "potential", "new", "at_risk", "sleeping", "lost"]:
        if seg_key in data["xulosa"]:
            s = data["xulosa"][seg_key]
            matn += f"{s['emoji']} *{s['nomi']}*: {s['soni']} ta ({s['foiz']}%)\n"

    matn += f"\n👥 Jami: {data['jami']} klient\n"

    # Eng muhim tavsiyalar
    tavsiyalar = []
    at_risk = data["xulosa"].get("at_risk", {}).get("soni", 0)
    sleeping = data["xulosa"].get("sleeping", {}).get("soni", 0)
    lost = data["xulosa"].get("lost", {}).get("soni", 0)

    if at_risk > 0:
        tavsiyalar.append(f"⚠️ {at_risk} ta klient yo'qolib ketish xavfida — tezda aloqaga chiqing!")
    if sleeping > 0:
        tavsiyalar.append(f"😴 {sleeping} ta \"uxlab qolgan\" klient — maxsus taklif yuboring")
    if lost > 0:
        tavsiyalar.append(f"❌ {lost} ta yo'qolgan klient — qayta jalb qilish kerak")

    if tavsiyalar:
        matn += "\n💡 *Tavsiyalar:*\n"
        for t in tavsiyalar:
            matn += f"  {t}\n"

    return matn
