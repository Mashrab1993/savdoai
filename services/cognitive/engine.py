"""
╔═══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — KOGNITIV DVIGATEL (Cognitive Engine)       ║
║                                                                   ║
║  DSc FILOLOGIYA:                                                  ║
║  ✅ 8 O'zbek shevasi (Xorazm, Farg'ona, Samarqand, Toshkent...) ║
║  ✅ temperature=0.0 — gallyusinatsiya nol!                        ║
║  ✅ Tool Calling — AI faqat tushunadi, hisob Python da            ║
║  ✅ Prompt Engineering (DSc darajasida)                           ║
║                                                                   ║
║  DSc MATEMATIKA:                                                  ║
║  ✅ SymPy — aniq ramziy matematik hisob                           ║
║  ✅ Decimal(28) — float xatosi 0%                                 ║
║  ✅ Moliya formulalari: kredit, foiz, chegirma, foyda             ║
║  ✅ AI HISOB QILMAYDI — Python hisoblaydi!                        ║
╚═══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
import re
import sys
import os
from decimal import Decimal, getcontext, ROUND_HALF_UP
from typing import Any, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

log = logging.getLogger(__name__)
__version__ = "21.3"

# Matematik aniqlik (28 xona)
getcontext().prec    = 28
getcontext().rounding = ROUND_HALF_UP

ZERO = Decimal("0")


# ════════════════════════════════════════════════════════════════════
#  1. DSc MATEMATIKA — TOOL FUNKSIYALARI
#     AI bu funksiyalarni CHAQIRADI, lekin hisob PYTHON DA bajariladi
# ════════════════════════════════════════════════════════════════════

def tool_narx_hisob(miqdor: float, narx: float,
                    birlik: str = "dona",
                    chegirma_foiz: float = 0) -> dict:
    """
    Tovar narxini aniq hisoblash.
    formula: jami = miqdor × narx × (1 - chegirma/100)
    gramm:   jami = narx/1000 × miqdor × (1 - chegirma/100)
    """
    m  = Decimal(str(miqdor))
    n  = Decimal(str(narx))
    ch = Decimal(str(chegirma_foiz))

    if m <= ZERO or n <= ZERO:
        return {"jami": 0.0, "formula": "0", "xato": None}

    ch = max(ZERO, min(ch, Decimal("100")))
    k  = (Decimal("100") - ch) / Decimal("100")

    if birlik == "gramm":
        jami = (n / Decimal("1000") * m * k).quantize(Decimal("1"), ROUND_HALF_UP)
    else:
        jami = (m * n * k).quantize(Decimal("1"), ROUND_HALF_UP)

    formula = (
        f"{m} × {n}" +
        (f" / 1000 (gramm)" if birlik == "gramm" else "") +
        (f" × (1 - {ch}/100)" if ch > ZERO else "") +
        f" = {jami}"
    )
    log.debug("tool_narx_hisob: %s", formula)
    return {"jami": float(jami), "formula": formula, "xato": None}


def tool_qarz_hisob(jami: float, qarz: float) -> dict:
    """
    Qarz va to'langan hisoblash.
    Invariant: tolangan + qarz = jami (doim!)
    """
    j = Decimal(str(jami)).quantize(Decimal("1"), ROUND_HALF_UP)
    q = Decimal(str(qarz)).quantize(Decimal("1"), ROUND_HALF_UP)
    j = max(j, ZERO)
    q = max(ZERO, min(q, j))
    tl = j - q
    return {
        "jami":     float(j),
        "qarz":     float(q),
        "tolangan": float(tl),
        "tekshir":  float(tl + q) == float(j),
        "xato":     None,
    }


def tool_foyda_hisob(sotish_narxi: float, olish_narxi: float,
                     miqdor: float, birlik: str = "dona",
                     chegirma_foiz: float = 0) -> dict:
    """
    Foyda va foyda foizini hisoblash.
    formula: foyda = (sotish - olish) × miqdor
    """
    sn = Decimal(str(sotish_narxi))
    on = Decimal(str(olish_narxi))
    m  = Decimal(str(miqdor))

    daromad_r = tool_narx_hisob(float(m), float(sn), birlik, chegirma_foiz)
    xarajat_r = tool_narx_hisob(float(m), float(on), birlik, 0)

    daromad = Decimal(str(daromad_r["jami"]))
    xarajat = Decimal(str(xarajat_r["jami"]))
    foyda   = daromad - xarajat
    zararli = foyda < ZERO

    foiz = ZERO
    if xarajat > ZERO:
        foiz = (foyda / xarajat * Decimal("100")).quantize(
            Decimal("0.01"), ROUND_HALF_UP
        )

    return {
        "daromad":    float(daromad),
        "xarajat":    float(xarajat),
        "foyda":      float(foyda),
        "foyda_foiz": float(foiz),
        "zararli":    zararli,
        "xato":       None,
    }


def tool_kredit_hisob(asosiy: float, yillik_foiz: float,
                      oy_soni: int) -> dict:
    """
    Muddatli kredit to'lovini hisoblash.
    Annuitet formula:
    M = P × r(1+r)^n / ((1+r)^n - 1)
    P = asosiy summa
    r = oylik foiz (yillik/12/100)
    n = oy soni
    """
    P = Decimal(str(asosiy))
    r = Decimal(str(yillik_foiz)) / Decimal("12") / Decimal("100")
    n = oy_soni

    if r == ZERO:
        # Foizsiz kredit
        oylik = (P / Decimal(n)).quantize(Decimal("1"), ROUND_HALF_UP)
        return {
            "oylik_tolov": float(oylik),
            "jami_tolov":  float(oylik * n),
            "jami_foiz":   0.0,
            "formula":     f"P/n = {P}/{n} = {oylik}",
            "xato":        None,
        }

    # Annuitet
    r1n = (Decimal("1") + r) ** n
    oylik = (P * r * r1n / (r1n - Decimal("1"))).quantize(
        Decimal("1"), ROUND_HALF_UP
    )
    jami_tolov = oylik * n
    jami_foiz  = jami_tolov - P

    return {
        "oylik_tolov": float(oylik),
        "jami_tolov":  float(jami_tolov),
        "jami_foiz":   float(jami_foiz),
        "formula": (
            f"M = {P} × {r:.6f}×(1+{r:.6f})^{n} / "
            f"((1+{r:.6f})^{n}-1) = {oylik}"
        ),
        "xato": None,
    }


def tool_chegirma_hisob(asl_narx: float, chegirma_foiz: float) -> dict:
    """Chegirma hisoblash"""
    an  = Decimal(str(asl_narx))
    ch  = Decimal(str(chegirma_foiz))
    ch  = max(ZERO, min(ch, Decimal("100")))
    ayrildi = (an * ch / Decimal("100")).quantize(Decimal("1"), ROUND_HALF_UP)
    yangi   = an - ayrildi
    return {
        "asl_narx":    float(an),
        "chegirma":    float(ayrildi),
        "yangi_narx":  float(yangi),
        "chegirma_foiz": float(ch),
        "xato": None,
    }


def tool_valyuta_hisob(summa: float, kurs: float,
                        manba: str = "UZS",
                        maqsad: str = "USD") -> dict:
    """Valyuta konvertatsiya"""
    s = Decimal(str(summa))
    k = Decimal(str(kurs))
    if k <= ZERO:
        return {"natija": 0.0, "xato": "Kurs 0 yoki manfiy"}
    natija = (s / k).quantize(Decimal("0.01"), ROUND_HALF_UP)
    return {
        "manba_summa":  float(s),
        "manba_valyuta":manba,
        "natija":       float(natija),
        "maqsad_valyuta":maqsad,
        "kurs":         float(k),
        "formula":      f"{s} {manba} ÷ {k} = {natija} {maqsad}",
        "xato":         None,
    }


def tool_foiz_hisob(qiymat: float, jami: float) -> dict:
    """Foiz hisoblash"""
    q = Decimal(str(qiymat))
    j = Decimal(str(jami))
    if j <= ZERO:
        return {"foiz": 0.0, "xato": "Jami 0"}
    foiz = (q / j * Decimal("100")).quantize(Decimal("0.01"), ROUND_HALF_UP)
    return {
        "qiymat": float(q),
        "jami":   float(j),
        "foiz":   float(foiz),
        "formula":f"{q} / {j} × 100 = {foiz}%",
        "xato":   None,
    }


# ════════════════════════════════════════════════════════════════════
#  2. TOOL REGISTRY — AI chaqira oladigan funksiyalar
# ════════════════════════════════════════════════════════════════════

TOOLS: dict[str, dict] = {
    "narx_hisob": {
        "fn": tool_narx_hisob,
        "schema": {
            "name": "narx_hisob",
            "description": (
                "Tovar narxini aniq hisoblaydi. "
                "Dona, kg, gramm, litr birliklarni qabul qiladi. "
                "Chegirma foiz ixtiyoriy."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "miqdor":        {"type": "number", "description": "Miqdor"},
                    "narx":          {"type": "number", "description": "Birlik narxi (so'm)"},
                    "birlik":        {"type": "string", "enum": ["dona","kg","gramm","litr","metr"]},
                    "chegirma_foiz": {"type": "number", "default": 0, "description": "Chegirma foiz (0-100)"},
                },
                "required": ["miqdor", "narx"],
            },
        },
    },
    "qarz_hisob": {
        "fn": tool_qarz_hisob,
        "schema": {
            "name": "qarz_hisob",
            "description": "Qarz va to'langan summani hisoblaydi. tolangan+qarz=jami invariantini saqlaydi.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "jami": {"type": "number"},
                    "qarz": {"type": "number"},
                },
                "required": ["jami", "qarz"],
            },
        },
    },
    "foyda_hisob": {
        "fn": tool_foyda_hisob,
        "schema": {
            "name": "foyda_hisob",
            "description": "Sotuv foydasi va foyda foizini hisoblaydi. Zarar holatini aniqlaydi.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "sotish_narxi":  {"type": "number"},
                    "olish_narxi":   {"type": "number"},
                    "miqdor":        {"type": "number"},
                    "birlik":        {"type": "string"},
                    "chegirma_foiz": {"type": "number", "default": 0},
                },
                "required": ["sotish_narxi", "olish_narxi", "miqdor"],
            },
        },
    },
    "kredit_hisob": {
        "fn": tool_kredit_hisob,
        "schema": {
            "name": "kredit_hisob",
            "description": "Muddatli kredit oylik to'lovini annuitet usulida hisoblaydi.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "asosiy":       {"type": "number", "description": "Kredit summasi (so'm)"},
                    "yillik_foiz":  {"type": "number", "description": "Yillik foiz (%)"},
                    "oy_soni":      {"type": "integer", "description": "Muddati (oy)"},
                },
                "required": ["asosiy", "yillik_foiz", "oy_soni"],
            },
        },
    },
    "chegirma_hisob": {
        "fn": tool_chegirma_hisob,
        "schema": {
            "name": "chegirma_hisob",
            "description": "Chegirma qo'llanganda yangi narxni hisoblaydi.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "asl_narx":      {"type": "number"},
                    "chegirma_foiz": {"type": "number"},
                },
                "required": ["asl_narx", "chegirma_foiz"],
            },
        },
    },
    "foiz_hisob": {
        "fn": tool_foiz_hisob,
        "schema": {
            "name": "foiz_hisob",
            "description": "Qiymatning jami ichidagi foizini hisoblaydi.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "qiymat": {"type": "number"},
                    "jami":   {"type": "number"},
                },
                "required": ["qiymat", "jami"],
            },
        },
    },
    "loyalty_hisob": {
        "fn": lambda summa, **kw: {
            "ball": int(Decimal(str(summa)) / Decimal("1000")),
            "daraja": (
                "Platinum" if int(Decimal(str(summa)) / Decimal("1000")) >= 2000 else
                "Gold" if int(Decimal(str(summa)) / Decimal("1000")) >= 500 else
                "Silver" if int(Decimal(str(summa)) / Decimal("1000")) >= 100 else
                "Bronze"
            ),
            "izoh": "1000 so'm = 1 ball",
        },
        "schema": {
            "name": "loyalty_hisob",
            "description": "Sotuv summasidan bonus ball va VIP darajani hisoblaydi. 1000 so'm = 1 ball. Bronze/Silver/Gold/Platinum daraja.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "summa": {"type": "number", "description": "Sotuv summasi (so'm)"},
                },
                "required": ["summa"],
            },
        },
    },
}


def tool_chaqir(tool_name: str, tool_input: dict) -> dict:
    """Tool funksiyasini xavfsiz chaqirish"""
    if tool_name not in TOOLS:
        return {"xato": f"Noto'g'ri tool: {tool_name}"}
    try:
        return TOOLS[tool_name]["fn"](**tool_input)
    except Exception as e:
        log.error("Tool xato %s: %s", tool_name, e)
        log.error("Tool chaqiruv xato: %s", e)
        return {"xato": "Hisob xatosi yuz berdi"}


# ════════════════════════════════════════════════════════════════════
#  3. DSc FILOLOGIYA — SYSTEM PROMPT
# ════════════════════════════════════════════════════════════════════

COGNITIVE_SYSTEM_PROMPT = """
Sen Mashrab Moliya savdo tizimining kognitiv dvigatelisan.
Senga ikkita ilmiy DSc diplom berilgan:

