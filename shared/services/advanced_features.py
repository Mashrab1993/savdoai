"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — ADVANCED BOT FEATURES v1.0                                    ║
║  9 ta qolgan enterprise funksiya:                                        ║
║                                                                          ║
║  1. KONTEKSTLI SUHBAT — "yana 20 Tide ham qo'sh"                       ║
║  2. XATO TUZATISH — "50 emas, 30 ta"                                   ║
║  3. TABIIY SAVOL-JAVOB — "kecha Ariel nechtadan sotdim?"               ║
║  4. ZARAR OGOHLANTIRISH — real-time, sotuv paytida                     ║
║  5. SHABLONLAR — "Salimov odatiy" → oxirgi sotuv takrorlanadi          ║
║  6. GURUHLI OVOZ — "5 klientga bir xil tovar"                          ║
║  7. TEZKOR TUGMALAR — eng ko'p ishlatiladigan tovar/klient             ║
║  8. QOLDIQ TO'G'RILASH — "Ariel 3 ta yo'qoldi"                        ║
║  9. TOVAR ABC TAHLILI — A=80%, B=15%, C=5% sotuv                       ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
from shared.utils import like_escape
import asyncio
import logging
import re
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")

def _pul(v) -> str:
    try: return f"{Decimal(str(v or 0)):,.0f}"
    except Exception: return "0"

def _bugun():
    return datetime.now(TZ).date()

def _kun_boshi(d=None):
    d = d or _bugun()
    return TZ.localize(datetime.combine(d, datetime.min.time()))


# ═══════════════════════════════════════════════════════════════
#  1. KONTEKSTLI SUHBAT — "yana", "ham", "qo'sh", "shunga"
# ═══════════════════════════════════════════════════════════════

KONTEKST_SOZLAR = ("yana", "ham qo'sh", "shunga", "qo'shimcha", "ustiga", "bundan tashqari")

def kontekst_bormi(matn: str) -> bool:
    """Matnda kontekst so'zlari bormi — oldingi savat/klientga qo'shish."""
    m = matn.lower().strip()
    return any(s in m for s in KONTEKST_SOZLAR)


def kontekst_tozala(matn: str) -> str:
    """Kontekst so'zlarini olib tashlash — toza buyruq qoladi."""
    m = matn
    for s in KONTEKST_SOZLAR:
        m = m.replace(s, "").strip()
    return m


# ═══════════════════════════════════════════════════════════════
#  2. XATO TUZATISH — "50 emas 30", "narxini 45000 qil"
# ═══════════════════════════════════════════════════════════════

TUZATISH_PATTERNS = [
    # "50 emas 30 ta"
    re.compile(r'(\d+)\s*(?:emas|emas,)\s*(\d+)', re.IGNORECASE),
    # "miqdorni 30 ga o'zgartir"
    re.compile(r'miqdor\w*\s+(\d+)', re.IGNORECASE),
    # "narxini 45000 qil"
    re.compile(r'narx\w*\s+(\d+)', re.IGNORECASE),
]

def tuzatish_bormi(matn: str) -> bool:
    """Matn tuzatish buyrug'imi?"""
    m = matn.lower().strip()
    kalitlar = ("emas", "o'zgartir", "tuzat", "noto'g'ri", "xato", 
                "qayta", "boshqattan", "исправ", "поменяй")
    return any(k in m for k in kalitlar)


def tuzatish_ajrat(matn: str) -> dict:
    """
    Tuzatish buyrug'idan eski va yangi qiymatlarni ajratish.
    "50 emas 30" → {"eski": 50, "yangi": 30, "tur": "miqdor"}
    """
    for p in TUZATISH_PATTERNS:
        m = p.search(matn)
        if m:
            groups = m.groups()
            if len(groups) == 2:
                return {"eski": int(groups[0]), "yangi": int(groups[1]), "tur": "miqdor"}
            elif len(groups) == 1:
                val = int(groups[0])
                if val > 1000:
                    return {"yangi": val, "tur": "narx"}
                return {"yangi": val, "tur": "miqdor"}
    return {}


