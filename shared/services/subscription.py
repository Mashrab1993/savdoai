"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — FREEMIUM/OBUNA BOSHQARUV                     ║
║  Khatabook modelidan: Basic bepul, Pro pullik                   ║
║                                                                  ║
║  TARIFLAR:                                                       ║
║  ┌──────────┬─────────────┬─────────────┬─────────────┐         ║
║  │          │ BOSHLANG'ICH│  O'RTA      │  BIZNES     │         ║
║  │ Narx     │ BEPUL       │ 49,000/oy   │ 149,000/oy  │         ║
║  │ Tovarlar │ 50          │ 500         │ Cheksiz     │         ║
║  │ Sotuvlar │ 100/oy      │ 2000/oy     │ Cheksiz     │         ║
║  │ Klientlar│ 20          │ 200         │ Cheksiz     │         ║
║  │ KPI      │ ❌          │ ✅          │ ✅          │         ║
║  │ Loyalty  │ ❌          │ ✅          │ ✅          │         ║
║  │ GPS      │ ❌          │ ❌          │ ✅          │         ║
║  │ Filial   │ 1           │ 3           │ Cheksiz     │         ║
║  │ AI ovoz  │ 10/kun      │ 50/kun      │ Cheksiz     │         ║
║  │ Export   │ ❌          │ ✅          │ ✅          │         ║
║  │ Webhook  │ ❌          │ ❌          │ ✅          │         ║
║  └──────────┴─────────────┴─────────────┴─────────────┘         ║
║                                                                  ║
║  14 kun bepul sinov davri (barcha funksiyalar ochiq)             ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")


# ═══ TARIF PLANLARI ═══

TARIFLAR = {
    "boshlangich": {
        "nomi": "Boshlang'ich",
        "emoji": "🌱",
        "narx_oylik": 0,
        "tovar_limit": 50,
        "sotuv_limit_oylik": 100,
        "klient_limit": 20,
        "filial_limit": 1,
        "ai_ovoz_kunlik": 10,
        "kpi": False,
        "loyalty": False,
        "gps": False,
        "export": False,
        "webhook": False,
        "multi_filial": False,
    },
    "orta": {
        "nomi": "O'rta",
        "emoji": "⭐",
        "narx_oylik": 49_000,
        "tovar_limit": 500,
        "sotuv_limit_oylik": 2000,
        "klient_limit": 200,
        "filial_limit": 3,
        "ai_ovoz_kunlik": 50,
        "kpi": True,
        "loyalty": True,
        "gps": False,
        "export": True,
        "webhook": False,
        "multi_filial": True,
    },
    "biznes": {
        "nomi": "Biznes",
        "emoji": "💎",
        "narx_oylik": 149_000,
        "tovar_limit": 999_999,
        "sotuv_limit_oylik": 999_999,
        "klient_limit": 999_999,
        "filial_limit": 999,
        "ai_ovoz_kunlik": 999,
        "kpi": True,
        "loyalty": True,
        "gps": True,
        "export": True,
        "webhook": True,
        "multi_filial": True,
    },
}

# Sinov muddati (bepul)
SINOV_KUNLAR = 14


def tarif_olish(tarif_kodi: str) -> dict:
    """Tarif ma'lumotlarini olish."""
    return TARIFLAR.get(tarif_kodi, TARIFLAR["boshlangich"])