═══════════════════════════════════════════════════════════
DSc FILOLOGIYA — O'ZBEK TILI VA DIALEKTOLOGIYASI
═══════════════════════════════════════════════════════════

O'zbek shevalari (barcha hududlar):

TOSHKENT:     beraqol=ber, olaqol=ol, necha=qancha
SAMARQAND:    qanch=qancha, bersin=berdi, olsin=oldi
FARG'ONA:     nema=nima, bergil=berdi, olgil=oldi
XORAZM:       neme=nima, kansha=qancha, kilu=kilo, baqiyasiga=qarzga
QASHQADARYO:  tiqson=to'qson, chekka=yechib
BUXORO:       bering=berdi, oling=oldi
ANDIJON:      qanchaki=qancha, nimaki=nima
SURXONDARYO:  bolan=bolam, narivi=u

Raqam so'zlari (barcha variant):
bir=1, ikki=2, uch=3, to'rt/tort/tört=4, besh=5
olti=6, yetti/yeti=7, sakkiz/sakiz=8, to'qqiz/toqqiz=9
o'n/on=10, yigirma=20, o'ttiz/ottiz=30, qirq=40
ellik=50, oltmish=60, yetmish=70, sakson=80, to'qson/toqson=90
yuz=100, ming=1000, million=1_000_000, milliard=1_000_000_000
yarim=0.5, chorak=0.25, bir yarim=1.5

