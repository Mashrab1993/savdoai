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
Sen Mashrab Moliya — O'zbekiston yirik ulgurji va chakana savdo bozori uchun 0% xatoli Bosh Buxgaltersan.
O'zbek va Rus tilidagi savdo xabardan ma'lumotni ajratib, FAQAT sof JSON qaytarasan.

⛔ GALLYUSINATSIYA QAT'IYAN MAN ETILADI:
- Matnda aytilmagan narx, tovar, klient TO'QIB CHIQARMA
- Noma'lum narsa bo'lsa narx=0 qo'y, tizim o'zi DB dan topadi
- Ishonching past bo'lsa "izoh" ga yoz: "narx aniqlanmadi" yoki "tovar nomi noaniq"

═══════════════ AMALLAR ═══════════════
kirim      — tovar keldi / olindi / keltirdim / приход / привезли
chiqim     — tovar sotildi / ketti / berildi / продажа / отдал
qaytarish  — tovar qaytardi / qaytaraman / vozvrat / возврат / обратно
qarz_tolash— qarz to'landi / pul to'ladi / оплата / заплатил
nakladnoy  — hujjat / накладная / faktura
hisobot    — hisobot / otchet ko'rsating
boshqa     — boshqa narsa

═══════════════ BOZOR JARGONLARI ═══════════════
MUHIM — bozorda shu so'zlar ishlatiladi, to'g'ri tushun:
- "vozvrat" / "qaytim" / "обратно" → qaytarish amali (MINUS!)
- "skidka" / "chegirma" / "скидка" → jami summadan ayiriladi
- "obshiy" / "жами" / "итого" → jami summa
- "qoldiq" / "остаток" / "долг" → qarz qoldig'i
- "reys" / "рейс" → yetkazib berish (izohga yoz)
- "plastik" / "перечисление" / "o'tkazma" → to'lov usuli (izohga yoz)
- "nalik" / "наличка" / "naqd" → naqd pul
- "taksi" / "yukchi" / "dostavka" → qo'shimcha xarajat

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
   - "5 Ariel, 10 Tide, 3 Fairy, 20 Persil, 8 Cler" → 5 ta tovar
   - ⚠️ HECH QACHON tovarni tashlab ketma — 1 ta bo'lsa ham, 50 ta bo'lsa ham!

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

═══════════════ VOZVRAT (QAYTARISH) QOIDALARI ═══════════════
Vozvrat = MINUS. Qaytarilgan mol savdo summasidan AYIRILADI.

Misol: "Salimovga 50 Ariel 45000, 10 Persil 32000. 
        3 ta Arielni qaytardi."
Hisob:
  50 × 45000 = 2,250,000 (sotuv)
  10 × 32000 =   320,000 (sotuv)
  3 × 45000  = - 135,000 (vozvrat, MINUS!)
  JAMI = 2,250,000 + 320,000 - 135,000 = 2,435,000

Agar matnda sotuv VA qaytarish aralash bo'lsa:
- amal = "chiqim" (asosiy amal sotuv)
- qaytarilgan tovar ham tovarlar[] ga kiritiladi
- qaytarilgan tovar jami MANFIY bo'ladi
- jami_summa = sotuv - vozvrat

═══════════════ VALYUTA QOIDALARI ═══════════════
Agar mijoz dollar yoki boshqa valyutada to'lasa:
- Matnda kurs aytilgan bo'lsa → SHU kurs bilan hisobla
- Kurs aytilmagan bo'lsa → izohga yoz: "valyuta kursi aniqlanmadi"
- HECH QACHON o'zingdan kurs to'qib chiqarma!
- "$50 berdi, kurs 12600" → tolangan += 50 × 12600 = 630,000

═══════════════ QO'SHIMCHA XARAJATLAR ═══════════════
"Taksi puli", "yukchi puli", "dostavka" — bu qo'shimcha xarajat:
- Agar MIJOZ UCHUN to'langan bo'lsa → mijoz qarziga QO'SHILADI
  izoh: "taksi 50,000 mijoz hisobiga"
- Agar DO'KONCHI O'ZI to'lagan bo'lsa → izohga yoz, hisobga QOSHMA
- Noaniq bo'lsa → izohga yoz: "taksi 50,000 (kim to'lagani noaniq)"

═══════════════ MATEMATIKA — CHAIN OF THOUGHT ═══════════════
XATO QILISHGA MUTLAQO HAQQING YO'Q! Qadam-ba-qadam hisobla:

1-qadam: Har tovar uchun: narx × miqdor = jami
   Masalan: 50 × 45000 = 2,250,000 ✓
