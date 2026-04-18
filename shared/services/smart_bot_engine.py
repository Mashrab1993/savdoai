"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — SMART BOT ENGINE v1.0                                        ║
║  6 ta enterprise-grade funksiya:                                         ║
║                                                                          ║
║  1. QARZ ESLATMA — muddati o'tgan qarzlar uchun klientga xabar         ║
║  2. NARX TAVSIYA — "Arielni qanchadan sotay?" → o'rtacha/min/max       ║
║  3. INVENTARIZATSIYA — "Ariel 45 ta, Tide 23 ta" → qoldiq yangilanadi  ║
║  4. KLIENT REYTING — A/B/C reyting (to'lov vaqtliligi bo'yicha)       ║
║  5. KUNLIK YAKUNIY AVTOMATIK — har kuni 20:00 da o'zi yuboradi         ║
║  6. HAFTALIK TREND — eng o'sgan/tushgan tovarlar + % o'zgarish          ║
║                                                                          ║
║  Barcha funksiyalar: asyncio.gather (parallel), RLS-free, test          ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
from shared.utils import like_escape
import logging
from datetime import datetime, timedelta
from decimal import Decimal

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")
D = lambda v: Decimal(str(v or 0))

def _pul(v) -> str:
    try: return f"{Decimal(str(v or 0)):,.0f}"
    except Exception: return "0"

def _bugun():
    return datetime.now(TZ).date()

def _kun_boshi(d=None):
    d = d or _bugun()
    return TZ.localize(datetime.combine(d, datetime.min.time()))


# ═══════════════════════════════════════════════════════════════
#  1. QARZ ESLATMA — muddati o'tgan + yaqinlashayotgan
# ═══════════════════════════════════════════════════════════════

async def qarz_eslatma_royxat(conn, uid: int) -> list[dict]:
    """
    Muddati o'tgan va 3 kun ichida o'tadigan qarzlar.
    Har bir klient uchun bitta xabar.
    """
    rows = await conn.fetch("""
        SELECT q.klient_ismi AS ism, 
               q.klient_id,
               SUM(q.qolgan) AS jami_qarz,
               MIN(q.muddat) AS eng_yaqin_muddat,
               COUNT(*) AS qarz_soni,
               bool_or(q.muddat < NOW()) AS muddati_otgan,
               bool_or(q.muddat < NOW() + INTERVAL '3 days' AND q.muddat >= NOW()) AS yaqinlashmoqda
        FROM qarzlar q
        WHERE q.user_id = $1 AND q.yopildi = FALSE AND q.qolgan > 0
        GROUP BY q.klient_ismi, q.klient_id
        HAVING SUM(q.qolgan) > 0
        ORDER BY MIN(q.muddat) ASC NULLS LAST
    """, uid)
    return [
        {
            "ism": r["ism"],
            "klient_id": r["klient_id"],
            "jami_qarz": float(r["jami_qarz"] or 0),
            "muddat": str(r["eng_yaqin_muddat"] or "")[:10],
            "qarz_soni": int(r["qarz_soni"] or 0),
            "muddati_otgan": bool(r["muddati_otgan"]),
            "yaqinlashmoqda": bool(r["yaqinlashmoqda"]),
        }
        for r in rows
    ]


def qarz_eslatma_matn(klient: dict) -> str:
    """Bitta klient uchun eslatma xabari."""
    if klient["muddati_otgan"]:
        return (
            f"🔴 {klient['ism']}, sizda {_pul(klient['jami_qarz'])} so'mlik "
            f"qarz muddati o'tgan! Iltimos, to'lang."
        )
    elif klient["yaqinlashmoqda"]:
        return (
            f"🟡 {klient['ism']}, {_pul(klient['jami_qarz'])} so'mlik "
            f"qarz muddati {klient['muddat']} da tugaydi."
        )
    return ""


# ═══════════════════════════════════════════════════════════════
#  2. NARX TAVSIYA — "Arielni qanchadan sotay?"
# ═══════════════════════════════════════════════════════════════

