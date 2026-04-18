"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — MUTAXASSIS MASLAHATCHI v1.0                                   ║
║                                                                          ║
║  Bot xuddi 20 yillik tajribali Bosh Buxgalter + Savdo Mutaxassisi      ║
║  kabi professional maslahat beradi:                                      ║
║                                                                          ║
║  📊 HISOB-KITOB MUTAXASSISI:                                           ║
║  - Qarz boshqaruvi (muddati, limit, xavf)                              ║
║  - Foyda tahlili (margin, markup, zarar xavfi)                          ║
║  - Oboroti (pul aylanmasi tezligi)                                     ║
║  - Solishtirma tahlil (oy/hafta/kun)                                    ║
║                                                                          ║
║  📦 TOVAR MUTAXASSISI:                                                  ║
║  - Qoldiq boshqaruvi (min/max, buyurtma nuqtasi)                       ║
║  - Narx strategiyasi (markup %, raqobat, chegirma)                     ║
║  - Assortiment tahlili (ABC, sezonlik)                                  ║
║  - Muddat va saqlash (xavfli tovarlar)                                  ║
║                                                                          ║
║  PROFESSIONAL TILDA — do'konchi tushunadi, ishonadi                     ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
from shared.utils import like_escape
import logging
from datetime import datetime
from decimal import Decimal

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")

def _pul(v) -> str:
    try: return f"{Decimal(str(v or 0)):,.0f}"
    except Exception: return "0"

def _foiz(v) -> str:
    return f"{v:+.1f}%" if v else "0%"

def _bugun():
    return datetime.now(TZ).date()

def _kun_boshi(d=None):
    d = d or _bugun()
    return TZ.localize(datetime.combine(d, datetime.min.time()))


# ═══════════════════════════════════════════════════════════════
#  TOVAR PROFESSIONAL TAHLILI
# ═══════════════════════════════════════════════════════════════

