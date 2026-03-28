"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — VISION AI MIKROSKOP v3.0                                      ║
║                                                                          ║
║  3 BOSQICHLI TAHLIL — XUDDI MIKROSKOPDA KO'RGANDAY:                    ║
║                                                                          ║
║  BOSQICH 1: UMUMIY KO'RISH — hujjat turi, tuzilma, sifat              ║
║  BOSQICH 2: SINCHIKLAB O'QISH — har bir qator, raqam, belgi           ║
║  BOSQICH 3: TEKSHIRISH — hisob, validatsiya, cross-check              ║
║                                                                          ║
║  + 3 xil rasm versiya (original, kontrast, qora-oq)                    ║
║  + Eng yaxshi natijani tanlash                                           ║
║  + Matematik validatsiya (miqdor × narx = jami)                        ║
║  + Dublikat va qo'shib o'qish tekshiruvi                               ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import asyncio, io, json, logging, subprocess, tempfile, os, re
from typing import Optional
log = logging.getLogger(__name__)
_gemini_client = None
_VISION_MODEL = os.environ.get("VISION_MODEL", "gemini-2.5-pro")


# ═══════════════════════════════════════════════════════════════
#  BOSQICH 1: UMUMIY KO'RISH PROMPT
# ═══════════════════════════════════════════════════════════════