async def narx_tavsiya(conn, uid: int, tovar_nomi: str) -> dict:
    """
    Tovar uchun narx tavsiyasi:
    - O'rtacha sotish narxi
    - Eng yuqori/past narx
    - Oxirgi 10 ta sotuv narxi
    - Olish narxi (agar bor)
    """
    # Tovar topish
    tovar = await conn.fetchrow("""
        SELECT id, nomi, olish_narxi, qoldiq
        FROM tovarlar WHERE user_id=$1 AND lower(nomi) LIKE lower($2)
        ORDER BY qoldiq DESC NULLS LAST LIMIT 1
    """, uid, f"%{like_escape(tovar_nomi.strip())}%")

    if not tovar:
        return {"topildi": False, "nomi": tovar_nomi}

    tovar = dict(tovar)

    # Parallel: o'rtacha, min, max, oxirgi sotuvlar
    stats_task = conn.fetchrow("""
        SELECT AVG(sotish_narxi) AS ortacha,
               MIN(sotish_narxi) AS eng_past,
               MAX(sotish_narxi) AS eng_yuqori,
               COUNT(*) AS sotuv_soni
        FROM chiqimlar
        WHERE user_id=$1 AND tovar_id=$2 AND sotish_narxi > 0
    """, uid, tovar["id"])

    oxirgi_task = conn.fetch("""
        SELECT sotish_narxi AS narx, 
               klient_ismi AS klient,
               ss.sana
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ch.tovar_id=$2 AND ch.sotish_narxi > 0
        ORDER BY ss.sana DESC LIMIT 5
    """, uid, tovar["id"])

    stats = await stats_task
    oxirgi = await oxirgi_task

    olish = float(tovar.get("olish_narxi") or 0)
    ortacha = float(stats["ortacha"] or 0) if stats else 0
    eng_past = float(stats["eng_past"] or 0) if stats else 0
    eng_yuqori = float(stats["eng_yuqori"] or 0) if stats else 0

    # Tavsiya narx: o'rtacha * 1.0 (yoki olish * 1.2 agar sotuv kam)
    if ortacha > 0:
        tavsiya = ortacha
    elif olish > 0:
        tavsiya = olish * 1.2  # 20% ustama
    else:
        tavsiya = 0

    return {
        "topildi": True,
        "nomi": tovar["nomi"],
        "olish_narxi": olish,
        "qoldiq": int(tovar.get("qoldiq") or 0),
        "ortacha": round(ortacha),
        "eng_past": round(eng_past),
        "eng_yuqori": round(eng_yuqori),
        "tavsiya": round(tavsiya),
        "sotuv_soni": int(stats["sotuv_soni"] or 0) if stats else 0,
        "oxirgi_sotuvlar": [
            {"narx": float(r["narx"]), "klient": r["klient"],
             "sana": str(r["sana"] or "")[:10]}
            for r in oxirgi
        ],
        "foyda_foiz": round((tavsiya - olish) / olish * 100, 1) if olish > 0 and tavsiya > 0 else 0,
    }


def narx_tavsiya_matn(d: dict) -> str:
    """Narx tavsiya formati."""
    if not d.get("topildi"):
        return f"❌ '{d.get('nomi', '?')}' tovar topilmadi."

    t = f"💰 *{d['nomi']}* — NARX TAVSIYA\n"
    t += "━" * 24 + "\n\n"

    if d["olish_narxi"] > 0:
        t += f"📥 Olish narxi: {_pul(d['olish_narxi'])}\n"
    t += f"📦 Qoldiq: {d['qoldiq']} ta\n\n"

    if d["sotuv_soni"] > 0:
        t += f"📊 {d['sotuv_soni']} ta sotuv statistikasi:\n"
        t += f"  O'rtacha: {_pul(d['ortacha'])}\n"
        t += f"  Eng yuqori: {_pul(d['eng_yuqori'])}\n"
        t += f"  Eng past: {_pul(d['eng_past'])}\n"
    
    if d["tavsiya"] > 0:
        t += f"\n✅ *TAVSIYA: {_pul(d['tavsiya'])} so'm*"
        if d["foyda_foiz"] > 0:
            t += f" (foyda: {d['foyda_foiz']}%)"
        t += "\n"

    if d.get("oxirgi_sotuvlar"):
        t += "\n📋 Oxirgi sotuvlar:\n"
        for s in d["oxirgi_sotuvlar"][:3]:
            t += f"  {s['sana']} — {_pul(s['narx'])} ({s.get('klient', '?')})\n"

    return t.rstrip()