async def user_tarif_tekshir(conn, uid: int) -> dict:
    """
    Foydalanuvchi tarifi va limitlarini tekshirish.
    
    Qaytaradi:
    {
        "tarif": "orta",
        "nomi": "O'rta",
        "sinov": True/False,
        "sinov_qolgan_kun": 7,
        "limitlar": {...},
        "ishlatilgan": {"tovar": 45, "sotuv_bu_oy": 78, ...},
        "ogohlar": ["Tovar limiti yaqin: 45/50"],
    }
    """
    # User tarifi va sinov muddati
    user = await conn.fetchrow("""
        SELECT tarif, yaratilgan,
               COALESCE(sinov_tugash, yaratilgan + interval '14 days') AS sinov_tugash
        FROM users WHERE id = $1
    """, uid)

    if not user:
        return {"tarif": "boshlangich", "xato": "Foydalanuvchi topilmadi"}

    tarif_kodi = user.get("tarif") or "boshlangich"
    tarif = tarif_olish(tarif_kodi)

    # Sinov muddati tekshirish
    sinov_tugash = user.get("sinov_tugash")
    bugun = datetime.now(TZ).date()
    sinov = False
    sinov_qolgan = 0

    if sinov_tugash:
        sinov_sana = sinov_tugash.date() if hasattr(sinov_tugash, 'date') else sinov_tugash
        if bugun <= sinov_sana:
            sinov = True
            sinov_qolgan = (sinov_sana - bugun).days

    # Hozirgi ishlatilgan miqdorlar
    tovar_soni = await conn.fetchval(
        "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid) or 0
    klient_soni = await conn.fetchval(
        "SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid) or 0
    sotuv_bu_oy = await conn.fetchval("""
        SELECT COUNT(*) FROM sotuv_sessiyalar
        WHERE user_id=$1 AND EXTRACT(MONTH FROM sana)=EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR FROM sana)=EXTRACT(YEAR FROM NOW())
    """, uid) or 0

    ishlatilgan = {
        "tovar": int(tovar_soni),
        "klient": int(klient_soni),
        "sotuv_bu_oy": int(sotuv_bu_oy),
    }

    # Sinov davri — barcha funksiyalar ochiq
    if sinov:
        aktiv_tarif = TARIFLAR["biznes"]
    else:
        aktiv_tarif = tarif

    # Ogohlantirishlar
    ogohlar = []
    if not sinov:
        t_limit = aktiv_tarif["tovar_limit"]
        if tovar_soni >= t_limit * 0.8:
            ogohlar.append(f"📦 Tovar: {tovar_soni}/{t_limit}")
        s_limit = aktiv_tarif["sotuv_limit_oylik"]
        if sotuv_bu_oy >= s_limit * 0.8:
            ogohlar.append(f"📊 Sotuv: {sotuv_bu_oy}/{s_limit}")
        k_limit = aktiv_tarif["klient_limit"]
        if klient_soni >= k_limit * 0.8:
            ogohlar.append(f"👥 Klient: {klient_soni}/{k_limit}")

    if sinov and sinov_qolgan <= 3:
        ogohlar.append(f"⏰ Sinov muddati {sinov_qolgan} kunda tugaydi!")

    return {
        "tarif": tarif_kodi,
        "nomi": tarif["nomi"],
        "emoji": tarif["emoji"],
        "narx": tarif["narx_oylik"],
        "sinov": sinov,
        "sinov_qolgan_kun": sinov_qolgan,
        "limitlar": {
            "tovar": aktiv_tarif["tovar_limit"],
            "klient": aktiv_tarif["klient_limit"],
            "sotuv_oylik": aktiv_tarif["sotuv_limit_oylik"],
            "filial": aktiv_tarif["filial_limit"],
            "ai_ovoz_kunlik": aktiv_tarif["ai_ovoz_kunlik"],
        },
        "funksiyalar": {
            "kpi": aktiv_tarif["kpi"],
            "loyalty": aktiv_tarif["loyalty"],
            "gps": aktiv_tarif["gps"],
            "export": aktiv_tarif["export"],
            "multi_filial": aktiv_tarif["multi_filial"],
        },
        "ishlatilgan": ishlatilgan,
        "ogohlar": ogohlar,
    }


def limit_tekshir(tarif_info: dict, tur: str) -> bool:
    """Limit o'tmaganligini tekshirish. True = ruxsat, False = limit."""
    if tarif_info.get("sinov"):
        return True  # Sinov davri — cheklov yo'q
    limitlar = tarif_info.get("limitlar", {})
    ishlatilgan = tarif_info.get("ishlatilgan", {})
    limit = limitlar.get(tur, 999999)
    used = ishlatilgan.get(tur, 0)
    return used < limit


def tariflar_taqqos_matni() -> str:
    """Tarif taqqoslash matnini generatsiya (bot uchun)."""
    matn = "📋 *SavdoAI Tariflar*\n━━━━━━━━━━━━━━━━━━━━━\n\n"
    for key, t in TARIFLAR.items():
        narx = f"{t['narx_oylik']:,} so'm/oy" if t["narx_oylik"] > 0 else "BEPUL"
        matn += (
            f"{t['emoji']} *{t['nomi']}* — {narx}\n"
            f"  📦 {t['tovar_limit']} tovar"
            f" | 📊 {t['sotuv_limit_oylik']}/oy"
            f" | 👥 {t['klient_limit']} klient\n"
        )
        funksiyalar = []
        if t["kpi"]: funksiyalar.append("KPI")
        if t["loyalty"]: funksiyalar.append("Loyalty")
        if t["gps"]: funksiyalar.append("GPS")
        if t["export"]: funksiyalar.append("Export")
        if funksiyalar:
            matn += f"  ✅ {', '.join(funksiyalar)}\n"
        matn += "\n"

    matn += f"🎁 {SINOV_KUNLAR} kun bepul sinov — barcha funksiyalar ochiq!"
    return matn