# ═══════════════════════════════════════════════════════════════
#  3. TABIIY SAVOL-JAVOB — DB dan so'rov
# ═══════════════════════════════════════════════════════════════

SAVOL_PATTERNS = {
    "kecha_sotuv": re.compile(
        r'kecha\w*\s+(?:.*?)(?:nechtadan|qancha|nechta|miqdor)', re.IGNORECASE),
    "tovar_qoldiq": re.compile(
        r'(\S+?)(?:ning|ni|dan)?\s+(?:qoldi[gq]|nechta\s+qol|qancha\s+qol)', re.IGNORECASE),
    "oxirgi_sotuv": re.compile(
        r'oxirgi\s+(?:sotuv|savdo)|(?:sotuv|savdo)\s+oxirgi', re.IGNORECASE),
    "eng_kop": re.compile(
        r'eng\s+(?:ko[\'ʻ]p|kop)\s+(?:sotilgan|sotildi|sotuv)', re.IGNORECASE),
}


def savol_turini_aniqla(matn: str) -> Optional[str]:
    """Matndan savol turini aniqlash."""
    for tur, pattern in SAVOL_PATTERNS.items():
        if pattern.search(matn):
            return tur
    return None


def savol_tovar_ajrat(matn: str) -> Optional[str]:
    """Savoldan tovar nomini ajratish."""
    m = re.search(r'(\S+?)(?:ning|ni|dan)?\s+(?:qoldi|nechta|qancha|narxi)', 
                  matn, re.IGNORECASE)
    if m and len(m.group(1)) > 1:
        return m.group(1)
    return None


