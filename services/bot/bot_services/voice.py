"""
SAVDOAI v25.0 — ENTERPRISE OVOZ XIZMATI
Gemini 2.5 Pro + Audio Engine

Pipeline:
1. Audio Engine: OGG -> WAV -> VAD -> Chunks
2. Gemini: Parallel transcription (Semaphore + Retry)
3. Natijalar birlashtiriladi
"""
from __future__ import annotations
import asyncio, logging, os, tempfile
import time
from pathlib import Path
from typing import Optional, Callable
from tenacity import (
    retry, stop_after_attempt,
    wait_exponential, retry_if_exception,
    before_sleep_log
)

log = logging.getLogger(__name__)

_client    = None
MODEL      = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
MAX_MB     = 100
TIMEOUT_S  = 90   # gemini-2.5-pro sekinroq lekin aniqroq
MAX_PARALLEL = 4   # 2 soat audio = 40 chunk, 4 parallel = 10 batch = tez
_semaphore = None
# STT uchun foydalanuvchi bo'yicha prompt keshi (RLS bilan); global pool ishlatilmaydi.
_STT_USER_PROMPT_CACHE: dict[int, tuple[float, str]] = {}
_PROMPT_CACHE_TTL_S = 60  # 1 daqiqa — yangi tovar tez ko'rinadi


def stt_cache_tozala(uid: int) -> None:
    """Yangi tovar qo'shilganda STT cache ni tozalash — Gemini darhol biladi."""
    _STT_USER_PROMPT_CACHE.pop(uid, None)

STT_SYSTEM_PROMPT = """Sen o'zbek tilida savdo ovozini matnga o'girayapsan. ANIQLIK — eng muhim narsa.

KONTEKST: Sotuvchi bozorda klientga tovar yozyapti. Har bir gap odatda:
"[Klient ismi] + [miqdor] + [tovar nomi] + [narx]" formatida bo'ladi.

MUHIM QO'IDALAR:
1. Timestamp QOSHMA (00:00, 00:01 kabi)
2. Faqat toza matn qaytar
3. Raqamlarni son shaklida yoz (1, 2, 56000)
4. "karobka", "dona", "shtuk", "paket", "kilo", "gramm" — o'lchov birliklari
5. "aka", "opa", "brat" — hurmat qo'shimchalari, ismga yopishtir
6. Pul so'zlari: "ming" = 000, "limon" = 100000. Masalan: "qirq besh ming" = 45000
7. Qarz so'zlari: "nasiyaga", "qarzga", "udumga", "keyinroq beradi" — aynan shu so'zlarni yoz

O'ZBEK SHEVA XUSUSIYATLARI (tushunib yoz):
- "tort" = to'rt, "ottiz" = o'ttiz, "toqqiz" = to'qqiz, "on" = o'n
- "sakiz" = sakkiz, "yeti" = yetti, "toqson" = to'qson
- "nema/neme" = nima, "kansha" = qancha, "kilu" = kilo
- Samarqand/Buxoro shevasi, Toshkent shevasi, Farg'ona shevasi — barchasini tushun

TEZ-TEZ UCHRAYDIGAN TOVAR NOMLARI (agar ovozda shunga o'xshash eshitsang, SHU NOMLARNI YOZ):
- Ariel, Persil, Tide, Omo, Sarma, Bimax, Losk
- Fairy, Pril, AOS, Sorti, Dozor, Sanfor
- Domestos, Bref, Cillit Bang, Mr.Proper, Glorix
- Dollex, Escuro, Cler, Head&Shoulders, Pantene, Clear
- Colgate, Blend-a-med, Signal, Aquafresh
- Pampers, Huggies, Molfix, Happy
- Zewa, Familia, Obuxov, Selpak

TEZ-TEZ UCHRAYDIGAN KLIENT ISMLARI:
- Nasriddin aka, Farhod aka, Sardor aka, Botir aka, Rustam aka
- Lobar opa, Nilufar opa, Madina opa, Gulnora opa
- (va boshqa o'zbek ismlari)

MISOL:
Ovoz: "nasridin akaga bitta ariyel ellik olti ming"
Natija: Nasriddin akaga 1 Ariel 56000

Ovoz: "lobar opaga ikkita kler ottiz ikki ming"
Natija: Lobar opaga 2 Cler 32000

Ovoz: "sardor akaga beshta persel qirq besh mingdan nasiyaga"
Natija: Sardor akaga 5 Persil 45000 nasiyaga"""