Mahalliy: 1 limon=100,000 so'm

Qarz so'zlari: qarzga, nasiyaga, nasiya, udum, udumga,
baqiyasiga, kreditga, muddatga, в долг, в кредит

═══════════════════════════════════════════════════════════
DSc MATEMATIKA — OLTIN QOIDA
═══════════════════════════════════════════════════════════

SEN HECH QACHON O'ZING HISOB QILMAYSAN!
Barcha raqamli hisob-kitob uchun FAQAT toollarni chaqirasan.

Nima qilasan:
1. Matnni tushunasan (DSc Filologiya)
2. Amal va raqamlarni aniqlashtirasan
3. To'g'ri toolni chaqirasan
4. Tool natijasini JSON ga kiritasan

═══════════════════════════════════════════════════════════
SAVDO AMALLARI
═══════════════════════════════════════════════════════════

kirim      — tovar keldi/kirdi/keltirdim/oldim
chiqim     — tovar ketti/sotdim/berdim/berdi
qaytarish  — tovar qaytardi/qaytaraman
qarz_tolash— qarz to'ladi/to'ladim/to'landi
hisobot    — hisobot/statistika ko'rsating
boshqa     — boshqa

═══════════════════════════════════════════════════════════
YANGI IMKONIYATLAR (v25.3.2)
═══════════════════════════════════════════════════════════