_PROMPT_1_UMUMIY = """Sen dunyo bo'yicha eng kuchli hujjat OCR EKSPERTIZAN. 
Rasmni MIKROSKOP ostida ko'rganday — HAR BIR BELGINI ALOHIDA TEKSHIRIB tahlil qil.

╔═══════════════════════════════════════════╗
║  QOIDA #0: HAR BIR PIKSELGA E'TIBOR BER  ║
╚═══════════════════════════════════════════╝

Rasmda ko'ringan HAMMA narsani o'qi:
- HAR BIR harf, raqam, belgi, chiziq, nuqta, vergul
- Chekka va burchaklardagi kichik yozuvlar
- Pastki yoki ustki qismga qo'lda yozilgan izohlar
- Qog'oz chetidagi telefon raqamlari, ismlar
- Shtamp, muhr, imzo joylari
- Rasm ichidagi rasm (shtrix-kod, QR, logo)

════════════════════════════════════════════
 1-QADAM: HAR BIR SON NI PIKSEL DARAJADA O'QI
════════════════════════════════════════════

RAQAMLAR — eng XAVFLI qism. Har bir raqamni ALOHIDA tekshir:

   ╔═══╦═══════════════════════════════════════════════════╗
   ║ 0 ║ Yumaloq, ichida bo'sh. "O" harfidan farqi — raqam║
   ║   ║ kontekstda (narx yonida) bo'lsa DOIM 0.            ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 1 ║ BITTA TO'G'RI CHIZIQ. Tepada serif bo'lishi mumkin.║
   ║   ║ "7" dan farqi — 7 da tepada GORIZONTAL chiziq bor. ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 2 ║ Tepada dumaloq, pastda gorizontal chiziq. ║
   ║   ║ "Z" dan farqi — 2 da tepasi dumaloq.               ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 3 ║ O'ng tomonga ochiq ikkita yay. ║
   ║   ║ "8" dan farqi — 3 da chap tomon OCHIQ.             ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 4 ║ Tepada burchak, o'rtada gorizontal chiziq.         ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 5 ║ Tepada gorizontal, keyin pastga dumaloq.           ║
   ║   ║ "S" dan farqi — 5 da tepasi BURCHAKLI.             ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 6 ║ Tepadan pastga dumaloq, pastda YUMALOQ.            ║
   ║   ║ "9" dan farqi — 6 da dumaloq PASTDA.               ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 7 ║ TEPADA GORIZONTAL chiziq + pastga diagonal.        ║
   ║   ║ "1" dan farqi — 7 da tepada GORIZONTAL bor.        ║
   ║   ║ EHTIYOT: Qo'lyozmada 7 ga ko'pincha o'rtasiga     ║
   ║   ║ chiziq tortiladi (Yevropa uslubi)                  ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 8 ║ Ikkita yumaloq ustma-ust. TO'LIQ YOPIQ.           ║
   ║   ║ "3" dan farqi — 8 da chap tomon ham YOPIQ.         ║
   ╠═══╬═══════════════════════════════════════════════════╣
   ║ 9 ║ Tepada YUMALOQ, pastga chiziq.                     ║
   ║   ║ "6" dan farqi — 9 da dumaloq TEPADA.               ║
   ╚═══╩═══════════════════════════════════════════════════╝

MING AJRATGICH (3 xil):
  1.500.000 = 1500000 (nuqta = ming ajratgich)
  1,500,000 = 1500000 (vergul = ming ajratgich)
  1 500 000 = 1500000 (bo'shliq = ming ajratgich)
  
KASR VA MING FARQI:
  Narx yonida "1.500" → 1500 (ming besh yuz)
  Miqdor yonida "1.5" → 1.5 (bir yarim)
  Narx yonida "45.000" → 45000 (qirq besh ming)
  Miqdor yonida "0.5" → 0.5 (yarim)
  QOIDA: 3+ raqam nuqtadan keyin → MING. 1-2 raqam → KASR.

════════════════════════════════════════════
 2-QADAM: HAR BIR HARF NI SINCHIKLAB O'QI
════════════════════════════════════════════

HARFLAR — tovar nomlari va klient ismlari uchun muhim:

O'ZBEK MAXSUS HARFLAR:
  O' = O + ' (apostrof), SH = Ш, CH = Ч
  G' = Ғ (g bilan adashtirma), NG = НГ
  
RUS → O'ZBEK TRANSLITERATSIYA:
  Ш → SH, Щ → SH, Ч → CH, Ц → TS
  Ж → J, Х → X, Ё → YO, Э → E, Ю → YU, Я → YA

TOVAR NOMLARI — QO'LYOZMADA QISQARTIRILGAN:
  "ARL" = Ariel, "TD" = Tide, "FR" = Fairy
  "PRS" = Persil, "DOM" = Domestos, "VIM" = Vim
  "CLR" = Clorox, "MR.P" = Mr.Proper
  "GIL" = Gillette, "H&S" = Head&Shoulders
  "P&G" = Procter&Gamble, "UNL" = Unilever
  Agar qisqartma bo'lsa → TO'LIQ nomini yoz

KATTA va KICHIK HARFLAR:
  BARCHASI KATTA = SARLAVHA yoki MUHIM
  Birinchisi katta = Ism yoki Tovar nomi
  Hammasi kichik = oddiy matn

════════════════════════════════════════════
 3-QADAM: MAXSUS BELGILAR VA CHIZIQLARGA E'TIBOR
════════════════════════════════════════════

  "✓" yoki "✔" = TO'LANGAN, bajarildi
  "✗" yoki "✘" = BEKOR, o'chirildi
  "+" = qo'shildi, to'langan
  "—" yoki "–" = qarz, hali to'lanmagan
  "=" = teng, jami
  "#" yoki "№" = raqam, tartib
  "*" = muhim, yulduzcha
  Usti CHIZILGAN = O'CHIRILGAN → HISOBGA OLMA
  Pastga yozilgan kichik = TUZATISH (yangi qiymat)
  Qizil rang = MUHIM yoki OGOHLANTIRISH
  Ko'k rang = ODDIY yozuv
  Qalam (kulrang) = DASTLABKI / VAQTINCHALIK

════════════════════════════════════════════
 4-QADAM: BIRLIKLAR
════════════════════════════════════════════

  шт / дн / ta / dona / д = DONA
  кг / кило / kg = KILOGRAMM
  гр / gr / g = GRAMM (1000 gr = 1 kg)
  кор / коробка / quti / к = KAROBKA
  мешок / qop / мш / м = QOP
  бут / бутылка / b = BUTILKA
  пач / пачка / п = PACHKA
  блок / бл = BLOK (odatda 10-50 pachka)
  литр / л / lt / L = LITR
  рул / рулон = RULON
  упак / уп = QADOQ

  Birlik ko'rinmasa → kontekstdan tushun:
  - Sovun, shampun = DONA
  - Un, guruch = QOP yoki KG
  - Suv, sharbat = BUTILKA yoki LITR

════════════════════════════════════════════
 5-QADAM: JADVAL VA TUZILMA
════════════════════════════════════════════

NAKLADNOY JADVALI (standart):
  № | Tovar nomi | Miqdor | Birlik | Narx | Jami
  Ba'zan ustun sarlavha YO'Q — kontekstdan tushun
  Oxirgi ustun = DOIM jami (miqdor × narx)
  Pastdagi ENG KATTA raqam = JAMI SUMMA
  "ИТОГО" / "ЖАМИ" / "JAMI" / "TOTAL" = YAKUNIY

QO'LYOZMA DAFTAR:
  Har qator = bitta klient YOKI bitta operatsiya
  O'ng tomondagi raqam = QOLDIQ QARZ
  Sahifa raqami va sana tepada/pastda

CHEK:
  Tovar nomlari qisqa (20 belgigacha)
  Har qatorda: nomi | miqdor | narx | jami
  Eng pastda: ИТОГО = JAMI SUMMA

════════════════════════════════════════════
 6-QADAM: MATEMATIK TEKSHIRISH
════════════════════════════════════════════

HAR TOVAR UCHUN:
  miqdor × narx = jami → TEKSHIR!
  Agar TENG EMAS:
    jami YAXLITLANGAN (1000 ga bo'linadi) → jami TO'G'RI, narx = jami / miqdor
    narx YAXLITLANGAN → narx TO'G'RI, jami = miqdor × narx
    Ikkisi ham NOANIQ → izohga yoz

BARCHA TOVARLAR JAMISI = jami_summa → TEKSHIR!
  Agar TENG EMAS → izohga necha farq ekanini yoz

jami_summa = tolangan + qarz → TEKSHIR!

════════════════════════════════════════════
 7-QADAM: JSON NATIJA
════════════════════════════════════════════

{
  "tur": "nakladnoy | chek | daftar | kvitansiya | spiska | faktura | boshqa",
  "klient": "ism (ANIQ o'qi, null aks holda)",
  "sotuvchi": "ism (ANIQ o'qi, null aks holda)",
  "sana": "DD.MM.YYYY (null aks holda)",
  "raqam": "hujjat raqami (null aks holda)",
  "tovarlar": [
    {
      "nomi": "tovar nomi — TO'LIQ, QISQARTMASIZ",
      "miqdor": 0,
      "birlik": "dona",
      "narx": 0,
      "jami": 0,
      "noaniq": false
    }
  ],
  "jami_summa": 0,
  "tolangan": 0,
  "qarz": 0,
  "qoshimcha_matn": "telefon, manzil, imzo, muhr, boshqa matn — HAMMASI",
  "ishonch": 0.0,
  "izoh": "nima aniq, nima noaniq, qaysi raqam shubhali",
  "sifat": "aniq | o'rtacha | yomon",
  "ogohlantirishlar": ["har bir muammo alohida yozilsin"]
}

ISHONCH:
  0.95-1.0 = HAR BIR belgi 100% aniq
  0.85-0.95 = asosiy to'g'ri, 1-2 ta NOANIQ
  0.70-0.85 = ko'p qism to'g'ri, ba'zi raqamlar SHUBHALI
  0.50-0.70 = yarmi o'qildi
  0.0-0.50 = deyarli o'qib BO'LMAYDI

FAQAT JSON QAYTAR — boshqa HECH NARSA yozma!"""