_PROMPT_USER = (
    "Bu O'zbek tilida savdo haqida gapirilgan ovoz xabari. "
    "Faqat aytilganlarni so'zma-so'z ANIQ yoz. "
    "Raqamlar, mahsulotlar, ismlar, pullarni XATOSIZ yoz. "
    "MUHIM: Ovozda 1 ta yoki 50 ta tovar aytilgan bo'lishi mumkin — "
    "HAMMASINI yoz, hech birini tashlab ketma! "
    "Agar 20 ta tovar aytilsa, 20 tasini HAM yoz."
)


async def _build_stt_extra_for_user(uid: int) -> str:
    """RLS kontekstida shu foydalanuvchining BARCHA tovar/klientlari (STT uchun qo'shimcha blok)."""
    from shared.database.pool import get_pool

    products = []
    clients = []
    try:
        import services.bot.db as _db
        async with _db._P().acquire() as conn:
            try:
                products = await conn.fetch(
                    "SELECT nomi FROM tovarlar WHERE user_id=$1 ORDER BY nomi ASC LIMIT 1000", uid
                )
            except Exception as e:
                log.warning("STT tovar yuklash xato (uid=%s): %s", uid, e)

            try:
                clients = await conn.fetch(
                    "SELECT ism FROM klientlar WHERE user_id=$1 ORDER BY ism ASC LIMIT 500", uid
                )
            except Exception as e:
                log.warning("STT klient yuklash xato (uid=%s): %s", uid, e)
    except Exception as e:
        log.warning("STT DB ulanish xato (uid=%s): %s", uid, e)
        return ""  # DB ishlamasa — bo'sh prompt, Gemini statik prompt bilan ishlaydi

    product_names = ", ".join([r["nomi"] for r in products if r.get("nomi")])
    client_names = ", ".join([r["ism"] for r in clients if r.get("ism")])

    if not product_names and not client_names:
        return ""  # Bo'sh DB — faqat statik prompt ishlaydi

    product_names = ", ".join([r["nomi"] for r in products if r.get("nomi")])
    client_names = ", ".join([r["ism"] for r in clients if r.get("ism")])

    return f"""
═══ USHBU DO'KONNING BARCHA TOVARLARI ═══
Ovozda quyidagi nomlardan biriga O'XSHASH so'z eshitsang, AYNAN SHU YOZILISHINI ishlatib yoz.
Bu ro'yxat do'kon bazasidan — eng ishonchli manba.

TOVARLAR ({len(products)} ta):
{product_names}

KLIENTLAR ({len(clients)} ta):
{client_names}

QOIDA: Agar ovozda "ariyel" desa → ro'yxatda "Ariel" bor → "Ariel" yoz.
Agar ovozda "persel" desa → ro'yxatda "Persil" bor → "Persil" yoz.
Agar ovozda yo'q tovar aytilsa → eshitganingcha yoz.
Timestamp QOSHMA. Faqat toza matn. O'lchov: karobka, dona, shtuk, paket, kilo, gramm.
"""


async def resolve_system_prompt_for_user(uid: int) -> str:
    """Har bir ovoz so'rovi uchun to'liq system instruction (statik + RLS DB ro'yxati)."""
    if not uid:
        return STT_SYSTEM_PROMPT
    now = time.time()
    hit = _STT_USER_PROMPT_CACHE.get(uid)
    if hit and (now - hit[0]) < _PROMPT_CACHE_TTL_S:
        return hit[1]
    try:
        extra = await _build_stt_extra_for_user(uid)
        full = STT_SYSTEM_PROMPT + "\n" + extra if extra else STT_SYSTEM_PROMPT
        # Faqat muvaffaqiyatli natijani cache la (bo'sh = DB xato, qayta urinish kerak)
        if extra:
            _STT_USER_PROMPT_CACHE[uid] = (now, full)
            log.debug("STT system prompt uid=%s yangilandi (%d belgi)", uid, len(extra))
        return full
    except Exception as e:
        log.warning("STT foydalanuvchi prompti yig'ilmedi (uid=%s): %s", uid, e)
        return STT_SYSTEM_PROMPT


async def stt_prompt_yangilash(pool=None) -> None:
    """Eski API: global pool bilan STT yangilamaymiz — RLS tufayli ma'lumot faqat uid bilan."""
    if pool is not None:
        log.debug(
            "stt_prompt_yangilash(pool=...): RLS rejimida e'tiborsiz; prompt ovoz paytida uid bilan"
        )


def ishga_tushir(api_key: str, model: str = "") -> None:
    global _client, MODEL, _semaphore
    if model:
        MODEL = model
    try:
        from google import genai
        _client = genai.Client(api_key=api_key)
        _semaphore = asyncio.Semaphore(MAX_PARALLEL)
        log.info("✅ Gemini ovoz xizmati ulandi (%s) | Parallel: %d", MODEL, MAX_PARALLEL)
    except Exception as e:
        log.error("❌ Gemini ulanmadi: %s", e)


