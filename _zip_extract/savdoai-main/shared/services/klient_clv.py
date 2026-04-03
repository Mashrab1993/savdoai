"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — KLIENT CLV (Customer Lifetime Value)         ║
║  Salesforce + Khatabook modelidan ilhomlangan                   ║
║                                                                  ║
║  CLV = O'rtacha chek × Chastota × O'rtacha umr                 ║
║                                                                  ║
║  Klientlarni QIYMATIGA qarab tartiblash:                        ║
║  💎 Eng qimmat klientlar → ko'proq e'tibor                     ║
║  ⚠️ Yo'qolib ketayotgan qimmat klientlar → tezda harakat      ║
║  📈 O'sish potentsiali → investitsiya qilish                   ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime
from decimal import Decimal

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")


async def klient_clv(conn, uid: int, top: int = 20) -> dict:
    """
    Barcha klientlar CLV hisoblash.
    
    CLV = Ortacha_chek × Oylik_chastota × 12 × Kutilgan_umr(yil)
    """
    rows = await conn.fetch("""
        WITH klient_stats AS (
            SELECT
                k.id,
                k.ism,
                k.telefon,
                COUNT(ss.id) AS sotuv_soni,
                COALESCE(SUM(ss.jami), 0) AS jami_tushum,
                COALESCE(AVG(ss.jami), 0) AS ortacha_chek,
                MIN(ss.sana) AS birinchi_sotuv,
                MAX(ss.sana) AS oxirgi_sotuv,
                COUNT(DISTINCT EXTRACT(MONTH FROM ss.sana)) AS faol_oylar,
                COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE), 0) AS faol_qarz
            FROM klientlar k
            LEFT JOIN sotuv_sessiyalar ss ON ss.klient_id = k.id
            LEFT JOIN qarzlar q ON q.klient_id = k.id
            WHERE k.user_id = $1
            GROUP BY k.id
            HAVING COUNT(ss.id) > 0
        )
        SELECT * FROM klient_stats
        ORDER BY jami_tushum DESC
        LIMIT $2
    """, uid, top)

    bugun = datetime.now(TZ)
    klientlar = []
    jami_clv = 0

    for r in rows:
        sotuv_soni = int(r["sotuv_soni"])
        jami = float(r["jami_tushum"])
        ortacha_chek = float(r["ortacha_chek"])
        faol_oylar = max(int(r["faol_oylar"]), 1)

        # Oylik chastota
        birinchi = r["birinchi_sotuv"]
        oxirgi = r["oxirgi_sotuv"]

        if birinchi and oxirgi:
            umr_oy = max(1, (oxirgi - birinchi).days / 30)
            oylik_chastota = sotuv_soni / umr_oy
            oxirgi_kun = (bugun - oxirgi.astimezone(TZ)).days
        else:
            oylik_chastota = 1
            oxirgi_kun = 999
            umr_oy = 1

        # Kutilgan umr (yil) — faol klientlar uzunroq
        if oxirgi_kun <= 14:
            kutilgan_umr = 3.0  # Faol — 3 yil
        elif oxirgi_kun <= 30:
            kutilgan_umr = 2.0
        elif oxirgi_kun <= 60:
            kutilgan_umr = 1.0
        else:
            kutilgan_umr = 0.5  # Yo'qolayotgan

        # CLV = ortacha_chek × oylik_chastota × 12 × kutilgan_umr
        clv = ortacha_chek * oylik_chastota * 12 * kutilgan_umr

        # Status
        if oxirgi_kun <= 7:
            status = "faol"
            status_emoji = "🟢"
        elif oxirgi_kun <= 30:
            status = "normal"
            status_emoji = "🔵"
        elif oxirgi_kun <= 60:
            status = "xavfda"
            status_emoji = "🟡"
        else:
            status = "yo'qolgan"
            status_emoji = "🔴"

        jami_clv += clv

        klientlar.append({
            "id": r["id"],
            "ism": r["ism"],
            "telefon": r["telefon"],
            "jami_tushum": round(jami),
            "sotuv_soni": sotuv_soni,
            "ortacha_chek": round(ortacha_chek),
            "oylik_chastota": round(oylik_chastota, 1),
            "oxirgi_kun": oxirgi_kun,
            "clv": round(clv),
            "status": status,
            "status_emoji": status_emoji,
            "faol_qarz": float(r["faol_qarz"]),
        })

    # CLV bo'yicha tartiblash
    klientlar.sort(key=lambda x: -x["clv"])

    return {
        "klientlar": klientlar,
        "jami_clv": round(jami_clv),
        "ortacha_clv": round(jami_clv / len(klientlar)) if klientlar else 0,
        "top_klient": klientlar[0] if klientlar else None,
    }


def clv_matn(data: dict) -> str:
    """Bot uchun CLV xulosa matni."""
    if not data.get("klientlar"):
        return "📊 CLV hisoblash uchun yetarli ma'lumot yo'q."

    matn = (
        f"💎 *KLIENT QIYMATI (CLV)*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"💰 Jami CLV: *{data['jami_clv']:,.0f}* so'm\n"
        f"📊 O'rtacha: {data['ortacha_clv']:,.0f} so'm\n\n"
    )

    # Top 5 eng qimmat
    matn += "👑 *TOP KLIENTLAR:*\n"
    for i, k in enumerate(data["klientlar"][:5], 1):
        matn += (
            f"  {i}. {k['status_emoji']} *{k['ism']}*\n"
            f"     CLV: {k['clv']:,.0f} | "
            f"Chek: {k['ortacha_chek']:,.0f} | "
            f"{k['oylik_chastota']:.1f}x/oy\n"
        )

    # Xavfdagi qimmat klientlar
    xavfda = [k for k in data["klientlar"] if k["status"] == "xavfda" and k["clv"] > data["ortacha_clv"]]
    if xavfda:
        matn += "\n⚠️ *XAVFDA — QIMMAT KLIENTLAR:*\n"
        for k in xavfda[:3]:
            matn += (
                f"  🟡 {k['ism']}: CLV {k['clv']:,.0f} — "
                f"{k['oxirgi_kun']} kundan beri yo'q!\n"
            )
        matn += "  💡 _Ularga qo'ng'iroq qiling!_\n"

    return matn