_PROMPT_DAFTAR = """Bu QO'LYOZMA QARZ DAFTARI — HAR BIR BELGINI MIKROSKOPDA O'QI!

╔═══════════════════════════════════════════════╗
║  QO'LYOZMA O'QISH MAXSUS QOIDALARI           ║
╚═══════════════════════════════════════════════╝

QALAM / RUCHKA YOZUVI:
- Ko'k ruchka = ASOSIY yozuv
- Qizil ruchka = MUHIM / OGOHLANTIRISH / XATO
- Qalam (kulrang) = VAQTINCHALIK / DASTLABKI
- Qalin yozuv = MUHIM summa yoki ism

BELGILAR:
- Usti CHIZILGAN = TO'LANGAN yoki O'CHIRILGAN → "tolangan": true
- "✓" / "+" / "V" belgisi = TO'LANGAN
- "—" / "–" / uzun chiziq = QARZ BOR
- Yoniga kichikroq yozilgan = TUZATISH (yangi qiymat ishlatiladi)
- Doira ichidagi raqam = MUHIM / E'TIBOR

DAFTAR TUZILMASI:
- Har QATOR = bitta klient YOKI bitta operatsiya
- O'ng chekkadagi raqam = QOLDIQ QARZ
- Chap chekkadagi raqam = TARTIB RAQAMI
- Sahifa tepasidagi sana = YOZUV SANASI
- Sahifa pastidagi "итого"/"жами" = SAHIFA JAMISI
- Ikki chiziq orasidagi = BITTA KUN yoki BITTA KLIENT

ISMLAR:
- Faqat ISM yozilgan = KLIENT
- ISM + RAQAM = KLIENT + QARZ SUMMASI
- ISM + usti chizilgan RAQAM = KLIENT + TO'LANGAN QARZ
- ISM + ikkita RAQAM = ESKI QARZ + YANGI QARZ

""" + _PROMPT_1_UMUMIY