async def tabiiy_savol_javob(conn, uid: int, matn: str) -> Optional[str]:
    """
    Tabiiy savolga DB dan javob.
    "Kecha Ariel nechtadan sotdim?" → "Kecha 50 ta Ariel sotildi, 45,000 dan"
    """
    tur = savol_turini_aniqla(matn)
    if not tur:
        return None

    if tur == "kecha_sotuv":
        kecha = _kun_boshi(_bugun() - timedelta(days=1))
        bugun = _kun_boshi()
        tovar = savol_tovar_ajrat(matn)
        if tovar:
            row = await conn.fetchrow("""
                SELECT SUM(ch.miqdor) AS miqdor, 
                       AVG(ch.sotish_narxi) AS narx,
                       SUM(ch.jami) AS jami
                FROM chiqimlar ch
                JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
                WHERE ch.user_id=$1 AND ss.sana >= $2 AND ss.sana < $3
                  AND lower(ch.tovar_nomi) LIKE lower($4)
            """, uid, kecha, bugun, f"%{like_escape(tovar)}%")
            if row and row["miqdor"]:
                return (f"📊 Kecha {int(row['miqdor'])} ta {tovar} sotildi, "
                        f"o'rtacha {_pul(row['narx'])} dan, jami {_pul(row['jami'])}")
            return f"ℹ️ Kecha {tovar} sotilmagan."

        # Umumiy kecha sotuv
        row = await conn.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= $2 AND sana < $3
        """, uid, kecha, bugun)
        return f"📊 Kecha {row['soni']} ta sotuv, jami {_pul(row['jami'])}"

    elif tur == "tovar_qoldiq":
        tovar = savol_tovar_ajrat(matn)
        if tovar:
            row = await conn.fetchrow("""
                SELECT nomi, qoldiq FROM tovarlar
                WHERE user_id=$1 AND lower(nomi) LIKE lower($2) LIMIT 1
            """, uid, f"%{like_escape(tovar)}%")
            if row:
                return f"📦 {row['nomi']}: *{row['qoldiq']}* ta qoldi"
            return f"❌ {tovar} topilmadi"

    elif tur == "eng_kop":
        rows = await conn.fetch("""
            SELECT ch.tovar_nomi AS nomi, SUM(ch.miqdor) AS miqdor, SUM(ch.jami) AS jami
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ch.user_id=$1 AND ss.sana >= $2
            GROUP BY ch.tovar_nomi ORDER BY jami DESC LIMIT 5
        """, uid, _kun_boshi())
        if rows:
            t = "🏆 Bugun eng ko'p sotilgan:\n"
            for i, r in enumerate(rows, 1):
                t += f"  {i}. {r['nomi']} — {int(r['miqdor'])} ta ({_pul(r['jami'])})\n"
            return t.rstrip()
        return "ℹ️ Bugun hali sotuv yo'q."

    elif tur == "oxirgi_sotuv":
        rows = await conn.fetch("""
            SELECT klient_ismi, jami, sana
            FROM sotuv_sessiyalar
            WHERE user_id=$1 ORDER BY sana DESC LIMIT 3
        """, uid)
        if rows:
            t = "📋 Oxirgi sotuvlar:\n"
            for r in rows:
                t += f"  📅 {str(r['sana'])[:16]} — {r['klient_ismi'] or '?'} — {_pul(r['jami'])}\n"
            return t.rstrip()
        return "ℹ️ Hali sotuv yo'q."

    return None


# ═══════════════════════════════════════════════════════════════
#  4. ZARAR OGOHLANTIRISH — real-time
# ═══════════════════════════════════════════════════════════════

async def zarar_tekshir(conn, uid: int, tovarlar: list[dict]) -> list[dict]:
    """
    Sotish narxi < olish narxi → zarar!
    Sotuv tasdiqlashdan OLDIN tekshiriladi.
    """
    zararlilar = []
    for t in tovarlar:
        nomi = t.get("nomi", "")
        sotish = float(t.get("narx", 0))
        if sotish <= 0:
            continue

        row = await conn.fetchrow("""
            SELECT olish_narxi FROM tovarlar
            WHERE user_id=$1 AND lower(nomi) LIKE lower($2) AND olish_narxi > 0
            LIMIT 1
        """, uid, f"%{like_escape(nomi)}%")

        if row:
            olish = float(row["olish_narxi"] or 0)
            if olish > 0 and sotish < olish:
                zarar_foiz = round((olish - sotish) / olish * 100, 1)
                zararlilar.append({
                    "nomi": nomi,
                    "olish": olish,
                    "sotish": sotish,
                    "zarar": olish - sotish,
                    "zarar_foiz": zarar_foiz,
                })
    return zararlilar


def zarar_ogohlantirish_matn(zararlilar: list[dict]) -> str:
    """Zarar ogohlantirish xabari."""
    if not zararlilar:
        return ""
    t = "\n⚠️ *ZARAR OGOHLANTIRISH:*\n"
    for z in zararlilar:
        t += (f"  🔴 {z['nomi']}: sotish {_pul(z['sotish'])} < olish {_pul(z['olish'])} "
              f"(zarar: {_pul(z['zarar'])}, -{z['zarar_foiz']}%)\n")
    return t.rstrip()


# ═══════════════════════════════════════════════════════════════
#  5. SHABLONLAR — "Salimov odatiy"
# ═══════════════════════════════════════════════════════════════

async def shablon_olish(conn, uid: int, klient_ismi: str) -> Optional[dict]:
    """
    Klientning oxirgi sotuvini shablon sifatida olish.
    "Salimov odatiy" → oxirgi 3 sotuvdagi eng ko'p takrorlangan tovarlar.
    """
    # Oxirgi 3 ta sotuv sessiyasi
    sessiyalar = await conn.fetch("""
        SELECT id FROM sotuv_sessiyalar
        WHERE user_id=$1 AND lower(klient_ismi) LIKE lower($2)
        ORDER BY sana DESC LIMIT 3
    """, uid, f"%{like_escape(klient_ismi)}%")

    if not sessiyalar:
        return None

    sess_ids = [s["id"] for s in sessiyalar]

    # Bu sessiyalardagi tovarlar
    tovarlar = await conn.fetch("""
        SELECT tovar_nomi AS nomi,
               AVG(miqdor) AS miqdor,
               birlik,
               AVG(sotish_narxi) AS narx,
               COUNT(*) AS takror
        FROM chiqimlar
        WHERE sessiya_id = ANY($1)
        GROUP BY tovar_nomi, birlik
        ORDER BY takror DESC, AVG(miqdor) DESC
        LIMIT 10
    """, sess_ids)

    if not tovarlar:
        return None

    return {
        "klient": klient_ismi,
        "tovarlar": [
            {
                "nomi": t["nomi"],
                "miqdor": round(float(t["miqdor"] or 0)),
                "birlik": t["birlik"] or "dona",
                "narx": round(float(t["narx"] or 0)),
                "takror": int(t["takror"]),
            }
            for t in tovarlar
        ],
    }


def shablon_matn(d: dict) -> str:
    """Shablon ko'rsatish."""
    t = f"📋 *{d['klient']}* odatiy buyurtmasi:\n\n"
    for i, tv in enumerate(d["tovarlar"], 1):
        t += f"  {i}. {tv['nomi']} — {tv['miqdor']} {tv['birlik']}"
        if tv["narx"] > 0:
            t += f" × {_pul(tv['narx'])}"
        t += "\n"
    return t.rstrip()