async def tovar_ekspert_tahlil(conn, uid: int, tovar_nomi: str, tovar_row: dict = None) -> dict:
    """Tovar bo'yicha professional tahlil."""
    nom = tovar_nomi.strip().strip('"').strip("'").strip()
    
    if tovar_row:
        tovar = dict(tovar_row)
    else:
        tovar = await conn.fetchrow("""
            SELECT id, nomi, olish_narxi, qoldiq, birlik, min_qoldiq
            FROM tovarlar WHERE user_id=$1 AND lower(nomi) LIKE lower($2)
            ORDER BY qoldiq DESC NULLS LAST LIMIT 1
        """, uid, f"%{like_escape(nom)}%")
        if not tovar:
            tovar = await conn.fetchrow("""
                SELECT id, nomi, olish_narxi, qoldiq, birlik, min_qoldiq
                FROM tovarlar WHERE user_id=$1 AND nomi ILIKE $2 LIMIT 1
            """, uid, f"%{like_escape(nom)}%")
        if not tovar:
            return {"topildi": False, "nomi": tovar_nomi}
        tovar = dict(tovar)

    tovar = dict(tovar)
    tid = tovar["id"]

    # KETMA-KET — asyncpg bitta conn da parallel ishlamaydi
    oy_boshi = _kun_boshi(_bugun().replace(day=1))

    sotuv_stat_task = conn.fetchrow("""
        SELECT COUNT(*) AS sotuv_soni,
               SUM(ch.miqdor) AS jami_miqdor,
               SUM(ch.jami) AS jami_summa,
               AVG(ch.sotish_narxi) AS ort_narx,
               MIN(ch.sotish_narxi) AS min_narx,
               MAX(ch.sotish_narxi) AS max_narx,
               SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor) AS jami_foyda
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ch.tovar_id=$2 AND ss.sana >= $3
    """, uid, tid, oy_boshi)

    kunlik_sotuv_task = conn.fetchval("""
        SELECT COALESCE(AVG(kunlik), 0) FROM (
            SELECT DATE(ss.sana) AS kun, SUM(ch.miqdor) AS kunlik
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ch.user_id=$1 AND ch.tovar_id=$2
              AND ss.sana >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(ss.sana)
        ) sub
    """, uid, tid)

    top_klientlar_task = conn.fetch("""
        SELECT ch.klient_ismi AS ism, SUM(ch.miqdor) AS miqdor, SUM(ch.jami) AS jami
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ch.tovar_id=$2 AND ss.sana >= $3
        GROUP BY ch.klient_ismi ORDER BY jami DESC LIMIT 3
    """, uid, tid, oy_boshi)

    oxirgi_kirim_task = conn.fetchrow("""
        SELECT miqdor, olish_narxi, sana
        FROM kirimlar WHERE user_id=$1 AND tovar_id=$2
        ORDER BY sana DESC LIMIT 1
    """, uid, tid)

    otgan_oy_task = conn.fetchval("""
        SELECT COALESCE(SUM(ch.miqdor), 0)
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id=$1 AND ch.tovar_id=$2
          AND ss.sana >= $3 - INTERVAL '30 days' AND ss.sana < $3
    """, uid, tid, oy_boshi)

    sotuv_stat = await sotuv_stat_task
    kunlik_sotuv = await kunlik_sotuv_task
    top_klientlar = await top_klientlar_task
    oxirgi_kirim = await oxirgi_kirim_task
    otgan_oy = await otgan_oy_task

    olish = float(tovar.get("olish_narxi") or 0)
    qoldiq = int(tovar.get("qoldiq") or 0)
    kunlik = float(kunlik_sotuv or 0)
    jami_miqdor = float(sotuv_stat["jami_miqdor"] or 0) if sotuv_stat else 0
    ort_narx = float(sotuv_stat["ort_narx"] or 0) if sotuv_stat else 0

    # Necha kunga yetadi
    kunlar_qoldi = round(qoldiq / kunlik) if kunlik > 0 else 999

    # Markup %
    markup = round((ort_narx - olish) / olish * 100, 1) if olish > 0 and ort_narx > 0 else 0

    # O'tgan oy bilan solishtirish
    otgan = float(otgan_oy or 0)
    ozgarish = round((jami_miqdor - otgan) / otgan * 100, 1) if otgan > 0 else 0

    return {
        "topildi": True,
        "nomi": tovar["nomi"],
        "olish_narxi": olish,
        "qoldiq": qoldiq,
        "birlik": tovar.get("birlik", "dona"),
        "min_qoldiq": int(tovar.get("min_qoldiq") or 0),
        "sotuv_soni": int(sotuv_stat["sotuv_soni"] or 0) if sotuv_stat else 0,
        "jami_miqdor": jami_miqdor,
        "jami_summa": float(sotuv_stat["jami_summa"] or 0) if sotuv_stat else 0,
        "ort_narx": round(ort_narx),
        "min_narx": float(sotuv_stat["min_narx"] or 0) if sotuv_stat else 0,
        "max_narx": float(sotuv_stat["max_narx"] or 0) if sotuv_stat else 0,
        "jami_foyda": float(sotuv_stat["jami_foyda"] or 0) if sotuv_stat else 0,
        "markup": markup,
        "kunlik_sotuv": round(kunlik, 1),
        "kunlar_qoldi": kunlar_qoldi,
        "otgan_oy_miqdor": otgan,
        "ozgarish": ozgarish,
        "top_klientlar": [
            {"ism": r["ism"], "miqdor": float(r["miqdor"] or 0), "jami": float(r["jami"] or 0)}
            for r in top_klientlar
        ],
        "oxirgi_kirim": {
            "miqdor": float(oxirgi_kirim["miqdor"] or 0),
            "narx": float(oxirgi_kirim["olish_narxi"] or 0),
            "sana": str(oxirgi_kirim["sana"] or "")[:10],
        } if oxirgi_kirim else None,
    }