_PROMPT_CHEK = """Bu KASSA CHEKI yoki MINI PRINTER CHEKI — HAR BIR BELGINI O'QI!

╔═══════════════════════════════════════════════╗
║  CHEK O'QISH MAXSUS QOIDALARI                ║
╚═══════════════════════════════════════════════╝

TOVAR NOMLARI — QISQARTIRILGAN:
  "ARL" / "ARIEL" = Ariel
  "TD" / "TIDE" = Tide
  "FR" / "FAIRY" = Fairy
  "PRS" / "PERSIL" = Persil
  "H&S" = Head & Shoulders
  Qisqartma ko'rsa → TO'LIQ nomini yoz!

NARXLAR:
  "45 000" = 45000 so'm
  "45.000" = 45000 so'm (nuqta = ming ajratgich)
  "45,00" = 45 so'm (vergul = tiyin ajratgich, KAMDAN KAM)
  
JAMI QATOR:
  "ИТОГО" / "TOTAL" / "ЖАМИ" / "JAMI" = YAKUNIY SUMMA
  "ПОДИТОГО" / "SUBTOTAL" = ORALIQ JAMI
  "НДС" / "QQS" / "VAT" = SOLIQ (alohida ko'rsat)
  "СДАЧА" / "QAYTIM" = QAYTIM PUL
  "НАЛИЧНЫЕ" / "NAQD" = NAQD TO'LOV
  "КАРТА" / "KARTA" / "CARD" = KARTA BILAN
  "ПЕРЕВОД" / "O'TKAZMA" = BANK O'TKAZMASI

QR KOD / SHTRIX-KOD:
  Bu raqamlar tovar ma'lumoti EMAS → O'TKAZIB YUBOR

""" + _PROMPT_1_UMUMIY


# ═══════════════════════════════════════════════════════════════
#  RASM PRE-PROCESSING — 3 versiya
# ═══════════════════════════════════════════════════════════════

async def _rasm_versiyalar(image_bytes: bytes) -> list[bytes]:
    """
    Rasmning 3 versiyasini yaratish:
    1. Original (o'zgarishsiz)
    2. Yuqori kontrast + o'tkirlash
    3. Grayscale + yuqori kontrast (qo'lyozma uchun ideal)
    """
    versiyalar = [image_bytes]
    
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as inp:
            inp.write(image_bytes); inp_path = inp.name
        
        loop = asyncio.get_event_loop()
        
        # Versiya 2: Yuqori kontrast
        out2 = inp_path.replace(".jpg", "_v2.jpg")
        await loop.run_in_executor(None, lambda: subprocess.run(
            ["ffmpeg","-y","-i",inp_path,
             "-vf","eq=contrast=1.5:brightness=0.08,unsharp=5:5:1.5",
             "-q:v","2",out2],
            capture_output=True, timeout=10))
        if os.path.exists(out2) and os.path.getsize(out2) > 0:
            with open(out2,"rb") as f: versiyalar.append(f.read())
        
        # Versiya 3: Grayscale + kontrast (daftar uchun)
        out3 = inp_path.replace(".jpg", "_v3.jpg")
        await loop.run_in_executor(None, lambda: subprocess.run(
            ["ffmpeg","-y","-i",inp_path,
             "-vf","format=gray,eq=contrast=1.8:brightness=0.1,unsharp=7:7:2.0",
             "-q:v","2",out3],
            capture_output=True, timeout=10))
        if os.path.exists(out3) and os.path.getsize(out3) > 0:
            with open(out3,"rb") as f: versiyalar.append(f.read())
        
        # Tozalash
        for p in [inp_path, out2, out3]:
            try: os.unlink(p)
            except Exception: pass
    except Exception as e:
        log.debug("Rasm versiya: %s", e)
    
    return versiyalar


# ═══════════════════════════════════════════════════════════════
#  INIT
# ═══════════════════════════════════════════════════════════════