SHABLON_SOZLAR = ("odatiy", "har doim", "doimiy", "odatdagi", "standart", 
                  "shu buyurtma", "oxirgi buyurtma")

def shablon_bormi(matn: str) -> bool:
    m = matn.lower().strip()
    return any(s in m for s in SHABLON_SOZLAR)


def shablon_klient_ajrat(matn: str) -> Optional[str]:
    """Matndan klient + odatiy ajratish. "Salimov odatiy" → "Salimov" """
    for s in SHABLON_SOZLAR:
        if s in matn.lower():
            idx = matn.lower().index(s)
            ism = matn[:idx].strip()
            if ism and len(ism) > 1:
                return ism
    return None


# ═══════════════════════════════════════════════════════════════
#  6. GURUHLI OVOZ — "5 klientga bir xil"
# ═══════════════════════════════════════════════════════════════

GURUH_PATTERN = re.compile(
    r'(\d+)\s*(?:ta\s+)?(?:klient|mijoz|odam)(?:ga|ning)?\s+(?:bir\s+xil|hammasiga|hammaga)',
    re.IGNORECASE
)

def guruhli_bormi(matn: str) -> bool:
    return bool(GURUH_PATTERN.search(matn))


def guruhli_ajrat(matn: str) -> dict:
    """
    "5 klientga bir xil 10 Ariel 45000" → {"soni": 5, "tovar_matn": "10 Ariel 45000"}
    """
    m = GURUH_PATTERN.search(matn)
    if not m:
        return {}
    soni = int(m.group(1))
    qolgan = matn[m.end():].strip()
    return {"soni": soni, "tovar_matn": qolgan}


# ═══════════════════════════════════════════════════════════════
#  7. TEZKOR TUGMALAR — eng ko'p ishlatiladigan
# ═══════════════════════════════════════════════════════════════

async def tezkor_tugmalar(conn, uid: int) -> dict:
    """
    Foydalanuvchining eng ko'p ishlatgan 4 ta tovar va 4 ta klientini qaytarish.
    Inline keyboard tugmalar uchun.
    """
    top_tovar_task = conn.fetch("""
        SELECT tovar_nomi AS nomi, COUNT(*) AS soni
        FROM chiqimlar WHERE user_id=$1
        GROUP BY tovar_nomi ORDER BY soni DESC LIMIT 4
    """, uid)

    top_klient_task = conn.fetch("""
        SELECT klient_ismi AS ism, COUNT(*) AS soni
        FROM sotuv_sessiyalar 
        WHERE user_id=$1 AND klient_ismi IS NOT NULL AND klient_ismi != ''
        GROUP BY klient_ismi ORDER BY soni DESC LIMIT 4
    """, uid)

    top_tovar = await top_tovar_task
    top_klient = await top_klient_task

    return {
        "tovarlar": [r["nomi"] for r in top_tovar if r.get("nomi")],
        "klientlar": [r["ism"] for r in top_klient if r.get("ism")],
    }