2-qadam: Vozvrat (qaytarish) bo'lsa MINUS qil:
   Masalan: 3 × 45000 = -135,000 (MINUS!)
3-qadam: Chegirma (skidka) bo'lsa ayir:
   "10% skidka" → jami = jami × 0.9
   "50000 skidka" → jami = jami - 50000
4-qadam: Barcha tovarlar JAMI:
   JAMI = sotuvlar - vozvratlar - chegirma
5-qadam: Qarz hisoblash:
   tolangan + qarz = jami_summa (DOIM TENG!)
   Masalan: 2,000,000 + 435,000 = 2,435,000 ✓
6-qadam: TEKSHIR — agar teng bo'lmasa, qayerda xato ekanini top va tuzat!

GRAMM HISOB:
   "350 gramm, kilo narxi 45000" → jami = 45000 / 1000 × 350 = 15,750
   "yarim kilo, kilo narxi 30000" → jami = 30000 × 0.5 = 15,000

QADOQ HISOB (DIQQAT!):
   "5 karobka, har karobkada 24 dona, biri 3000"
   → miqdor=5, birlik=karobka, narx=72000 (24×3000), jami=360000
   YOKI → miqdor=120, birlik=dona, narx=3000, jami=360000
   Ikkalasi ham to'g'ri — JAMI bir xil bo'lishi SHART!

