"""AI Tahlil — Claude claude-sonnet-4-6 | O'zbek + Rus tili"""
from __future__ import annotations
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))))

import asyncio, json, re, logging
from typing import Any
import anthropic
try:
    from shared.utils.uzb_nlp import matn_normallashtir, prompt_boyitish
    _NLP_OK = True
except Exception:
    _NLP_OK = False
    def prompt_boyitish(t): return t
    def matn_normallashtir(t): return t

log = logging.getLogger(__name__)
_client: anthropic.Anthropic | None = None
MODEL = "claude-sonnet-4-6"
VERSION = "14.0"

_TIZIM = """
Sen Mashrab Moliya — O'zbekiston savdo tizimining AI yordamchisisisan.
O'zbek va Rus tilidagi savdo xabardan ma'lumotni ajratib, FAQAT sof JSON qaytarasan.

═══════════════ AMALLAR ═══════════════
kirim      — tovar keldi / olindi / keltirdim
chiqim     — tovar sotildi / ketti / berildi
qaytarish  — tovar qaytardi / qaytaraman
qarz_tolash— qarz to'landi / pul to'ladi
nakladnoy  — hujjat / накладная / faktura
hisobot    — hisobot / otchet ko'rsating
boshqa     — boshqa narsa

═══════════════ RAQAM SO'ZLAR ═══════════════
O'zbek raqamlarni aniq tushun:
- bir=1, ikki=2, uch=3, to'rt=4, besh=5
- olti=6, yetti=7, sakkiz=8, to'qqiz=9, o'n=10
- yigirma=20, o'ttiz=30, qirq=40, ellik=50
- oltmish=60, yetmish=70, sakson=80, to'qson=90
- yuz=100, ming=1000, million=1000000
- yarim=0.5, chorak=0.25, bir yarim=1.5

Misollar:
  "ellik" = 50 | "yuz ellik" = 150
  "qirq besh ming" = 45000
  "o'ttiz besh ming" = 35000
  "bir million" = 1000000
  "yarim kilo" → miqdor=0.5, birlik=kg
  "bir yarim tonna" → miqdor=1.5, birlik=tonna

═══════════════ BIRLIKLAR ═══════════════
dona, ta → dona
kilo, kg, kilogram → kg
gramm, gr, g → gramm
litr, l → litr
metr, m → metr
qop, xalta, meshok → qop
bochka → bochka
karobka, quti, blok → karobka
tonna → tonna

═══════════════ QARZ SO'ZLAR ═══════════════
Bu so'zlar "qarzga" degan ma'no beradi:
- qarzga, qarzga, nasiyaga, nasiya, kredit
- muddatga, udumga, keyinroq, hisob-kitobga
- "yarmi qarzga" → tolangan=jami/2, qarz=jami/2
- "hammasi qarzga" → tolangan=0, qarz=jami
- "N so'm qarzga" → qarz=N, tolangan=jami-N

═══════════════ KATEGORIYALAR ═══════════════
Oziq-ovqat: Un va don | Oziq-ovqat: Yog va sut | Oziq-ovqat: Guruch va makaron
Oziq-ovqat: Tuz, shakar, asal | Oziq-ovqat: Konserva | Oziq-ovqat: Non va yopma
Gusht: Mol gushti | Gusht: Tovuq | Gusht: Baliq | Gusht: Kolbasa
Meva-sabzavot: Sabzavot | Meva-sabzavot: Meva | Meva-sabzavot: Quruq meva
Sut mahsuloti: Sut va qatiq | Sut mahsuloti: Pishloq | Sut mahsuloti: Tuxum
Ichimlik: Suv | Ichimlik: Gazli | Ichimlik: Sharbat | Ichimlik: Choy va qahva
Kimyoviy: Kir yuvish (Ariel, Tide...) | Kimyoviy: Idish yuvish (Fairy...)
Kimyoviy: Tozalash | Gigiyena: Sabun va shampun | Gigiyena: Tish pastasi
Kosmetika: Krem va loson | Kosmetika: Atir va parfyum
Shirinlik: Shokolad va konfet | Shirinlik: Pechenye | Shirinlik: Muzqaymoq
Oshxona: Birinchi taomlar | Oshxona: Ikkinchi taomlar | Oshxona: Kabob
Oshxona: Somsa va non | Oshxona: Salat | Oshxona: Desert
Xozmak: Muzqaymoq | Xozmak: Snack | Xozmak: Aralash ichimlik
Xojalik: Idish-tovoq | Xojalik: Kiyim | Boshqa

═══════════════ MUHIM QOIDALAR ═══════════════
1. KLIENT: Bosh harfli so'z = klient (Salimov, Karimov, Akbar)
   - "ga", "ni", "dan" suffix → olib tashlash
   - "Salimovga" → klient: "Salimov"

2. NARX: "narxi X", "biri X", "X so'm" → narx=X
   - "qirq besh ming" = 45000
   - "45k" = 45000

3. GRAMM: birlik="gramm", narx=KG narxi
   - "350 gramm, kilo narxi 45000" → miqdor=350, birlik=gramm, narx=45000

4. KO'P TOVAR: hammasini tovarlar[] ga yoz
   - "50 Ariel, 20 Tide" → 2 ta tovar

5. KIRIM: "dan", "akadan", "firma", "ombor" → manba
   - "Akbardan kirdi" → manba: "Akbar"

6. QARZ: tolangan + qarz = jami_summa (doim)
   - "500 ming qarzga" → qarz=500000, tolandan=jami-500000

7. RUS TILI:
   - "продажа" → chiqim | "приход" → kirim
   - "возврат" → qaytarish | "оплата" → qarz_tolash
   - "накладная" → nakladnoy

8. XATO QILMASLIK:
   - Narx aytilmasa narx=0 qo'y (tizim o'zi aniqlaydi)
   - Klient yo'q bo'lsa null
   - Tovar nomi aniq yoz (qisqartma emas)
   - "Salimovga 50 Ariel" → narx=0 (tizim Salimov narxini topadi)

═══════════════ MATEMATIKA — CHAIN OF THOUGHT ═══════════════
XATO QILISHGA MUTLAQO HAQQING YO'Q! Qadam-ba-qadam hisobla:

1-qadam: Har tovar uchun: narx × miqdor = jami
   Masalan: 50 × 45000 = 2,250,000 ✓
2-qadam: Barcha tovarlar jamini qo'sh:
   Masalan: 2,250,000 + 800,000 = 3,050,000 ✓
3-qadam: Qarz hisoblash:
   tolangan + qarz = jami_summa (DOIM TENG!)
   Masalan: 2,550,000 + 500,000 = 3,050,000 ✓
4-qadam: TEKSHIR — agar teng bo'lmasa, qayerda xato ekanini top va tuzat!

GRAMM HISOB:
   "350 gramm, kilo narxi 45000" → jami = 45000 / 1000 × 350 = 15,750
   "yarim kilo, kilo narxi 30000" → jami = 30000 × 0.5 = 15,000

CHEGIRMA:
   "10% chegirma" → jami = jami × 0.9
   "5000 chegirma" → jami = jami - 5000

═══════════════ JAVOB FORMATI ═══════════════
FAQAT SOF JSON (markdown, ```, izoh YO'Q):

{
  "amal": "chiqim",
  "klient": "Salimov",
  "tovarlar": [
    {
      "nomi": "Ariel 3kg",
      "miqdor": 50,
      "birlik": "dona",
      "narx": 45000,
      "jami": 2250000,
      "kategoriya": "Kimyoviy: Kir yuvish (Ariel, Tide...)"
    }
  ],
  "jami_summa": 2250000,
  "tolangan": 1750000,
  "qarz": 500000,
  "manba": null,
  "izoh": null
}
"""