# ═══════════════════════════════════════════════════════════════
#  3. INVENTARIZATSIYA — qoldiq yangilash ovozdan
# ═══════════════════════════════════════════════════════════════

async def inventarizatsiya(conn, uid: int, tovarlar: list[dict]) -> dict:
    """
    Qoldiq yangilash.
    Input: [{"nomi": "Ariel", "qoldiq": 45}, {"nomi": "Tide", "qoldiq": 23}]
    """
    yangilandi = 0
    topilmadi = []
    farqlar = []

    for t in tovarlar:
        nomi = t.get("nomi", "").strip()
        yangi_q = int(t.get("qoldiq", 0))
        if not nomi:
            continue

        tovar = await conn.fetchrow("""
            SELECT id, nomi, qoldiq FROM tovarlar
            WHERE user_id=$1 AND lower(nomi) LIKE lower($2)
            LIMIT 1
            FOR UPDATE
        """, uid, f"%{like_escape(nomi)}%")

        if not tovar:
            topilmadi.append(nomi)
            continue

        eski_q = int(tovar.get("qoldiq") or 0)
        farq = yangi_q - eski_q

        await conn.execute("""
            UPDATE tovarlar SET qoldiq = $2 WHERE id = $1
        """, tovar["id"], yangi_q)

        farqlar.append({
            "nomi": tovar["nomi"],
            "eski": eski_q,
            "yangi": yangi_q,
            "farq": farq,
        })
        yangilandi += 1

    return {
        "yangilandi": yangilandi,
        "topilmadi": topilmadi,
        "farqlar": farqlar,
    }


def inventarizatsiya_matn(d: dict) -> str:
    """Inventarizatsiya natijasi."""
    t = "📋 INVENTARIZATSIYA NATIJASI\n"
    t += "━" * 24 + "\n\n"

    if d["yangilandi"] == 0:
        return t + "❌ Hech narsa yangilanmadi."

    t += f"✅ {d['yangilandi']} ta tovar yangilandi:\n\n"
    for f in d["farqlar"]:
        belgi = "📈" if f["farq"] > 0 else "📉" if f["farq"] < 0 else "➡️"
        farq_str = f"+{f['farq']}" if f["farq"] > 0 else str(f["farq"])
        t += f"  {belgi} {f['nomi']}: {f['eski']} → {f['yangi']} ({farq_str})\n"

    if d["topilmadi"]:
        t += f"\n⚠️ Topilmadi: {', '.join(d['topilmadi'])}"

    return t.rstrip()


# ═══════════════════════════════════════════════════════════════
#  4. KLIENT REYTING — A/B/C (to'lov vaqtliligi)
# ═══════════════════════════════════════════════════════════════

async def klient_reyting(conn, uid: int) -> list[dict]:
    """
    Klient reytingi — to'lov intizomi bo'yicha:
    A = har doim vaqtida (0 ta muddati o'tgan)
    B = ba'zan kechiktiradi (1-2 ta)
    C = ko'p kechiktiradi (3+)
    """
    rows = await conn.fetch("""
        SELECT 
            k.id, k.ism, k.telefon,
            COALESCE(k.jami_sotib, 0) AS jami_sotuv,
            COALESCE(SUM(q.qolgan) FILTER (WHERE q.yopildi = FALSE), 0) AS aktiv_qarz,
            COUNT(*) FILTER (WHERE q.muddat < NOW() AND q.yopildi = FALSE AND q.qolgan > 0) AS muddati_otgan,
            COUNT(*) FILTER (WHERE q.yopildi = TRUE) AS yopilgan_qarz,
            COUNT(DISTINCT ss.id) AS sotuv_soni
        FROM klientlar k
        LEFT JOIN qarzlar q ON q.klient_id = k.id AND q.user_id = $1
        LEFT JOIN sotuv_sessiyalar ss ON ss.klient_id = k.id AND ss.user_id = $1
        WHERE k.user_id = $1
        GROUP BY k.id, k.ism, k.telefon, k.jami_sotib
        HAVING COALESCE(k.jami_sotib, 0) > 0
        ORDER BY k.jami_sotib DESC
        LIMIT 20
    """, uid)

    result = []
    for r in rows:
        otgan = int(r["muddati_otgan"] or 0)
        if otgan == 0:
            reyting = "A"
            emoji = "🟢"
        elif otgan <= 2:
            reyting = "B"
            emoji = "🟡"
        else:
            reyting = "C"
            emoji = "🔴"

        result.append({
            "ism": r["ism"],
            "reyting": reyting,
            "emoji": emoji,
            "jami_sotuv": float(r["jami_sotuv"] or 0),
            "aktiv_qarz": float(r["aktiv_qarz"] or 0),
            "muddati_otgan": otgan,
            "sotuv_soni": int(r["sotuv_soni"] or 0),
        })

    return sorted(result, key=lambda x: ("CBA".index(x["reyting"]), -x["jami_sotuv"]))