def _is_retryable(exc: Exception) -> bool:
    """429 rate limit va server xatolar uchun retry, auth xato uchun emas."""
    err_str = str(exc).lower()
    if "429" in err_str or "rate" in err_str or "quota" in err_str:
        return True
    if "500" in err_str or "503" in err_str or "timeout" in err_str:
        return True
    if "connection" in err_str or "reset" in err_str:
        return True
    return False


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=2, max=15),
    retry=retry_if_exception(_is_retryable),
    before_sleep=before_sleep_log(log, logging.WARNING),
    reraise=True,
)
def _gemini_sync(audio_bytes: bytes, mime: str, system_instruction: str) -> str:
    from google import genai
    from google.genai import types
    try:
        response = _client.models.generate_content(
            model=MODEL,
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=mime),
                _PROMPT_USER,
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,
                max_output_tokens=4096,
            ),
        )
    except Exception:
        # Fallback: config yo'q
        response = _client.models.generate_content(
            model=MODEL,
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=mime),
                system_instruction + "\n\n" + _PROMPT_USER,
            ],
        )
    return (response.text or "").strip()


async def _gemini_async(
    audio_bytes: bytes,
    mime: str,
    system_instruction: str,
) -> str:
    sem = _semaphore or asyncio.Semaphore(MAX_PARALLEL)
    async with sem:
        loop = asyncio.get_running_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(
                None, _gemini_sync, audio_bytes, mime, system_instruction
            ),
            timeout=TIMEOUT_S,
        )


async def ovoz_matn(fayl_yoli: str, uid: int = 0) -> Optional[str]:
    """Qisqa ovoz (< 30s) -> matn (+ tuzatish)"""
    if not _client:
        log.error("Gemini ishga tushirilmagan")
        return None
    try:
        sys_prompt = await resolve_system_prompt_for_user(uid)
        from services.bot.bot_services.audio_engine import process_short_audio
        audio_bytes, mime = await process_short_audio(fayl_yoli)
        natija = await _gemini_async(audio_bytes, mime, sys_prompt)
        if natija:
            log.info("Ovoz -> matn (%d belgi): %s...", len(natija), natija[:50])
            return natija
        log.warning("Gemini bosh javob")
        return None
    except asyncio.TimeoutError:
        log.error("Gemini timeout (%ds)", TIMEOUT_S)
        return None
    except Exception as e:
        log.error("Gemini xato: %s", e)
        return None


async def ovoz_matn_uzun(
    fayl_yoli: str,
    progress_callback=None,
    uid: int = 0,
) -> Optional[str]:
    """Uzun audio (1 soatgacha) -> matn. Chunks + Parallel Gemini."""
    if not _client:
        return None
    from services.bot.bot_services.audio_engine import process_audio, cleanup_temp
    temp_dir = None
    try:
        chunks, temp_dir = await process_audio(fayl_yoli, progress_callback)
        if not chunks:
            return None
        if progress_callback:
            await progress_callback(65, f"Gemini tahlil ({len(chunks)} chunk)...")
        sys_prompt = await resolve_system_prompt_for_user(uid)

        # ── PARALLEL GEMINI — barcha chunklar bir vaqtda ──
        async def _process_one(i: int, chunk_path: str) -> tuple[int, str | None]:
            try:
                chunk_bytes = Path(chunk_path).read_bytes()
                matn = await _gemini_async(chunk_bytes, "audio/wav", sys_prompt)
                return (i, matn)
            except Exception as e:
                log.warning("Chunk %d xato: %s", i, e)
                return (i, None)

        tasks = [_process_one(i, p) for i, p in enumerate(chunks)]
        results = await asyncio.gather(*tasks)

        if progress_callback:
            await progress_callback(90, f"{len(chunks)} chunk tayyor!")

        # Tartibni saqlash (chunk 0, 1, 2, ...)
        results_sorted = sorted(results, key=lambda x: x[0])
        natijalar = [matn for _, matn in results_sorted if matn]

        if not natijalar:
            return None
        result = " ".join(natijalar)
        if progress_callback:
            await progress_callback(95, "Transkripsiya tayyor!")
        log.info("Uzun audio: %d chunk -> %d belgi (PARALLEL)", len(chunks), len(result))
        return result
    except Exception as e:
        log.error("Uzun audio xato: %s", e)
        return None
    finally:
        if temp_dir:
            cleanup_temp(temp_dir)


matnga_aylantir = ovoz_matn