def tovar_ekspert_matn(d: dict) -> str:
    """Professional tovar tahlili — mutaxassis uslubida."""
    if not d.get("topildi"):
        return f"📦 '{d.get('nomi', '?')}' tovarini topolmadim. Nomini aniqroq ayting."

    t = f"📦 *{d['nomi']}* — PROFESSIONAL TAHLIL\n"
    t += "━" * 28 + "\n\n"

    # OMBOR HOLATI
    qoldiq = d["qoldiq"]
    kunlik = d["kunlik_sotuv"]
    kunlar = d["kunlar_qoldi"]

    if kunlar <= 3:
        t += "🔴 *SHOSHILINCH BUYURTMA KERAK!*\n"
        t += f"   Qoldiq: {qoldiq} {d['birlik']} — faqat {kunlar} kunga yetadi!\n"
        if kunlik > 0:
            t += f"   Kuniga {kunlik:.0f} {d['birlik']} sotiladi\n"
            tavsiya_miqdor = round(kunlik * 14)  # 2 haftalik
            t += f"   💡 Tavsiya: {tavsiya_miqdor} {d['birlik']} buyurtma bering\n"
    elif kunlar <= 7:
        t += f"🟡 Qoldiq: {qoldiq} {d['birlik']} — {kunlar} kunga yetadi\n"
        t += "   Buyurtma berishni rejalashtiring\n"
    else:
        t += f"🟢 Qoldiq: {qoldiq} {d['birlik']} — {kunlar} kunga yetadi ✅\n"

    # NARX VA FOYDA
    t += "\n💰 *NARX TAHLILI:*\n"
    if d["olish_narxi"] > 0:
        t += f"   Olish: {_pul(d['olish_narxi'])}\n"
    if d["ort_narx"] > 0:
        t += f"   O'rtacha sotish: {_pul(d['ort_narx'])}\n"
        if d["min_narx"] != d["max_narx"]:
            t += f"   Diapazon: {_pul(d['min_narx'])} — {_pul(d['max_narx'])}\n"

    if d["markup"] > 0:
        if d["markup"] < 10:
            t += f"   🔴 Markup: {d['markup']}% — *JUDA PAST!* Narxni oshiring\n"
        elif d["markup"] < 20:
            t += f"   🟡 Markup: {d['markup']}% — yetarli, lekin oshirsa bo'ladi\n"
        else:
            t += f"   🟢 Markup: {d['markup']}% — yaxshi foyda\n"
    elif d["olish_narxi"] > 0 and d["ort_narx"] > 0 and d["ort_narx"] <= d["olish_narxi"]:
        t += "   🔴 *ZARAR!* Sotish narxi olish narxidan past!\n"

    # SOTUV DINAMIKASI
    if d["sotuv_soni"] > 0:
        t += "\n📊 *SHU OY SOTUV:*\n"
        t += f"   {d['sotuv_soni']} ta sotuv, {d['jami_miqdor']:.0f} {d['birlik']}\n"
        t += f"   Jami: {_pul(d['jami_summa'])}\n"
        if d["jami_foyda"] > 0:
            t += f"   Sof foyda: +{_pul(d['jami_foyda'])}\n"

        if d["ozgarish"] != 0:
            belgi = "📈" if d["ozgarish"] > 0 else "📉"
            t += f"   {belgi} O'tgan oyga nisbatan: {_foiz(d['ozgarish'])}\n"

    # TOP KLIENTLAR
    if d.get("top_klientlar"):
        t += "\n👥 *ENG KO'P SOTIB OLGANLAR:*\n"
        for i, kl in enumerate(d["top_klientlar"][:3], 1):
            t += f"   {i}. {kl['ism']} — {kl['miqdor']:.0f} {d['birlik']} ({_pul(kl['jami'])})\n"

    # OXIRGI KIRIM
    if d.get("oxirgi_kirim"):
        ki = d["oxirgi_kirim"]
        t += f"\n📥 Oxirgi kirim: {ki['sana']} — {ki['miqdor']:.0f} {d['birlik']}, {_pul(ki['narx'])}/dona\n"

    # MUTAXASSIS TAVSIYASI
    t += "\n" + _tovar_tavsiya(d)

    return t.rstrip()


