"""Formatlash va ESC/POS printer"""
from __future__ import annotations
from datetime import datetime
import pytz

from shared.receipt import format_qaytarish_receipt, receipt_text_80mm
from shared.services.thermal_receipt import format_thermal_receipt

TZ       = pytz.timezone("Asia/Tashkent")
KENGLIK  = 48   # 80mm thermal bilan Telegram chek_u bir xil (ustunlar)
OY_NOMI  = [
    "", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
]
SAHIFA   = 15   # pagination uchun


from shared.utils.hisob import pul  # Decimal aniqlikdagi pul formatlash


def _m(s: str) -> str:
    """Markazlash"""
    return s[:KENGLIK].center(KENGLIK)


def _cs(chap: str, ung: str) -> str:
    """Chap-o'ng hizalash"""
    bo_sh = KENGLIK - len(chap) - len(ung)
    return chap + " " * max(bo_sh, 1) + ung


def _hozir() -> str:
    return datetime.now(TZ).strftime("%d.%m.%Y  %H:%M")


def chek_md(matn: str) -> str:
    """Telegram monospace formati"""
    return "```\n" + matn.replace("`", "'") + "\n```"


# ─── CHEKlar ─────────────────────────────────────────────

def sotuv_cheki(data: dict, dokon: str) -> str:
    """Telegram monospace — 80mm thermal .txt va preview bilan bir xil layout."""
    return receipt_text_80mm(data, dokon)


def kirim_cheki(data: dict, dokon: str) -> str:
    d = dict(data)
    d["amal"] = "kirim"
    return format_thermal_receipt(d, dokon, width_mm=80)


def qaytarish_cheki(natijalar: list[dict], dokon: str) -> str:
    """
    natijalar: [{tovar, klient, qaytarildi, birlik, narx, summa}, ...]
    """
    return format_qaytarish_receipt(natijalar, dokon, width_mm=80)


# ─── Hisobot matnlari ─────────────────────────────────────

def kunlik_matn(d: dict) -> str:
    t  = f"📊 *KUNLIK HISOBOT*\n📅 {d['kun']}\n\n"
    t += f"📥 Kirim   : {pul(d['kr_jami'])} ({d['kr_n']} ta)\n"
    t += f"📤 Sotuv   : {pul(d['ch_jami'])} ({d['ch_n']} ta)\n"
    t += f"✅ To'landi: {pul(d['tolangan'])}\n"
    if float(d.get("yangi_qarz", 0)) > 0:
        t += f"⚠️ Yangi qarz: {pul(d['yangi_qarz'])}\n"
    t += f"\n💹 *SOF FOYDA: {pul(d['foyda'])}*"
    if float(d.get("jami_qarz", 0)) > 0:
        t += f"\n\n⚠️ Jami qarz: {pul(d['jami_qarz'])}"
    if d.get("by_kat"):
        t += "\n\n📁 *Kategoriyalar:*\n"
        for k in d["by_kat"][:6]:
            t += f"  • {k['kategoriya']}: {pul(k['j'])} ({k['n']} ta)\n"
    t += "\n\n💡 /tahlil — AI maslahat | /kpi — Samaradorlik"
    return t.rstrip()


def oylik_matn(d: dict) -> str:
    oy_nom = OY_NOMI[d["oy"]]
    t  = f"📊 *OYLIK HISOBOT*\n📅 {oy_nom} {d['yil']}\n\n"
    t += f"📥 Kirim   : {pul(d['kr_jami'])} ({d['kr_n']} ta)\n"
    t += f"📤 Sotuv   : {pul(d['ch_jami'])} ({d['ch_n']} ta)\n"
    t += f"✅ To'landi: {pul(d['tolangan'])}\n"
    if float(d.get("yangi_qarz", 0)) > 0:
        t += f"⚠️ Yangi qarz: {pul(d['yangi_qarz'])}\n"
    t += f"\n💹 *SOF FOYDA: {pul(d['foyda'])}*"
    if d.get("top5"):
        t += "\n\n🏆 *Eng ko'p sotilgan tovarlar:*\n"
        for i, r in enumerate(d["top5"], 1):
            t += f"  {i}. {r['tovar_nomi']} — {pul(r['j'])}\n"
    if float(d.get("jami_qarz", 0)) > 0:
        t += f"\n⚠️ Jami qarz: {pul(d['jami_qarz'])}"
    return t.rstrip()