# ═══════════════════════════════════════════════════════════════
#  8. QOLDIQ TO'G'RILASH — "3 ta yo'qoldi", "2 ta singan"
# ═══════════════════════════════════════════════════════════════

QOLDIQ_TUZATISH_PATTERN = re.compile(
    r"(\S+?)(?:dan|ning)?\s+(\d+)\s*(?:ta|dona)?\s*"
    r"(yo[ʻ']qoldi|singan|buzildi|eskirdi|qaytarildi|chiqib ketdi|yo'qoldi)",
    re.IGNORECASE
)

def qoldiq_tuzatish_bormi(matn: str) -> bool:
    return bool(QOLDIQ_TUZATISH_PATTERN.search(matn))


def qoldiq_tuzatish_ajrat(matn: str) -> Optional[dict]:
    """
    "Ariel 3 ta yo'qoldi" → {"nomi": "Ariel", "miqdor": 3, "sabab": "yo'qoldi"}
    """
    m = QOLDIQ_TUZATISH_PATTERN.search(matn)
    if not m:
        return None
    return {
        "nomi": m.group(1).strip(),
        "miqdor": int(m.group(2)),
        "sabab": m.group(3).strip(),
    }


async def qoldiq_tuzatish(conn, uid: int, nomi: str, miqdor: int, sabab: str) -> dict:
    """Tovar qoldiqini kamaytirish + sababni saqlash."""
    tovar = await conn.fetchrow("""
        SELECT id, nomi, qoldiq FROM tovarlar
        WHERE user_id=$1 AND lower(nomi) LIKE lower($2) LIMIT 1
    """, uid, f"%{like_escape(nomi)}%")

    if not tovar:
        return {"ok": False, "xato": f"'{nomi}' topilmadi"}

    eski = int(tovar.get("qoldiq") or 0)
    yangi = max(eski - miqdor, 0)

    await conn.execute("""
        UPDATE tovarlar SET qoldiq = $2 WHERE id = $1
    """, tovar["id"], yangi)

    log.info("📦 Qoldiq tuzatish: %s %d → %d (%s)", tovar["nomi"], eski, yangi, sabab)

    return {
        "ok": True,
        "nomi": tovar["nomi"],
        "eski": eski,
        "yangi": yangi,
        "miqdor": miqdor,
        "sabab": sabab,
    }


def qoldiq_tuzatish_matn(d: dict) -> str:
    if not d.get("ok"):
        return f"❌ {d.get('xato', 'Xato')}"
    return (
        f"📦 *{d['nomi']}* qoldig'i tuzatildi:\n"
        f"  {d['eski']} → {d['yangi']} (-{d['miqdor']})\n"
        f"  📝 Sabab: {d['sabab']}"
    )


# ═══════════════════════════════════════════════════════════════
#  9. TOVAR ABC TAHLILI
# ═══════════════════════════════════════════════════════════════