def ishga_tushir(api_key: str, model: str = "") -> None:
    global _gemini_client, _VISION_MODEL
    if model: _VISION_MODEL = model
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
        log.info("✅ Vision MIKROSKOP v3 ulandi (%s)", _VISION_MODEL)
    except Exception as e:
        log.warning("⚠️ Vision AI ulanmadi: %s", e)


def _prompt_tanlash(tur_hint: str = "") -> str:
    if tur_hint in ("daftar","spiska","qarz"): return _PROMPT_DAFTAR
    elif tur_hint in ("chek","check","receipt"): return _PROMPT_CHEK
    return _PROMPT_1_UMUMIY


def _sync_tahlil(image_bytes: bytes, mime: str, prompt: str) -> dict:
    if not _gemini_client:
        return {"tur":"xato","ishonch":0.0,"izoh":"Vision AI ishga tushirilmagan"}
    from google.genai import types
    try:
        response = _gemini_client.models.generate_content(
            model=_VISION_MODEL,
            contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime), prompt],
            config=types.GenerateContentConfig(temperature=0.05, max_output_tokens=16384))
    except Exception: 
        response = _gemini_client.models.generate_content(
            model=_VISION_MODEL,
            contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime), prompt])
    matn = (response.text or "").strip()
    try:
        if "```json" in matn: matn = matn.split("```json")[1].split("```")[0].strip()
        elif "```" in matn: matn = matn.split("```")[1].split("```")[0].strip()
        j0 = matn.find("{"); j1 = matn.rfind("}") + 1
        if j0 >= 0 and j1 > j0: matn = matn[j0:j1]
        return _validatsiya(json.loads(matn))
    except json.JSONDecodeError:
        # Kesilgan JSON ni tuzatishga urinish
        try:
            # Oxirgi to'liq tovar elementigacha kesish
            idx = matn.rfind('},')
            if idx > 0:
                matn_fix = matn[:idx+1] + '],"jami_summa":0,"ishonch":0.5,"izoh":"kesilgan javob"}'
                return _validatsiya(json.loads(matn_fix))
        except Exception:
            pass
        log.warning("Vision JSON xato: %s", matn[:300])
        return {"tur":"noaniq","ishonch":0.0,"izoh":matn[:500]}


# ═══════════════════════════════════════════════════════════════
#  VALIDATSIYA — MATEMATIK TEKSHIRISH
# ═══════════════════════════════════════════════════════════════

def _validatsiya(data: dict) -> dict:
    tovarlar = data.get("tovarlar", [])
    ogohlantirishlar = list(data.get("ogohlantirishlar", []))
    hisob_jami = 0
    
    for t in tovarlar:
        t.setdefault("nomi","?"); t.setdefault("miqdor",0)
        t.setdefault("birlik","dona"); t.setdefault("narx",0)
        
        miq = float(t.get("miqdor") or 0)
        narx = float(t.get("narx") or 0)
        kutilgan = round(miq * narx, 2)
        jami = float(t.get("jami") or 0)
        
        if jami == 0 and kutilgan > 0:
            t["jami"] = kutilgan; jami = kutilgan
        elif jami > 0 and kutilgan > 0 and abs(jami - kutilgan) > max(kutilgan * 0.02, 100):
            # 2% dan ko'p farq — kuchliroq tekshirish
            # Agar jami yaxlitlangan raqam → jami to'g'ri, narxni hisoblash
            if jami % 1000 == 0 and kutilgan % 1000 != 0 and miq > 0:
                t["narx"] = round(jami / miq)
                narx = t["narx"]
            else:
                t["jami"] = kutilgan
                jami = kutilgan
            ogohlantirishlar.append(f"{t['nomi']}: jami tuzatildi")
        
        hisob_jami += jami
    
    hisob_jami = round(hisob_jami, 2)
    aytilgan = float(data.get("jami_summa") or 0)
    
    if hisob_jami > 0 and aytilgan == 0:
        data["jami_summa"] = hisob_jami
    elif hisob_jami > 0 and aytilgan > 0:
        farq = abs(hisob_jami - aytilgan)
        if farq > max(aytilgan * 0.02, 500):
            # Rasmda ko'ringan jami_summa ni ishonchli deb olish
            # faqat tovar hisob xato bo'lganda
            if aytilgan % 1000 == 0:
                data["jami_summa"] = aytilgan  # Rasmda yozilgan aniqroq
            else:
                data["jami_summa"] = hisob_jami
            ogohlantirishlar.append(f"Jami farq: rasmda {aytilgan}, hisob {hisob_jami}")
    
    jami = float(data.get("jami_summa") or 0)
    tolangan = float(data.get("tolangan") or 0)
    qarz = float(data.get("qarz") or 0)
    if jami > 0 and tolangan == 0 and qarz == 0:
        data["tolangan"] = jami
    elif jami > 0 and tolangan > 0 and qarz == 0 and tolangan < jami:
        data["qarz"] = round(jami - tolangan, 2)
    
    # Dublikat tovar tekshirish
    seen = {}
    for t in tovarlar:
        key = t.get("nomi","").lower().strip()
        if key in seen:
            ogohlantirishlar.append(f"Takroriy tovar: {t['nomi']}")
        seen[key] = True
    
    data.setdefault("tur","boshqa"); data.setdefault("klient",None)
    data.setdefault("sana",None); data.setdefault("ishonch",0.5)
    data.setdefault("izoh",""); data.setdefault("sifat","o'rtacha")
    data["ogohlantirishlar"] = ogohlantirishlar
    
    return data