def klient_reyting_matn(data: list[dict]) -> str:
    """Klient reyting formati."""
    if not data:
        return "📊 Hali klientlar yo'q."

    t = "📊 KLIENT REYTINGI\n"
    t += "━" * 24 + "\n"
    t += "🟢 A=Ishonchli  🟡 B=O'rta  🔴 C=Xavfli\n\n"

    for i, kl in enumerate(data[:15], 1):
        t += f"  {kl['emoji']} {kl['reyting']} | {kl['ism']}"
        t += f" — {_pul(kl['jami_sotuv'])}"
        if kl["aktiv_qarz"] > 0:
            t += f" (qarz: {_pul(kl['aktiv_qarz'])})"
        t += "\n"

    a = sum(1 for k in data if k["reyting"] == "A")
    b = sum(1 for k in data if k["reyting"] == "B")
    c = sum(1 for k in data if k["reyting"] == "C")
    t += f"\n📊 Jami: {a} ta 🟢A | {b} ta 🟡B | {c} ta 🔴C"

    return t.rstrip()


# ═══════════════════════════════════════════════════════════════
#  5. KUNLIK YAKUNIY AVTOMATIK — kechqurun 20:00
# ═══════════════════════════════════════════════════════════════

async def kunlik_yakuniy_pro(conn, uid: int) -> dict:
    """
    Professional kunlik yakuniy — oddiy hisobotdan FARQI:
    + Eng foydali tovar
    + Eng yirik klient
    + Kechagi bilan solishtirish
    + Qarz xulosa
    """
    bugun = _kun_boshi()
    kecha = _kun_boshi(_bugun() - timedelta(days=1))

    sotuv_task = conn.fetchrow("""
        SELECT COUNT(DISTINCT id) AS soni,
               COALESCE(SUM(jami), 0) AS jami,
               COALESCE(SUM(tolangan), 0) AS tolangan,
               COALESCE(SUM(qarz), 0) AS qarz
        FROM sotuv_sessiyalar WHERE user_id=$1 AND sana >= $2
    """, uid, bugun)

    kecha_task = conn.fetchval("""
        SELECT COALESCE(SUM(jami), 0)
        FROM sotuv_sessiyalar WHERE user_id=$1 AND sana >= $2 AND sana < $3
    """, uid, kecha, bugun)

    foyda_task = conn.fetchval("""
        SELECT COALESCE(SUM(
            (ch.sotish_narxi - ch.olish_narxi) * ch.miqdor
        ), 0)
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ss.sana >= $2
    """, uid, bugun)

    top_tovar_task = conn.fetchrow("""
        SELECT ch.tovar_nomi AS nomi,
               SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor) AS foyda
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ss.sana >= $2
        GROUP BY ch.tovar_nomi
        ORDER BY foyda DESC LIMIT 1
    """, uid, bugun)

    top_klient_task = conn.fetchrow("""
        SELECT klient_ismi AS ism, SUM(jami) AS jami
        FROM sotuv_sessiyalar
        WHERE user_id=$1 AND sana >= $2 AND klient_ismi IS NOT NULL
        GROUP BY klient_ismi ORDER BY jami DESC LIMIT 1
    """, uid, bugun)

    jami_qarz_task = conn.fetchval("""
        SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
        WHERE user_id=$1 AND yopildi = FALSE
    """, uid)

    sotuv = await sotuv_task
    kecha_jami = await kecha_task
    foyda = await foyda_task
    top_tv = await top_tovar_task
    top_kl = await top_klient_task
    jami_qarz = await jami_qarz_task

    bugun_jami = float(sotuv["jami"] or 0)
    kecha_j = float(kecha_jami or 0)
    ozgarish = round((bugun_jami - kecha_j) / kecha_j * 100, 1) if kecha_j > 0 else 0

    return {
        "sana": _bugun().strftime("%d.%m.%Y"),
        "sotuv_soni": int(sotuv["soni"] or 0),
        "sotuv_jami": bugun_jami,
        "tolangan": float(sotuv["tolangan"] or 0),
        "yangi_qarz": float(sotuv["qarz"] or 0),
        "foyda": float(foyda or 0),
        "kecha_jami": kecha_j,
        "ozgarish": ozgarish,
        "top_tovar": {"nomi": top_tv["nomi"], "foyda": float(top_tv["foyda"] or 0)} if top_tv else None,
        "top_klient": {"ism": top_kl["ism"], "jami": float(top_kl["jami"] or 0)} if top_kl else None,
        "jami_qarz": float(jami_qarz or 0),
    }