def _tovar_tavsiya(d: dict) -> str:
    """Professional mutaxassis tavsiyasi."""
    tavsiyalar = []

    if d["kunlar_qoldi"] <= 3:
        tavsiyalar.append("🚨 Zudlik bilan buyurtma bering — ombor tugamoqda!")

    if d.get("markup", 0) > 0 and d["markup"] < 10:
        tavsiyalar.append(f"💡 Sotish narxini oshiring — {d['markup']}% margin juda past. "
                          f"Kamida 15-20% bo'lishi kerak.")

    if d.get("ozgarish", 0) > 30:
        tavsiyalar.append("📈 Bu tovar o'sish trendida — ko'proq olib qo'ying!")
    elif d.get("ozgarish", 0) < -30:
        tavsiyalar.append("📉 Sotuv tushyapti — narxni tushiring yoki aksiya qiling.")

    if d.get("olish_narxi", 0) > 0 and d.get("ort_narx", 0) > 0:
        if d["ort_narx"] <= d["olish_narxi"]:
            tavsiyalar.append("⛔ Bu tovarni ZARAR GA sotyapsiz! Narxni DARHOL oshiring.")

    if not tavsiyalar:
        if d.get("sotuv_soni", 0) > 10:
            tavsiyalar.append("✅ Bu tovar yaxshi ishlayapti — shu tempni ushlab turing.")
        else:
            tavsiyalar.append("ℹ️ Hali kam ma'lumot — bir necha hafta kuzating.")

    return "💡 *MUTAXASSIS TAVSIYASI:*\n" + "\n".join(f"   {t}" for t in tavsiyalar)


# ═══════════════════════════════════════════════════════════════
#  KLIENT PROFESSIONAL TAHLILI
# ═══════════════════════════════════════════════════════════════