# ═══════════════════════════════════════════════════════════════
#  ASOSIY TAHLIL — 3 BOSQICHLI MIKROSKOP
# ═══════════════════════════════════════════════════════════════

async def rasm_tahlil(image_bytes: bytes, mime: str = "image/jpeg", tur_hint: str = "") -> dict:
    """
    3 BOSQICHLI MIKROSKOP TAHLIL:
    
    1. Original rasm → tahlil
    2. Agar ishonch < 0.8 → 3 versiyada qayta tahlil
    3. Eng yaxshi natijani tanlash + cross-validatsiya
    """
    if not _gemini_client:
        return {"tur":"xato","ishonch":0.0,"izoh":"Vision AI o'chirilgan"}
    
    prompt = _prompt_tanlash(tur_hint)
    loop = asyncio.get_event_loop()
    
    try:
        # === BOSQICH 1: Original rasm ===
        natija1 = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _sync_tahlil(image_bytes, mime, prompt)),
            timeout=60)
        
        ishonch1 = float(natija1.get("ishonch", 0))
        tovar1 = len(natija1.get("tovarlar", []))
        
        log.info("🔬 Mikroskop 1-bosqich: tur=%s ishonch=%.0f%% tovar=%d",
                 natija1.get("tur","?"), ishonch1*100, tovar1)
        
        # Agar yuqori ishonch → darhol qaytarish
        if ishonch1 >= 0.85 and tovar1 > 0:
            return natija1
        
        # === BOSQICH 2: 3 versiya bilan qayta tahlil ===
        log.info("🔬 Mikroskop 2-bosqich: rasm versiyalar tayyorlanmoqda...")
        versiyalar = await _rasm_versiyalar(image_bytes)
        
        eng_yaxshi = natija1
        eng_yaxshi_ball = _ball_hisob(natija1)
        
        for i, vers in enumerate(versiyalar[1:], 2):  # 1-versiya = original, skip
            try:
                n = await asyncio.wait_for(
                    loop.run_in_executor(None, lambda v=vers: _sync_tahlil(v, mime, prompt)),
                    timeout=45)
                ball = _ball_hisob(n)
                log.debug("🔬 Versiya %d: ishonch=%.0f%% tovar=%d ball=%.1f",
                          i, float(n.get("ishonch",0))*100, len(n.get("tovarlar",[])), ball)
                if ball > eng_yaxshi_ball:
                    eng_yaxshi = n
                    eng_yaxshi_ball = ball
            except Exception as e:
                log.debug("Versiya %d xato: %s", i, e)
        
        # === BOSQICH 3: Cross-validatsiya ===
        if tovar1 > 0 and len(eng_yaxshi.get("tovarlar",[])) > 0:
            eng_yaxshi = _cross_validate(natija1, eng_yaxshi)
        
        log.info("🔬 Mikroskop NATIJA: tur=%s ishonch=%.0f%% tovar=%d",
                 eng_yaxshi.get("tur","?"), 
                 float(eng_yaxshi.get("ishonch",0))*100,
                 len(eng_yaxshi.get("tovarlar",[])))
        
        return eng_yaxshi
        
    except asyncio.TimeoutError:
        return {"tur":"xato","ishonch":0.0,"izoh":"Timeout — rasm juda katta"}
    except Exception as e:
        log.error("Vision mikroskop xato: %s", e)
        return {"tur":"xato","ishonch":0.0,"izoh":"Tahlil vaqtincha ishlamayapti"}