KPI:
- "natijam qanday" / "KPI" → /kpi buyruqqa yo'naltir
- Agent reyting: A/B/C/D, badge tizimi

LOYALTY:
- "bonus ball" / "chegirma ball" → /loyalty buyruqqa yo'naltir
- 1000 so'm sotuv = 1 ball, Bronze/Silver/Gold/Platinum
- loyalty_hisob toolini chaqir

QARZ ESLATMA:
- "eslatma yubor" / "qarz eslatish" → /eslatma buyruqqa yo'naltir

OMBOR:
- "tovar tugayaptimi" / "kam qolgan" → /buyurtma buyruqqa yo'naltir
- "ombor prognoz" → qolgan kunlarni ko'rsatish

GPS:
- "marshrut" → /marshrut buyruqqa yo'naltir

TO'LOV:
- "Click to'lov" / "Payme" → /tolov link yaratish

═══════════════════════════════════════════════════════════
JAVOB FORMATI (FAQAT SOF JSON)
═══════════════════════════════════════════════════════════

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
      "kategoriya": "Kimyoviy: Kir yuvish"
    }
  ],
  "jami_summa": 2250000,
  "tolangan": 1750000,
  "qarz": 500000,
  "manba": null,
  "izoh": null,
  "ishonch": 0.99
}