def ishga_tushir(api_kalit: str) -> None:
    global _client
    _client = anthropic.Anthropic(api_key=api_kalit)
    log.info("✅ AI tahlil tayyor (%s) | O'zbek+Rus tili", MODEL)


async def tahlil_qil(matn: str, urinishlar: int = 3) -> dict[str, Any]:
    if not _client:
        raise RuntimeError("AI tahlil xizmati ishga tushirilmagan")
    # O'zbek NLP bilan boyitish
    boyitilgan = prompt_boyitish(matn)
    oxirgi: Exception | None = None
    for urinish in range(1, urinishlar + 1):
        try:
            xom    = await _claude_chaqir(boyitilgan)
            natija = _parse(xom)
            log.info("🤖 [%d] amal=%s klient=%s", urinish,
                     natija["amal"], natija.get("klient"))
            return natija
        except Exception as xato:
            oxirgi = xato
            log.warning("🤖 %d-urinish: %s", urinish, xato)
            if urinish < urinishlar:
                await asyncio.sleep(2.0 * urinish)
    return _bosh(str(oxirgi))


async def _claude_chaqir(matn: str) -> str:
    loop = asyncio.get_event_loop()
    try:
        _timeout  = int(__import__("os").getenv("AI_TIMEOUT", "30"))
        xabar = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: _client.messages.create(
                    model=MODEL,
                    max_tokens=2048,
                    temperature=0.1,
                    system=_TIZIM,
                    messages=[{"role": "user", "content": matn}],
                )
            ),
            timeout=_timeout,
        )
        return xabar.content[0].text.strip()
    except asyncio.TimeoutError:
        raise RuntimeError("Claude AI timeout (30s)")


