"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — OCR POST-PROCESSOR                           ║
║                                                                  ║
║  Vision AI o'qigandan KEYIN ishlaydi:                           ║
║  1. Tovar nomi + miqdor + narx ajratish                         ║
║  2. "5×45000" formatini aniqlash                                ║
║  3. Miqdor × narx = jami tekshirish                             ║
║  4. Umumiy xatolarni tuzatish                                   ║
║  5. Telegram uchun formatlash                                    ║
║                                                                  ║
║  FORMAT TANISH:                                                  ║
║  "Duxi Royal 2×50000"                                           ║
║  "Ariel 3kg  10 × 45000  450000"                                ║
║  "Nivea krem  1x45000"                                          ║
║  "П-10×1450000"                                                 ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import re
import logging
from typing import Optional

log = logging.getLogger(__name__)

# Raqamlarni tozalash
def _raqam(s: str) -> float:
    """Matndan raqam olish: "45,000" → 45000, "1 080 000" → 1080000."""
    if not s:
        return 0
    s = s.strip().replace(" ", "").replace(",", "").replace(".", "")
    s = re.sub(r"[^\d]", "", s)
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0


# ═══ QATOR PATTERNLARI ═══
# Har xil format: "tovar 5×45000", "tovar 5x45000 225000", "5 dona 45000"

_PATTERNS = [
    # Pattern 1: "nomi  miqdor×narx  jami"
    re.compile(
        r"^(.+?)\s+"
        r"(\d+)\s*[×xXхХ*]\s*"
        r"(\d+)"                    # narx (faqat raqamlar, bo'shliksiz)
        r"(?:\s+(\d+))?"            # ixtiyoriy jami
        r"\s*$"
    ),
    # Pattern 2: "nomi  miqdor  narx  jami"
    re.compile(
        r"^(.+?)\s+"
        r"(\d+)\s+"
        r"(\d+)\s+"
        r"(\d+)"
        r"\s*$"
    ),
    # Pattern 3: "raqam. nomi  miqdor×narx"
    re.compile(
        r"^\d+[\.\)]\s*"
        r"(.+?)\s+"
        r"(\d+)\s*[×xXхХ*]\s*"
        r"(\d+)"
        r"(?:\s+(\d+))?"
        r"\s*$"
    ),
    # Pattern 4: "KOD-miqdor×narx"
    re.compile(
        r"^([A-Za-zА-Яа-яЎўҚқҒғҲҳ\w]+)"
        r"[\s\-\.]*"
        r"(\d+)\s*[×xXхХ*]\s*"
        r"(\d+)"
        r"\s*$"
    ),
]


def qator_parse(qator: str) -> dict | None:
    """Bitta qatordan tovar ma'lumotini ajratish."""
    qator = qator.strip()
    if not qator or len(qator) < 3:
        return None

    # Sarlavha/bo'sh qatorlarni o'tkazish
    skip_words = ["итого", "итог", "всего", "total", "jami", "дата",
                   "кому", "адрес", "тел", "баланс", "долг", "отпустил",
                   "принял", "доставщик", "товар сдал", "к оплате",
                   "наименование", "кол-во", "цена", "сумма", "───", "━━━"]
    if any(w in qator.lower() for w in skip_words):
        return None

    for pattern in _PATTERNS:
        m = pattern.match(qator)
        if m:
            groups = m.groups()
            nomi = groups[0].strip()
            miqdor = _raqam(groups[1])
            narx = _raqam(groups[2])
            jami_raw = _raqam(groups[3]) if len(groups) > 3 and groups[3] else 0

            if miqdor <= 0 or narx <= 0:
                continue

            # Jami hisoblash va tekshirish
            jami_hisob = miqdor * narx
            
            if jami_raw > 0:
                # Berilgan jami va hisoblangan jami solishtiriladi
                xato_foiz = abs(jami_raw - jami_hisob) / max(jami_hisob, 1) * 100
                if xato_foiz > 5:
                    # Katta farq — ehtimol narx bitta tovar uchun emas, jami
                    if abs(jami_raw - narx * miqdor) < 100:
                        jami = jami_raw
                    else:
                        jami = jami_hisob
                        log.debug("OCR math xato: %s — %s×%s=%s vs %s",
                                  nomi, miqdor, narx, jami_hisob, jami_raw)
                else:
                    jami = jami_raw
            else:
                jami = jami_hisob

            # Nomi tozalash
            nomi = re.sub(r"^\d+[\.\)]\s*", "", nomi)  # "1. Ariel" → "Ariel"
            nomi = re.sub(r"[\-\s]+$", "", nomi)
            if len(nomi) < 1:
                continue

            return {
                "nomi": nomi[:60],
                "miqdor": miqdor,
                "narx": narx,
                "jami": jami,
                "jami_tekshirildi": jami_raw > 0,
            }

    return None


def ocr_matn_parse(matn: str) -> dict:
    """
    To'liq OCR matnidan tovarlar ro'yxatini ajratish.
    
    Qaytaradi:
    {
        "tovarlar": [{nomi, miqdor, narx, jami}, ...],
        "jami_summa": 1234000,
        "tovarlar_soni": 15,
        "xatolar": [...],
        "meta": {klient, sana, ...}
    }
    """
    tovarlar = []
    xatolar = []
    meta = {"klient": "", "sana": "", "tp": "", "qarz": ""}

    for qator in matn.split("\n"):
        qator = qator.strip()
        if not qator:
            continue

        # META ma'lumotlari
        ql = qator.lower()
        if any(w in ql for w in ["кому:", "oluvchi:", "получатель:"]):
            meta["klient"] = qator.split(":", 1)[1].strip() if ":" in qator else qator
            continue
        if any(w in ql for w in ["дата:", "sana:", "📅"]):
            meta["sana"] = qator.split(":", 1)[1].strip() if ":" in qator else qator
            continue
        if any(w in ql for w in ["долг", "qarz", "баланс"]):
            meta["qarz"] = qator
            continue

        # Tovar qatori
        parsed = qator_parse(qator)
        if parsed:
            tovarlar.append(parsed)

    jami = sum(t["jami"] for t in tovarlar)

    return {
        "tovarlar": tovarlar,
        "jami_summa": jami,
        "tovarlar_soni": len(tovarlar),
        "xatolar": xatolar,
        "meta": meta,
    }


def ocr_natija_matn(data: dict, fayl_nomi: str = "") -> str:
    """Bot uchun OCR natijasi matni."""
    if not data["tovarlar"]:
        return "📷 Tovar ma'lumoti topilmadi. Rasmni aniqroq yuboring."

    m = "📷 *OCR NATIJASI*\n━━━━━━━━━━━━━━━━━━━━━\n"

    meta = data.get("meta", {})
    if meta.get("klient"):
        m += f"👤 {meta['klient']}\n"
    if meta.get("sana"):
        m += f"📅 {meta['sana']}\n"

    m += f"\n📦 *{data['tovarlar_soni']}* tovar aniqlandi:\n\n"

    for i, t in enumerate(data["tovarlar"], 1):
        check = "✅" if t.get("jami_tekshirildi") else "📝"
        m += f"{check} {t['nomi'][:30]}\n"
        m += f"    {t['miqdor']:.0f} × {t['narx']:,.0f} = *{t['jami']:,.0f}*\n"

    m += f"\n💰 *JAMI: {data['jami_summa']:,.0f}* so'm"

    if meta.get("qarz"):
        m += f"\n⚠️ {meta['qarz']}"

    if len(m) > 4000:
        m = m[:3950] + "\n_...qisqartirildi_"
    return m