async def klient_ekspert_tahlil(conn, uid: int, klient_ismi: str, klient_row: dict = None) -> dict:
    """Klient bo'yicha professional tahlil."""
    nom = klient_ismi.strip().strip('"').strip("'").strip()
    
    if klient_row:
        klient = dict(klient_row)
    else:
        klient = await conn.fetchrow("""
            SELECT id, user_id, ism, telefon, manzil, eslatma, kredit_limit, jami_sotib, yaratilgan FROM klientlar
            WHERE user_id=$1 AND lower(ism) LIKE lower($2)
            ORDER BY jami_sotib DESC NULLS LAST LIMIT 1
        """, uid, f"%{like_escape(nom)}%")
        if not klient:
            klient = await conn.fetchrow("""
                SELECT id, user_id, ism, telefon, manzil, eslatma, kredit_limit, jami_sotib, yaratilgan FROM klientlar
                WHERE user_id=$1 AND ism ILIKE $2
                ORDER BY jami_sotib DESC NULLS LAST LIMIT 1
            """, uid, f"%{like_escape(nom)}%")
        if not klient:
            return {"topildi": False, "ism": klient_ismi}
        klient = dict(klient)
    kid = klient["id"]

    sotuv_task = conn.fetchrow("""
        SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami,
               COALESCE(AVG(jami), 0) AS ort_chek,
               MIN(sana) AS birinchi, MAX(sana) AS oxirgi
        FROM sotuv_sessiyalar WHERE user_id=$1 AND klient_id=$2
    """, uid, kid)

    qarz_task = conn.fetchval("""
        SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
        WHERE user_id=$1 AND klient_id=$2 AND yopildi=FALSE
    """, uid, kid)

    muddati_otgan_task = conn.fetchval("""
        SELECT COUNT(*) FROM qarzlar
        WHERE user_id=$1 AND klient_id=$2 AND yopildi=FALSE
          AND muddat < NOW() AND qolgan > 0
    """, uid, kid)

    top_tovar_task = conn.fetch("""
        SELECT tovar_nomi AS nomi, SUM(miqdor) AS miqdor, SUM(jami) AS jami
        FROM chiqimlar WHERE user_id=$1 AND klient_id=$2
        GROUP BY tovar_nomi ORDER BY jami DESC LIMIT 5
    """, uid, kid)

    oylik_trend_task = conn.fetch("""
        SELECT DATE_TRUNC('month', sana) AS oy, SUM(jami) AS jami
        FROM sotuv_sessiyalar WHERE user_id=$1 AND klient_id=$2
          AND sana >= NOW() - INTERVAL '3 months'
        GROUP BY oy ORDER BY oy
    """, uid, kid)

    sotuv = await sotuv_task
    qarz = await qarz_task
    muddati_otgan = await muddati_otgan_task
    top_tovar = await top_tovar_task
    oylik = await oylik_trend_task

    jami_sotuv = float(sotuv["jami"] or 0)
    aktiv_qarz = float(qarz or 0)

    # Klient qiymati va xavf darajasi
    if muddati_otgan and int(muddati_otgan) > 0:
        xavf = "yuqori"
    elif aktiv_qarz > jami_sotuv * 0.3:
        xavf = "o'rta"
    else:
        xavf = "past"

    return {
        "topildi": True,
        "ism": klient.get("ism", ""),
        "telefon": klient.get("telefon", ""),
        "sotuv_soni": int(sotuv["soni"] or 0),
        "jami_sotuv": jami_sotuv,
        "ort_chek": float(sotuv["ort_chek"] or 0),
        "birinchi_sotuv": str(sotuv["birinchi"] or "")[:10],
        "oxirgi_sotuv": str(sotuv["oxirgi"] or "")[:10],
        "aktiv_qarz": aktiv_qarz,
        "muddati_otgan": int(muddati_otgan or 0),
        "xavf": xavf,
        "kredit_limit": float(klient.get("kredit_limit") or 0),
        "top_tovar": [
            {"nomi": r["nomi"], "miqdor": float(r["miqdor"] or 0), "jami": float(r["jami"] or 0)}
            for r in top_tovar
        ],
        "oylik_trend": [
            {"oy": str(r["oy"] or "")[:7], "jami": float(r["jami"] or 0)}
            for r in oylik
        ],
    }