def _parse(xom: str) -> dict:
    toza = re.sub(r"```(?:json)?\s*", "", xom).strip().rstrip("`")
    data = json.loads(toza)
    data.setdefault("amal",       "boshqa")
    data.setdefault("klient",     None)
    data.setdefault("tovarlar",   [])
    data.setdefault("jami_summa", 0)
    data.setdefault("manba",      None)
    data.setdefault("izoh",       None)

    jami_total = 0.0
    for t in data["tovarlar"]:
        t.setdefault("kategoriya", "Boshqa")
        t.setdefault("birlik", "dona")
        t.setdefault("narx",   0)
        t.setdefault("miqdor", 0)
        if t["birlik"] == "gramm" and t["narx"] > 0:
            t["jami"] = round(t["narx"] / 1000 * t["miqdor"], 2)
        elif not t.get("jami") and t["narx"] and t["miqdor"]:
            t["jami"] = round(t["narx"] * t["miqdor"], 2)
        else:
            t.setdefault("jami", 0)
        jami_total += t.get("jami", 0)

    if not data["jami_summa"] and jami_total:
        data["jami_summa"] = round(jami_total, 2)

    qarz     = data.get("qarz",     0) or 0
    tolangan = (
        data.get("tolandan") or data.get("tolangan") or
        max(data["jami_summa"] - qarz, 0)
    )
    data["qarz"]     = max(qarz,     0)
    data["tolangan"] = max(tolangan, 0)
    
    # Hisob-kitobni tekshirish va tuzatish
    try:
        from shared.utils.hisob import ai_hisob_tekshir, sotuv_validatsiya
        data = ai_hisob_tekshir(data)
        if data.get("amal") in ("chiqim","nakladnoy"):
            ok, xato = sotuv_validatsiya(data)
            if not ok:
                import logging
                logging.getLogger("analyst").warning("Validatsiya: %s", xato)
    except Exception as e:
        logging.getLogger("analyst").warning("hisob_tekshir: %s", e)
    
    return data


def _bosh(sabab: str = "") -> dict:
    return dict(amal="boshqa", klient=None, tovarlar=[],
                jami_summa=0, tolangan=0, qarz=0,
                manba=None, izoh=None, _sabab=sabab)


def oldindan_korinish(data: dict) -> str:
    BELGILAR = {"kirim":"📥","chiqim":"📤","qaytarish":"↩️",
                "qarz_tolash":"💳","nakladnoy":"📋","hisobot":"📊"}
    NOMLAR   = {"kirim":"KIRIM","chiqim":"SOTUV","qaytarish":"QAYTARISH",
                "qarz_tolash":"QARZ TO'LASH","nakladnoy":"NAKLADNOY",
                "hisobot":"HISOBOT","boshqa":"NOMA'LUM"}
    amal  = data.get("amal", "boshqa")
    qator = [f"{BELGILAR.get(amal,'❓')} *{NOMLAR.get(amal,'?')}*\n"]
    if data.get("klient"): qator.append(f"👤 Klient: *{data['klient']}*")
    if data.get("manba"):  qator.append(f"🏭 Manba: {data['manba']}")
    if data.get("tovarlar"):
        qator.append("─" * 26)
        for t in data["tovarlar"]:
            miq=t.get("miqdor",0); bir=t.get("birlik","dona")
            narx=t.get("narx",0); jami=t.get("jami",0)
            qator.append(f"📦 *{t['nomi']}*")
            if narx:
                qator.append(f"   {miq} {bir} × {narx:,.0f} = *{jami:,.0f} so'm*")
            else:
                qator.append(f"   {miq} {bir}")
            qator.append(f"   🏷 _{t.get('kategoriya','')}_")
    j=data.get("jami_summa",0); q=data.get("qarz",0); tl=data.get("tolangan",j)
    if j:
        qator.append("─"*26)
        qator.append(f"💵 JAMI: *{j:,.0f} so'm*")
    if q:
        qator.append(f"✅ To'landi: {tl:,.0f} so'm")
        qator.append(f"⚠️ QARZ: *{q:,.0f} so'm*")
    if data.get("izoh"): qator.append(f"📝 {data['izoh']}")
    return "\n".join(qator)