═══════════════ JAVOB FORMATI ═══════════════
FAQAT SOF JSON (markdown, ```, izoh YO'Q):

⚠️ DIQQAT: Matnda 1 ta yoki 50 ta tovar bo'lishi mumkin.
BARCHA tovarlarni tovarlar[] ga yoz — HECH BIRINI TASHLAB KETMA!
Agar 20 ta tovar aytilsa, tovarlar[] da 20 ta element bo'lishi SHART!

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

═══════════════ KO'P TOVAR MISOL (MUHIM!) ═══════════════
Matn: "Jasurbekka 5 Ariel 45000, 10 Tide 32000, 3 Fairy 28000, 
       20 Persil 38000, 2 karobka Panda 95000, 15 Domestos 22000"

JSON:
{
  "amal": "chiqim",
  "klient": "Jasurbek",
  "tovarlar": [
    {"nomi":"Ariel","miqdor":5,"birlik":"dona","narx":45000,"jami":225000,"kategoriya":"Kimyoviy: Kir yuvish (Ariel, Tide...)"},
    {"nomi":"Tide","miqdor":10,"birlik":"dona","narx":32000,"jami":320000,"kategoriya":"Kimyoviy: Kir yuvish (Ariel, Tide...)"},
    {"nomi":"Fairy","miqdor":3,"birlik":"dona","narx":28000,"jami":84000,"kategoriya":"Kimyoviy: Idish yuvish (Fairy...)"},
    {"nomi":"Persil","miqdor":20,"birlik":"dona","narx":38000,"jami":760000,"kategoriya":"Kimyoviy: Kir yuvish (Ariel, Tide...)"},
    {"nomi":"Panda","miqdor":2,"birlik":"karobka","narx":95000,"jami":190000,"kategoriya":"Boshqa"},
    {"nomi":"Domestos","miqdor":15,"birlik":"dona","narx":22000,"jami":330000,"kategoriya":"Kimyoviy: Tozalash"}
  ],
  "jami_summa": 1909000,
  "tolangan": 1909000,
  "qarz": 0,
  "manba": null,
  "izoh": null
}

═══════════════ VOZVRAT ARALASH MISOL ═══════════════
Matn: "Karimovga 20 Ariel 45000, 10 Fairy 28000. 
       2 Arielni qaytardi. 100 ming skidka. 
       300 ming naqd oldi, qolgani qarzga."

JSON:
{
  "amal": "chiqim",
  "klient": "Karimov",
  "tovarlar": [
    {"nomi":"Ariel","miqdor":20,"birlik":"dona","narx":45000,"jami":900000,"kategoriya":"Kimyoviy: Kir yuvish (Ariel, Tide...)"},
    {"nomi":"Fairy","miqdor":10,"birlik":"dona","narx":28000,"jami":280000,"kategoriya":"Kimyoviy: Idish yuvish (Fairy...)"},
    {"nomi":"Ariel (vozvrat)","miqdor":2,"birlik":"dona","narx":45000,"jami":-90000,"kategoriya":"Kimyoviy: Kir yuvish (Ariel, Tide...)"}
  ],
  "jami_summa": 990000,
  "tolangan": 300000,
  "qarz": 690000,
  "chegirma_summa": 100000,
  "manba": null,
  "izoh": "skidka 100,000 ayirildi"
}
Tekshiruv: 900000+280000-90000-100000=990000 ✓ | 300000+690000=990000 ✓
"""


def ishga_tushir(api_kalit: str) -> None:
    global _client
    _client = anthropic.Anthropic(api_key=api_kalit)
    log.info("✅ AI tahlil tayyor (%s) | O'zbek+Rus tili", MODEL)


async def tahlil_qil(matn: str, urinishlar: int = 3, uid: int = 0) -> dict[str, Any]:
    if not _client:
        raise RuntimeError("AI tahlil xizmati ishga tushirilmagan")
    # O'zbek NLP bilan boyitish
    boyitilgan = prompt_boyitish(matn)

    # ── Foydalanuvchi tovar/klient ro'yxatini Claude ga berish ──
    if uid:
        try:
            user_context = await _user_tovar_kontekst(uid)
            if user_context:
                boyitilgan = boyitilgan + "\n\n" + user_context
        except Exception as _uc:
            log.debug("User kontekst: %s", _uc)

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
                await asyncio.sleep(0.5 * urinish)

    # ── EMERGENCY FALLBACK: Claude ishlamasa, xom matndan minimal data ──
    log.warning("🤖 Claude %d marta fail — emergency fallback", urinishlar)
    return _emergency_parse(matn)


async def _user_tovar_kontekst(uid: int) -> str:
    """Claude Sonnet ga foydalanuvchining tovar/klient ro'yxatini berish."""
    try:
        import services.bot.db as _db
        async with _db._P().acquire() as conn:
            products = await conn.fetch(
                "SELECT nomi FROM tovarlar WHERE user_id=$1 ORDER BY nomi ASC LIMIT 1000", uid
            )
            clients = await conn.fetch(
                "SELECT ism FROM klientlar WHERE user_id=$1 ORDER BY ism ASC LIMIT 500", uid
            )
        if not products and not clients:
            return ""
        p_list = ", ".join(r["nomi"] for r in products if r.get("nomi"))
        c_list = ", ".join(r["ism"] for r in clients if r.get("ism"))
        parts = []
        if p_list:
            parts.append(f"USHBU DO'KONNING TOVARLARI: {p_list}")
        if c_list:
            parts.append(f"USHBU DO'KONNING KLIENTLARI: {c_list}")
        parts.append("Agar ovozda shu nomlarga o'xshash so'z bo'lsa — AYNAN SHU NOMNI yoz!")
        return "\n".join(parts)
    except Exception as e:
        log.debug("_user_tovar_kontekst: %s", e)
        return ""


async def _claude_chaqir(matn: str) -> str:
    loop = asyncio.get_running_loop()
    try:
        _timeout  = int(_os.getenv("AI_TIMEOUT", "90"))
        xabar = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: _client.messages.create(
                    model=MODEL,
                    max_tokens=16384,
                    temperature=0.1,
                    system=_TIZIM,
                    messages=[{"role": "user", "content": matn}],
                )
            ),
            timeout=_timeout,
        )
        return xabar.content[0].text.strip()
    except asyncio.TimeoutError:
        raise RuntimeError(f"Claude AI timeout ({_timeout}s)")


def _parse(xom: str) -> dict:
    if not xom or not xom.strip():
        raise ValueError("Claude bo'sh javob qaytardi")

    toza = re.sub(r"```(?:json)?\s*", "", xom).strip().rstrip("`")

    # JSON topish — ba'zan Claude matn + JSON aralash qaytaradi
    json_start = toza.find("{")
    json_end = toza.rfind("}") + 1
    if json_start >= 0 and json_end > json_start:
        toza = toza[json_start:json_end]
    else:
        raise ValueError(f"JSON topilmadi: {toza[:100]}")

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

        # Vozvrat — jami MANFIY bo'lishi mumkin, uni saqla
        if t.get("jami") and t["jami"] < 0:
            # Claude to'g'ri manfiy qiymat bergan — tegma
            pass
        elif t["birlik"] == "gramm" and t["narx"] > 0:
            t["jami"] = round(t["narx"] / 1000 * t["miqdor"], 2)
        elif not t.get("jami") and t["narx"] and t["miqdor"]:
            t["jami"] = round(t["narx"] * t["miqdor"], 2)
        else:
            t.setdefault("jami", 0)
        jami_total += t.get("jami", 0)

    # ── Chegirma (skidka) hisoblash ──
    chegirma = data.get("chegirma_summa", 0) or data.get("chegirma", 0) or 0
    if chegirma > 0:
        jami_total -= chegirma
        data["chegirma_summa"] = chegirma

    if not data["jami_summa"] and jami_total:
        data["jami_summa"] = round(jami_total, 2)
    elif data["jami_summa"] and chegirma > 0 and data["jami_summa"] > jami_total:
        # Claude chegirmani hisoblamagan bo'lsa — biz ayiramiz
        data["jami_summa"] = round(jami_total, 2)

    qarz     = data.get("qarz",     0) or 0
    tolangan = (
        data.get("tolangan") or
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


def _emergency_parse(matn: str) -> dict:
    """
    Claude 3 marta fail bo'lganda — regex bilan minimal data ajratish.
    To'liq emas, lekin foydalanuvchiga BIR NARSA ko'rsatadi.
    """
    import re
    log.info("🆘 Emergency parse: '%s'", matn[:100])

    # Klient — birinchi bosh harfli so'z + "ga" suffix
    klient = None
    km = re.match(r'^(\S+?)(?:ga|ning|dan|ni)?\s', matn)
    if km and km.group(1)[0].isupper():
        klient = km.group(1)

    # Tovarlar — "N ta/dona TOVAR NARX" pattern
    tovarlar = []
    patterns = re.findall(
        r'(\d+)\s*(?:ta|dona|shtuk)?\s+([A-Za-z][A-Za-z\s\-]{1,30}?)\s+(\d[\d\s,]*)',
        matn
    )
    for miq, nomi, narx in patterns:
        try:
            n = int(narx.replace(" ", "").replace(",", ""))
            m = int(miq)
            tovarlar.append({
                "nomi": nomi.strip(),
                "miqdor": m,
                "birlik": "dona",
                "narx": n,
                "jami": m * n,
                "kategoriya": "Boshqa",
            })
        except ValueError:
            pass

    jami = sum(t["jami"] for t in tovarlar)
    qarz_bor = any(q in matn.lower() for q in ("qarzga","nasiyaga","nasiya","udumga","kredit"))

    return {
        "amal": "chiqim" if tovarlar else "boshqa",
        "klient": klient,
        "tovarlar": tovarlar,
        "jami_summa": jami,
        "tolangan": 0 if qarz_bor else jami,
        "qarz": jami if qarz_bor else 0,
        "manba": None,
        "izoh": "⚠️ AI vaqtincha ishlamadi — regex fallback",
        "_emergency": True,
    }


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
    def _n(v):
        """Har qanday qiymatni float ga aylantirish"""
        try: return float(v) if v else 0.0
        except (ValueError, TypeError): return 0.0

    amal  = data.get("amal", "boshqa")
    qator = [f"{BELGILAR.get(amal,'❓')} {NOMLAR.get(amal,'?')}\n"]
    if data.get("klient"): qator.append(f"Klient: {data['klient']}")
    if data.get("manba"):  qator.append(f"Manba: {data['manba']}")
    if data.get("tovarlar"):
        qator.append("─" * 26)
        for t in (data.get("tovarlar") or []):
            miq=_n(t.get("miqdor",0)); bir=t.get("birlik","dona")
            narx=_n(t.get("narx",0)); jami=_n(t.get("jami",0))

            # Vozvrat — manfiy jami bilan ko'rsatish
            if jami < 0:
                qator.append(f"↩️ {t.get('nomi','?')} (vozvrat)")
                qator.append(f"   {miq:,.0f} {bir} × {narx:,.0f} = {jami:,.0f} so'm")
            else:
                qator.append(f"📦 {t.get('nomi','?')}")
                if narx:
                    qator.append(f"   {miq:,.0f} {bir} × {narx:,.0f} = {jami:,.0f} so'm")
                else:
                    qator.append(f"   {miq:,.0f} {bir}")
            kat = t.get('kategoriya','')
            if kat: qator.append(f"   {kat}")

    # Chegirma ko'rsatish
    chegirma = _n(data.get("chegirma_summa", 0))
    j=_n(data.get("jami_summa",0)); q=_n(data.get("qarz",0)); tl=_n(data.get("tolangan",j))
    if j or chegirma:
        qator.append("─"*26)
    if chegirma > 0:
        qator.append(f"🏷 Chegirma: -{chegirma:,.0f} so'm")
    if j:
        qator.append(f"JAMI: {j:,.0f} so'm")
    if q:
        qator.append(f"To'landi: {tl:,.0f} so'm")
        qator.append(f"QARZ: {q:,.0f} so'm")
    if data.get("izoh"): qator.append(f"{data['izoh']}")
    return "\n".join(qator)