def klient_ekspert_matn(d: dict) -> str:
    """Professional klient tahlili."""
    if not d.get("topildi"):
        return f"👤 '{d.get('ism', '?')}' klientini topolmadim."

    t = f"👤 *{d['ism']}* — PROFESSIONAL TAHLIL\n"
    t += "━" * 28 + "\n\n"

    # XAVF DARAJASI
    xavf_map = {
        "yuqori": "🔴 XAVF: YUQORI — muddati o'tgan qarzlar bor!",
        "o'rta": "🟡 XAVF: O'RTA — qarz/sotuv nisbati yuqori",
        "past": "🟢 XAVF: PAST — ishonchli klient ✅",
    }
    t += f"{xavf_map.get(d['xavf'], '')}\n\n"

    # SOTUV STATISTIKASI
    t += "📊 *SOTUV TARIXI:*\n"
    t += f"   Jami: {_pul(d['jami_sotuv'])} ({d['sotuv_soni']} ta sotuv)\n"
    t += f"   O'rtacha chek: {_pul(d['ort_chek'])}\n"
    if d.get("birinchi_sotuv"):
        t += f"   Hamkorlik: {d['birinchi_sotuv']} dan beri\n"

    # QARZ HOLATI
    if d["aktiv_qarz"] > 0:
        t += "\n💳 *QARZ HOLATI:*\n"
        t += f"   Aktiv qarz: {_pul(d['aktiv_qarz'])}\n"
        if d["muddati_otgan"] > 0:
            t += f"   🔴 {d['muddati_otgan']} ta qarz muddati o'tgan!\n"
        if d["kredit_limit"] > 0:
            foiz = round(d["aktiv_qarz"] / d["kredit_limit"] * 100, 1)
            t += f"   Kredit limit: {_pul(d['kredit_limit'])} ({foiz}% ishlatilgan)\n"
    else:
        t += "\n✅ Qarz yo'q — a'lo klient!\n"

    # TOP TOVARLAR
    if d.get("top_tovar"):
        t += "\n📦 *ENG KO'P OLGAN TOVARLAR:*\n"
        for i, tv in enumerate(d["top_tovar"][:5], 1):
            t += f"   {i}. {tv['nomi']} — {tv['miqdor']:.0f} dona ({_pul(tv['jami'])})\n"

    # OYLIK TREND
    if d.get("oylik_trend") and len(d["oylik_trend"]) > 1:
        t += "\n📈 *OYLIK TREND:*\n"
        for oy in d["oylik_trend"]:
            t += f"   {oy['oy']}: {_pul(oy['jami'])}\n"

    # MUTAXASSIS TAVSIYASI
    t += "\n" + _klient_tavsiya(d)

    return t.rstrip()


def _klient_tavsiya(d: dict) -> str:
    """Klient bo'yicha professional tavsiya."""
    tavsiyalar = []

    if d["xavf"] == "yuqori":
        tavsiyalar.append("⛔ Bu klientga yangi qarzga sotuv BERMA. Avval eski qarzni undiring.")
        if d["muddati_otgan"] > 2:
            tavsiyalar.append("📞 Darhol aloqaga chiqing — qarz holati jiddiy.")
    elif d["xavf"] == "o'rta":
        tavsiyalar.append("⚠️ Qarz limitini belgilang. Masalan: "
                          f"{_pul(d['jami_sotuv'] * 0.2)} (sotuv ning 20%)")

    if d["ort_chek"] > 0 and d["sotuv_soni"] > 5:
        if d["ort_chek"] > 1_000_000:
            tavsiyalar.append(f"🏆 Bu VIP klient! O'rtacha chek {_pul(d['ort_chek'])}. "
                              "Shaxsiy chegirma taklif qiling.")
        elif d["ort_chek"] < 100_000:
            tavsiyalar.append("💡 Kichik cheklar — katta qadoqda taklif qiling (karobka, blok).")

    if not tavsiyalar:
        tavsiyalar.append("✅ Yaxshi klient — hamkorlikni davom ettiring.")

    return "💡 *MUTAXASSIS TAVSIYASI:*\n" + "\n".join(f"   {t}" for t in tavsiyalar)


# ═══════════════════════════════════════════════════════════════
#  ANIQLASH — "Ariel haqida", "Salimov haqida"
# ═══════════════════════════════════════════════════════════════

TAHLIL_SOZLAR = ("haqida", "tahlil", "ko'rsat", "batafsil", "analiz",
                 "ekspert", "professional", "подробно", "анализ")

def ekspert_sorov_bormi(matn: str) -> bool:
    m = matn.lower().strip()
    return any(s in m for s in TAHLIL_SOZLAR)


def ekspert_nom_ajrat(matn: str) -> str | None:
    """Matndan tovar yoki klient nomini ajratish."""
    for s in TAHLIL_SOZLAR:
        if s in matn.lower():
            idx = matn.lower().index(s)
            ism = matn[:idx].strip()
            if ism and len(ism) > 1:
                # Suffix tozalash
                for sfx in ("ning", "ni", "ga", "dan"):
                    if ism.lower().endswith(sfx) and len(ism) > len(sfx) + 2:
                        ism = ism[:-len(sfx)]
                return ism
    return None