def kunlik_yakuniy_pro_matn(d: dict) -> str:
    """Professional kunlik yakuniy."""
    t = f"🌙 KUNLIK YAKUNIY — {d['sana']}\n"
    t += "━" * 24 + "\n\n"

    t += f"📤 Sotuv: {_pul(d['sotuv_jami'])} ({d['sotuv_soni']} ta)\n"
    t += f"✅ To'landi: {_pul(d['tolangan'])}\n"
    if d["yangi_qarz"] > 0:
        t += f"⚠️ Yangi qarz: {_pul(d['yangi_qarz'])}\n"

    foyda = d["foyda"]
    if foyda > 0:
        t += f"\n💰 SOF FOYDA: +{_pul(foyda)}\n"
    elif foyda < 0:
        t += f"\n📉 ZARAR: {_pul(foyda)}\n"

    # Kecha bilan solishtirish
    if d["kecha_jami"] > 0:
        oz = d["ozgarish"]
        if oz > 0:
            t += f"📈 Kechaga nisbatan: +{oz}%\n"
        elif oz < 0:
            t += f"📉 Kechaga nisbatan: {oz}%\n"

    if d.get("top_tovar"):
        t += f"\n🏆 Eng foydali: {d['top_tovar']['nomi']} (+{_pul(d['top_tovar']['foyda'])})\n"
    if d.get("top_klient"):
        t += f"👤 Yirik klient: {d['top_klient']['ism']} ({_pul(d['top_klient']['jami'])})\n"

    if d["jami_qarz"] > 0:
        t += f"\n💳 Jami qarz: {_pul(d['jami_qarz'])}"

    return t.rstrip()


# ═══════════════════════════════════════════════════════════════
#  6. HAFTALIK TREND — o'sish/tushish tahlili
# ═══════════════════════════════════════════════════════════════

async def haftalik_trend(conn, uid: int) -> dict:
    """
    Haftalik trend: bu hafta vs o'tgan hafta.
    Har tovar uchun % o'zgarish.
    """
    bu_hafta_bosh = _kun_boshi(_bugun() - timedelta(days=6))
    otgan_hafta_bosh = _kun_boshi(_bugun() - timedelta(days=13))
    hozir = datetime.now(TZ)

    # Bu hafta tovar sotuvlari
    bu_hafta = await conn.fetch("""
        SELECT ch.tovar_nomi AS nomi, SUM(ch.jami) AS jami
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ss.sana >= $2 AND ss.sana < $3
        GROUP BY ch.tovar_nomi
    """, uid, bu_hafta_bosh, hozir)

    # O'tgan hafta
    otgan_hafta = await conn.fetch("""
        SELECT ch.tovar_nomi AS nomi, SUM(ch.jami) AS jami
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ss.sana >= $2 AND ss.sana < $3
        GROUP BY ch.tovar_nomi
    """, uid, otgan_hafta_bosh, bu_hafta_bosh)

    otgan_map = {r["nomi"]: float(r["jami"] or 0) for r in otgan_hafta}

    trendlar = []
    for r in bu_hafta:
        nomi = r["nomi"]
        bu = float(r["jami"] or 0)
        otgan = otgan_map.get(nomi, 0)
        if otgan > 0:
            ozgarish = round((bu - otgan) / otgan * 100, 1)
        elif bu > 0:
            ozgarish = 100.0
        else:
            ozgarish = 0
        trendlar.append({"nomi": nomi, "bu_hafta": bu, "otgan_hafta": otgan, "ozgarish": ozgarish})

    osganlar = sorted([t for t in trendlar if t["ozgarish"] > 0], key=lambda x: -x["ozgarish"])
    tushganlar = sorted([t for t in trendlar if t["ozgarish"] < 0], key=lambda x: x["ozgarish"])

    bu_jami = sum(float(r["jami"] or 0) for r in bu_hafta)
    otgan_jami = sum(float(r["jami"] or 0) for r in otgan_hafta)
    umumiy_ozgarish = round((bu_jami - otgan_jami) / otgan_jami * 100, 1) if otgan_jami > 0 else 0

    return {
        "osganlar": osganlar[:5],
        "tushganlar": tushganlar[:5],
        "bu_hafta_jami": bu_jami,
        "otgan_hafta_jami": otgan_jami,
        "umumiy_ozgarish": umumiy_ozgarish,
    }