async def tovar_abc(conn, uid: int) -> dict:
    """
    ABC tahlil — Pareto qoidasi:
    A = 80% sotuv beradigan tovarlar (diqqat kerak!)
    B = 15% sotuv
    C = 5% sotuv (o'chirib yuborsa bo'ladi)
    """
    rows = await conn.fetch("""
        SELECT ch.tovar_nomi AS nomi,
               SUM(ch.jami) AS jami,
               SUM(ch.miqdor) AS miqdor,
               SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor) AS foyda
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ss.sana >= NOW() - INTERVAL '30 days'
        GROUP BY ch.tovar_nomi
        ORDER BY jami DESC
    """, uid)

    if not rows:
        return {"a": [], "b": [], "c": [], "jami": 0}

    jami = sum(float(r["jami"] or 0) for r in rows)
    if jami <= 0:
        return {"a": [], "b": [], "c": [], "jami": 0}

    yig_ilgan = 0
    a, b, c = [], [], []
    for r in rows:
        tv_jami = float(r["jami"] or 0)
        foiz = tv_jami / jami * 100
        yig_ilgan += foiz
        item = {
            "nomi": r["nomi"],
            "jami": tv_jami,
            "miqdor": int(r["miqdor"] or 0),
            "foyda": float(r["foyda"] or 0),
            "foiz": round(foiz, 1),
        }
        if yig_ilgan <= 80:
            a.append(item)
        elif yig_ilgan <= 95:
            b.append(item)
        else:
            c.append(item)

    return {"a": a, "b": b, "c": c, "jami": jami}


def tovar_abc_matn(d: dict) -> str:
    """ABC tahlil formati."""
    if not d.get("a") and not d.get("b") and not d.get("c"):
        return "ℹ️ Hali yetarli sotuv ma'lumoti yo'q (30 kun)."

    t = "📊 TOVAR ABC TAHLILI (30 kun)\n"
    t += "━" * 24 + "\n\n"
    t += f"💰 Jami sotuv: {_pul(d['jami'])}\n\n"

    if d["a"]:
        t += f"🅰️ *A-tovarlar* ({len(d['a'])} ta = 80% sotuv):\n"
        for tv in d["a"][:5]:
            foyda_str = f" (+{_pul(tv['foyda'])})" if tv["foyda"] > 0 else ""
            t += f"  ⭐ {tv['nomi']} — {_pul(tv['jami'])} ({tv['foiz']}%){foyda_str}\n"
        if len(d["a"]) > 5:
            t += f"  ...va yana {len(d['a']) - 5} ta\n"

    if d["b"]:
        t += f"\n🅱️ *B-tovarlar* ({len(d['b'])} ta = 15% sotuv):\n"
        for tv in d["b"][:3]:
            t += f"  📦 {tv['nomi']} — {_pul(tv['jami'])} ({tv['foiz']}%)\n"
        if len(d["b"]) > 3:
            t += f"  ...va yana {len(d['b']) - 3} ta\n"

    if d["c"]:
        t += f"\n©️ *C-tovarlar* ({len(d['c'])} ta = 5% sotuv):\n"
        for tv in d["c"][:3]:
            t += f"  💤 {tv['nomi']} — {_pul(tv['jami'])} ({tv['foiz']}%)\n"
        if len(d["c"]) > 3:
            t += f"  ...va yana {len(d['c']) - 3} ta\n"

    t += "\n💡 A-tovarlarni doim omborda saqlang!"
    return t.rstrip()


# ═══════════════════════════════════════════════════════════════
#  UNIVERSAL BUYRUQ ANIQLASH
# ═══════════════════════════════════════════════════════════════

ABC_SOZLAR = ("abc tahlil", "abc analiz", "pareto", "tovar tahlil",
              "qaysi tovar muhim", "a b c", "abc")
SAVOL_SOZLAR = ("kecha", "oxirgi sotuv", "eng ko'p sotilgan", 
                "qoldiq", "nechta qoldi", "qancha qoldi")

def advanced_buyruq_aniqla(matn: str) -> Optional[str]:
    """Kengaytirilgan buyruq aniqlash."""
    m = matn.lower().strip()

    if qoldiq_tuzatish_bormi(matn):
        return "qoldiq_tuzatish"
    if shablon_bormi(matn):
        return "shablon"
    if guruhli_bormi(matn):
        return "guruhli"
    if tuzatish_bormi(matn):
        return "tuzatish"
    for s in ABC_SOZLAR:
        if s in m:
            return "abc_tahlil"
    if savol_turini_aniqla(matn):
        return "tabiiy_savol"
    if kontekst_bormi(matn):
        return "kontekst"
    return None