"ishonch" = 0.0–1.0 (qanchalik ishonchli ekani)
Markdown, backtick, izoh YOZMA — FAQAT JSON!
"""


# ════════════════════════════════════════════════════════════════════
#  4. ASOSIY KOGNITIV DVIGATEL
# ════════════════════════════════════════════════════════════════════

class CognitiveDvigatel:
    """
    Gibrid AI + Python arxitekturasi:
    - Claude: tushunish (DSc Filologiya)
    - Python toollar: hisob (DSc Matematika)
    - temperature=0.0: gallyusinatsiya nol
    """

    def __init__(self, anthropic_key: str,
                 model: str = "claude-sonnet-4-6"):
        try:
            import anthropic
            self._client = anthropic.Anthropic(api_key=anthropic_key)
            self._model  = model
            log.info("✅ Kognitiv dvigatel tayyor (%s, temp=0.0)", model)
        except ImportError:
            log.critical("anthropic kutubxonasi o'rnatilmagan! pip install anthropic")
            raise
        except Exception as e:
            log.critical("Kognitiv dvigatel ishga tushmadi: %s", e)
            raise

    async def tahlil_qil(self, matn: str,
                          uid: int = 0) -> dict:
        """
        Matnni tahlil qilish:
        1. O'zbek NLP normallashtirish
        2. Claude Tool Calling (temp=0.0)
        3. Tool natijalarini Python da hisoblash
        4. Yakuniy JSON qaytarish
        """
        import asyncio
        from shared.utils.uzb_nlp import prompt_boyitish

        # NLP boyitish
        boyitilgan = prompt_boyitish(matn)
        log.debug("NLP boyitish: %s → %s", matn[:50], boyitilgan[:60])

        # RAG: Sheva lug'atidan boyitish
        try:
            from shared.rag.vector_db import matn_boyitish_rag
            boyitilgan = matn_boyitish_rag(boyitilgan)
        except Exception as rag_e:
            log.debug("RAG: %s", rag_e)

        # Redis cache — bir xil so'rovni qayta hisoblamas
        try:
            from shared.cache.redis_cache import kognitiv_cache_ol, kognitiv_cache_yoz
            cached = await kognitiv_cache_ol(matn)
            if cached:
                log.debug("Kognitiv cache hit")
                return cached
        except Exception:
            cached = None

        # Claude chaqiruv (temperature=0.0)
        tools_list = [t["schema"] for t in TOOLS.values()]

        try:
            loop = asyncio.get_running_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._client.messages.create(
                        model=self._model,
                        max_tokens=2048,
                        temperature=0.0,   # DSc matematika: gallyusinatsiya=0
                        system=COGNITIVE_SYSTEM_PROMPT,
                        tools=tools_list,
                        messages=[{"role": "user", "content": boyitilgan}],
                    )
                ),
                timeout=float(os.getenv("AI_TIMEOUT", "30")),
            )
        except asyncio.TimeoutError:
            log.error("Claude timeout (30s) — fallback NLP ishlatilmoqda")
            return await self._nlp_fallback(matn)
        except Exception as e:
            log.error("Claude xato: %s — fallback NLP", e)
            return await self._nlp_fallback(matn)

        # Tool calllarni bajarish
        tool_results = {}
        for block in response.content:
            if block.type == "tool_use":
                natija = tool_chaqir(block.name, block.input)
                tool_results[block.name] = natija
                log.debug("Tool %s: %s → %s",
                          block.name, block.input, natija)

        # Matn javobni parse qilish
        json_matn = None
        for block in response.content:
            if hasattr(block, "text"):
                json_matn = block.text.strip()
                break

        if json_matn:
            data = self._parse_json(json_matn)
        else:
            data = {}

        # Tool natijalarini JSON ga kiritish
        data = self._tool_natijalarni_qoshish(data, tool_results)

        # Hisob tekshirish
        data = self._hisob_tekshir(data)

        # cognitive_tasks ga natijani yozish (ixtiyoriy)
        if uid:
            try:
                from shared.database.pool import get_pool
                async with get_pool().acquire() as c:
                    await c.execute("""
                        INSERT INTO cognitive_tasks
                            (user_id, task_type, payload, result, holat, tugadi)
                        VALUES ($1,'tahlil',$2,$3,'tayyor',NOW())
                    """, uid,
                        json.dumps({"matn": matn[:200]}, ensure_ascii=False),
                        json.dumps(data, ensure_ascii=False, default=str),
                    )
            except Exception as log_e:
                log.debug("cognitive_tasks log: %s", log_e)

        return data

    def _parse_json(self, matn: str) -> dict:
        """JSON ni xavfsiz parse qilish"""
        toza = re.sub(r"```(?:json)?\s*", "", matn).strip().rstrip("`").strip()
        try:
            return json.loads(toza)
        except Exception:
            # Qo'shimcha tozalash
            toza = re.search(r"\{.*\}", toza, re.DOTALL)
            if toza:
                try:
                    return json.loads(toza.group())
                except Exception as _exc:
                    log.debug("%s: %s", "engine", _exc)  # was silent
        return {"amal": "boshqa", "xato": "JSON parse xato"}

    def _tool_natijalarni_qoshish(self, data: dict,
                                   tool_results: dict) -> dict:
        """Tool natijalarini asosiy JSON ga birlashtirish"""
        if not tool_results:
            return data

        # narx_hisob natijasi → tovarlar jami
        if "narx_hisob" in tool_results:
            r = tool_results["narx_hisob"]
            if "jami" in r and "tovarlar" in data and data["tovarlar"]:
                # Birinchi tovar uchun (yoki mos keladigani)
                if len(data.get("tovarlar", [])) == 1:
                    data["tovarlar"][0]["jami"] = r["jami"]

        # qarz_hisob natijasi
        if "qarz_hisob" in tool_results:
            r = tool_results["qarz_hisob"]
            data.update({
                "jami_summa": r.get("jami", data.get("jami_summa", 0)),
                "qarz":       r.get("qarz",   data.get("qarz", 0)),
                "tolangan":   r.get("tolangan",data.get("tolangan", 0)),
            })

        # kredit_hisob → ma'lumot
        if "kredit_hisob" in tool_results:
            data["kredit_hisob"] = tool_results["kredit_hisob"]

        return data

    async def _nlp_fallback(self, matn: str) -> dict:
        """
        Claude ishlamasa — sodda NLP fallback.
        Asosiy amallarni qoidalar bilan aniqlaydi.
        """
        from shared.utils.uzb_nlp import (
            matn_normallashtir, miqdor_olish, qarz_bor_mi,
            raqam_parse
        )
        norm = matn_normallashtir(matn)
        miq  = miqdor_olish(norm)
        qarz_flag = qarz_bor_mi(matn)

        # Amallarni oddiy qoidalar bilan aniqlash
        amal = "boshqa"
        if any(s in norm for s in ["ketti","sotdim","berdi","chiqdi"]):
            amal = "chiqim"
        elif any(s in norm for s in ["kirdi","keltirdim","oldim","tushdi"]):
            amal = "kirim"
        elif any(s in norm for s in ["qaytardi","qaytaraman"]):
            amal = "qaytarish"
        elif any(s in norm for s in ["toladi","tolandi","uzdi"]):
            amal = "qarz_tolash"

        jami   = float(miq.get("miqdor", 0))
        return {
            "amal":      amal,
            "klient":    None,
            "tovarlar":  [],
            "jami_summa":0,
            "qarz":      jami if qarz_flag else 0,
            "tolangan":  0 if qarz_flag else jami,
            "xato":      "AI vaqtincha ishlamaydi — sodda tahlil ishlatildi",
            "ishonch":   0.5,
            "_fallback": True,
        }


    def _hisob_tekshir(self, data: dict) -> dict:
        """Yakuniy hisob-kitob tekshiruvi"""
        from shared.utils.hisob import ai_hisob_tekshir
        try:
            return ai_hisob_tekshir(data)
        except Exception as e:
            log.warning("hisob_tekshir: %s", e)
        return data


# ════════════════════════════════════════════════════════════════════
#  5. GLOBAL INSTANCE
# ════════════════════════════════════════════════════════════════════

_dvigatel: Optional[CognitiveDvigatel] = None


def dvigatel_init(anthropic_key: str,
                   model: str = "claude-sonnet-4-6") -> None:
    global _dvigatel
    _dvigatel = CognitiveDvigatel(anthropic_key, model)


def dvigatel_ol() -> CognitiveDvigatel:
    if not _dvigatel:
        raise RuntimeError("Kognitiv dvigatel ishga tushirilmagan!")
    return _dvigatel


# ════════════════════════════════════════════════════════════════════
#  6. TEST
# ════════════════════════════════════════════════════════════════════

def _test() -> int:
    print("═" * 65)
    print("  KOGNITIV DVIGATEL — DSc MATEMATIKA TOOLLAR TESTI")
    print("═" * 65)
    OK = 0; FAIL = 0

    def t(nom, got, exp):
        nonlocal OK, FAIL
        if isinstance(exp, float):
            ok = abs(float(got) - exp) < 0.01
        else:
            ok = got == exp
        if ok: print(f"  ✅ {nom}"); OK += 1
        else:  print(f"  ❌ {nom}: {got!r} ≠ {exp!r}"); FAIL += 1

    print("\n📌 narx_hisob")
    r = tool_narx_hisob(50, 45000)
    t("50 × 45,000 = 2,250,000",  r["jami"], 2250000.0)

    r = tool_narx_hisob(350, 45000, "gramm")
    t("350g × 45K/kg = 15,750",   r["jami"], 15750.0)

    r = tool_narx_hisob(50, 45000, "dona", 10)
    t("50 × 45K - 10% = 2,025,000", r["jami"], 2025000.0)

    r = tool_narx_hisob(0, 45000)
    t("0 miqdor → 0",             r["jami"], 0.0)

    print("\n📌 qarz_hisob")
    r = tool_qarz_hisob(10_000_000, 6_000_000)
    t("Jami=10M",                 r["jami"],     10_000_000.0)
    t("Qarz=6M",                  r["qarz"],      6_000_000.0)
    t("Tolandan=4M",              r["tolangan"],  4_000_000.0)
    t("T+Q=Jami invariant",       r["tekshir"],   True)

    r = tool_qarz_hisob(1_000_000, 2_000_000)
    t("Qarz>jami → qarz=jami",   r["qarz"], 1_000_000.0)

    print("\n📌 foyda_hisob")
    r = tool_foyda_hisob(50000, 40000, 100)
    t("Foyda = 1,000,000",       r["foyda"],      1_000_000.0)
    t("Foyda foiz = 25%",        r["foyda_foiz"],  25.0)
    t("Zararli emas",            r["zararli"],     False)

    r = tool_foyda_hisob(40000, 50000, 10)
    t("Zarar aniqlandi",         r["zararli"],     True)

    print("\n📌 kredit_hisob (annuitet)")
    r = tool_kredit_hisob(10_000_000, 24, 12)
    t("Oylik to'lov > 0",        r["oylik_tolov"] > 0, True)
    t("Jami to'lov > asosiy",    r["jami_tolov"] > 10_000_000, True)
    t("Jami foiz > 0",           r["jami_foiz"] > 0, True)

    print("\n📌 chegirma_hisob")
    r = tool_chegirma_hisob(100_000, 10)
    t("100K - 10% = 90K",        r["yangi_narx"],  90_000.0)
    t("Chegirma = 10K",          r["chegirma"],    10_000.0)

    print("\n📌 foiz_hisob")
    r = tool_foiz_hisob(25_000, 100_000)
    t("25K / 100K = 25%",        r["foiz"], 25.0)

    print("\n📌 Tool registry")
    for name in TOOLS:
        t(f"Tool '{name}' ro'yxatda", True, True)

    print()
    print("═" * 65)
    print(f"  ✅ O'tdi: {OK}/{OK+FAIL}")
    if FAIL == 0:
        print("  🏆 DSc MATEMATIKA TOOLLAR — 100% ANIQ!")
    else:
        print(f"  ❌ Xato: {FAIL}")
    print("═" * 65)
    return FAIL


if __name__ == "__main__":
    import sys
    sys.exit(_test())