def haftalik_trend_matn(d: dict) -> str:
    """Haftalik trend formati."""
    t = "📊 HAFTALIK TREND\n"
    t += "━" * 24 + "\n\n"

    oz = d["umumiy_ozgarish"]
    belgi = "📈" if oz > 0 else "📉" if oz < 0 else "➡️"
    t += f"{belgi} Umumiy: {_pul(d['bu_hafta_jami'])} ({'+' if oz > 0 else ''}{oz}%)\n\n"

    if d["osganlar"]:
        t += "🟢 ENG KO'P O'SGAN:\n"
        for i, tv in enumerate(d["osganlar"][:3], 1):
            t += f"  {i}. {tv['nomi']} +{tv['ozgarish']}% ({_pul(tv['bu_hafta'])})\n"

    if d["tushganlar"]:
        t += "\n🔴 ENG KO'P TUSHGAN:\n"
        for i, tv in enumerate(d["tushganlar"][:3], 1):
            t += f"  {i}. {tv['nomi']} {tv['ozgarish']}% ({_pul(tv['bu_hafta'])})\n"

    if not d["osganlar"] and not d["tushganlar"]:
        t += "ℹ️ Hali yetarli ma'lumot yo'q."

    return t.rstrip()


# ═══════════════════════════════════════════════════════════════
#  OVOZDAN ANIQLASH — qaysi funksiya chaqiriladi
# ═══════════════════════════════════════════════════════════════

NARX_SOZLAR = ("qanchadan sotay", "narx tavsiya", "qancha turadi", "nechchidan",
               "narxini ayt", "qanchaga sotaman")
INVENTAR_SOZLAR = ("inventarizatsiya", "sanoq", "qoldiq yangilash", "qoldiqni tuzat")
REYTING_SOZLAR = ("klient reyting", "reyting", "ishonchli klient", "xavfli klient",
                  "eng yaxshi klient")
TREND_SOZLAR = ("trend", "o'sish", "tushish", "haftalik trend", "qaysi tovar o'sgan")


def smart_buyruq_aniqla(matn: str) -> str | None:
    """Matndan smart buyruq turini aniqlash."""
    m = matn.lower().strip()
    for s in NARX_SOZLAR:
        if s in m: return "narx_tavsiya"
    for s in INVENTAR_SOZLAR:
        if s in m: return "inventarizatsiya"
    for s in REYTING_SOZLAR:
        if s in m: return "klient_reyting"
    for s in TREND_SOZLAR:
        if s in m: return "haftalik_trend"
    return None


def narx_tovar_ajrat(matn: str) -> str | None:
    """Matndan tovar nomini ajratish. "Arielni qanchadan sotay" → "Ariel" """
    import re
    patterns = [
        r"(\S+?)(?:ni|ning|dan|ga)?\s+(?:qancha|narx|nechi|sotay)",
        r"(?:narx|qancha|nechi)\s+(\S+)",
    ]
    for p in patterns:
        m = re.search(p, matn, re.IGNORECASE)
        if m:
            ism = m.group(1).strip()
            if len(ism) > 1:
                return ism
    return None