def _ball_hisob(natija: dict) -> float:
    """Natija sifatini baholash — eng yaxshisini tanlash uchun."""
    ishonch = float(natija.get("ishonch", 0))
    tovarlar = natija.get("tovarlar", [])
    tovar_soni = len(tovarlar)
    
    # Asosiy ball = ishonch
    ball = ishonch * 50
    
    # Tovar soni bonus
    ball += min(tovar_soni * 3, 20)
    
    # Jami summa bor — bonus
    if natija.get("jami_summa") and float(natija.get("jami_summa",0)) > 0:
        ball += 10
    
    # Klient ismi bor — bonus
    if natija.get("klient"):
        ball += 5
    
    # Ogohlantirishlar — jarima
    ball -= len(natija.get("ogohlantirishlar", [])) * 2
    
    # Hisob to'g'riligi — bonus
    hisob_ok = True
    for t in tovarlar:
        miq = float(t.get("miqdor",0)); narx = float(t.get("narx",0))
        jami = float(t.get("jami",0))
        if miq > 0 and narx > 0 and jami > 0:
            kutilgan = miq * narx
            if abs(jami - kutilgan) > max(kutilgan * 0.02, 100):
                hisob_ok = False
                break
    if hisob_ok and tovar_soni > 0:
        ball += 15
    
    return ball


def _cross_validate(n1: dict, n2: dict) -> dict:
    """Ikki natijani solishtirish va eng yaxshisini qurish."""
    # Agar ikkalasi bir xil tovar soniga ega — ishonchlirog'ini olish
    t1 = n1.get("tovarlar", [])
    t2 = n2.get("tovarlar", [])
    
    # Eng ko'p tovar topgan = yaxshiroq (odatda)
    if len(t2) > len(t1) * 1.3:
        return n2  # 2-natija ancha ko'p tovar topdi
    
    # Ball bo'yicha qaytarish (allaqachon eng_yaxshi tanlangan)
    return n2


# ═══════════════════════════════════════════════════════════════
#  MAXSUS FUNKTSIYALAR
# ═══════════════════════════════════════════════════════════════

async def chek_skanerlash(image_bytes: bytes) -> dict:
    return await rasm_tahlil(image_bytes, "image/jpeg", tur_hint="chek")

async def daftar_skanerlash(image_bytes: bytes) -> dict:
    return await rasm_tahlil(image_bytes, "image/jpeg", tur_hint="daftar")

async def kop_rasm_tahlil(rasmlar: list, mime: str = "image/jpeg") -> dict:
    if not _gemini_client:
        return {"tur":"xato","ishonch":0.0,"izoh":"Vision AI o'chirilgan"}
    from google.genai import types
    contents = [types.Part.from_bytes(data=r, mime_type=mime) for r in rasmlar[:5]]
    contents.append(
        f"Bu {len(rasmlar[:5])} ta rasm BITTA HUJJATNING turli sahifalari.\n"
        "Barcha sahifalarni birgalikda o'qib, BITTA JSON natija qaytar.\n\n"
        + _PROMPT_1_UMUMIY)
    try:
        loop = asyncio.get_event_loop()
        def _ms():
            r = _gemini_client.models.generate_content(model=_VISION_MODEL, contents=contents,
                config=types.GenerateContentConfig(temperature=0.05, max_output_tokens=16384))
            m = (r.text or "").strip()
            try:
                if "```json" in m: m = m.split("```json")[1].split("```")[0].strip()
                j0=m.find("{"); j1=m.rfind("}")+1
                if j0>=0 and j1>j0: m=m[j0:j1]
                return _validatsiya(json.loads(m))
            except Exception: return {"tur":"noaniq","ishonch":0.0,"izoh":m[:500]}
        return await asyncio.wait_for(loop.run_in_executor(None, _ms), timeout=90)
    except Exception as e:
        return {"tur":"xato","ishonch":0.0,"izoh":str(e)[:200]}

def ocr_matn(image_bytes: bytes) -> Optional[str]:
    try:
        import pytesseract; from PIL import Image
        return (pytesseract.image_to_string(Image.open(io.BytesIO(image_bytes)), lang="uzb+rus+eng") or "").strip() or None
    except Exception: return None