def foyda_matn(d: dict) -> str:
    oy_nom = OY_NOMI[d["oy"]]
    t = f"💹 *FOYDA TAHLILI*\n📅 {oy_nom} {d['yil']}\n\n"
    if not d.get("rows"):
        return t + "_Ma'lumot yo'q._"
    for r in d["rows"]:
        foyda   = float(r.get("foyda",   0) or 0)
        daromad = float(r.get("daromad", 0) or 0)
        t += f"{'📈' if foyda > 0 else '📉'} *{r['tovar_nomi']}*\n"
        t += f"   Daromad: {pul(daromad)}  |  Foyda: *{pul(foyda)}*\n\n"
    return t.rstrip()


def klient_hisobi_matn(data: dict) -> str:
    k = data["klient"]
    t  = f"👤 *{k['ism']}* — To'liq hisob\n\n"
    t += f"📦 Jami sotuv     : {pul(data['jami_sotuv'])}\n"
    t += f"✅ To'langan       : {pul(data['jami_tolangan'])}\n"
    t += f"↩️ Qaytarilgan     : {pul(data['jami_qaytarilgan'])}\n"
    if float(data["faol_qarz"]) > 0:
        t += f"⚠️ Qolgan qarz     : *{pul(data['faol_qarz'])}*\n"
    else:
        t += "💚 Qolgan qarz     : yo'q\n"
    t += f"🛒 Sotuvlar soni  : {data['sotuv_soni']} ta\n"
    return t.rstrip()


def haftalik_matn(d: dict) -> str:
    t  = "📊 *HAFTALIK HISOBOT* (7 kun)\n\n"
    t += f"📥 Kirim   : {pul(d['kr_jami'])} ({d['kr_n']} ta)\n"
    t += f"📤 Sotuv   : {pul(d['ch_jami'])} ({d['ch_n']} ta)\n"
    t += f"✅ To'landi: {pul(d['tolangan'])}\n"
    if float(d.get('yangi_qarz',0)) > 0:
        t += f"⚠️ Yangi qarz: {pul(d['yangi_qarz'])}\n"
    t += f"\n💹 *SOF FOYDA: {pul(d['foyda'])}*"
    if d.get('top3'):
        t += "\n\n🏆 *Top 3 tovar:*\n"
        for i, r in enumerate(d['top3'], 1):
            t += f"  {i}. {r['tovar_nomi']} — {pul(r['j'])}\n"
    if float(d.get('jami_qarz',0)) > 0:
        t += f"\n⚠️ Jami qarz: {pul(d['jami_qarz'])}"
    return t.rstrip()


def klient_tarix_matn(data: dict) -> str:
    k = data['klient']
    t  = f"👤 *{k['ism']}* — Sotuvlar tarixi\n\n"
    t += f"📦 Jami sotuv: {pul(data['jami_sotuv'])}\n"
    if float(data['aktiv_qarz']) > 0:
        t += f"⚠️ Qolgan qarz: *{pul(data['aktiv_qarz'])}*\n"
    else:
        t += "💚 Qarz: yo'q\n"
    t += f"🛒 Sotuvlar: {data['sotuv_soni']} ta\n\n"
    if data.get('sotuvlar'):
        t += "📋 *Oxirgi sotuvlar:*\n"
        for s in data['sotuvlar'][:5]:
            sana = str(s['sana'])[:10]
            t += f"  • {sana} — {pul(s['jami'])}"
            if float(s['qarz']) > 0:
                t += f" (qarz: {pul(s['qarz'])})"
            t += "\n"
            if s.get('tovarlar_str'):
                t += f"    _{s['tovarlar_str'][:60]}_\n"
    return t.rstrip()
