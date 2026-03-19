"""
SAVDOAI v25.0 — ENTERPRISE OVOZ XIZMATI
Gemini 3.1 Flash Lite + Audio Engine

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
    wait_exponential, retry_if_exception_type,
    before_sleep_log
)

log = logging.getLogger(__name__)

_client    = None
MODEL      = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
MAX_MB     = 100
TIMEOUT_S  = 60
MAX_PARALLEL = 3
_semaphore = None
_pool = None
_prompt_cache_ts = 0.0
_PROMPT_CACHE_TTL_S = 300

STT_SYSTEM_PROMPT = """Sen o'zbek tilida savdo ovozini matnga o'girayapsan.

KONTEKST: Sotuvchi bozorda klientga tovar yozyapti. Har bir gap odatda:
"[Klient ismi] + [miqdor] + [tovar nomi] + [narx]" formatida bo'ladi.

MUHIM QO'IDALAR:
1. Timestamp QOSHMA (00:00, 00:01 kabi)
2. Faqat toza matn qaytar
3. Raqamlarni son shaklida yoz (1, 2, 56000)
4. "karobka", "dona", "shtuk", "paket" — o'lchov birliklari
5. "aka", "opa", "brat" — hurmat qo'shimchalari, ismga yopishtir

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
Natija: Lobar opaga 2 Cler 32000"""

_PROMPT_USER = (
    "Bu O'zbek tilida savdo haqida gapirilgan ovoz xabari. "
    "Faqat aytilganlarni so'zma-so'z ANIQ yoz. "
    "Raqamlar, mahsulotlar, ismlar, pullarni XATOSIZ yoz."
)


async def build_stt_prompt(pool) -> str:
    """DB dan tovar/klientlarni olib, STT promptni dinamik qurish."""
    async with pool.acquire() as conn:
        try:
            products = await conn.fetch(
                "SELECT nomi FROM tovarlar ORDER BY COALESCE(sotilgan_soni, 0) DESC NULLS LAST, nomi ASC LIMIT 50"
            )
        except Exception:
            products = await conn.fetch(
                "SELECT nomi FROM tovarlar ORDER BY nomi ASC LIMIT 50"
            )
        try:
            clients = await conn.fetch(
                "SELECT ism FROM klientlar ORDER BY COALESCE(oxirgi_sotib, yaratilgan) DESC NULLS LAST, ism ASC LIMIT 30"
            )
        except Exception:
            clients = await conn.fetch(
                "SELECT ism FROM klientlar ORDER BY ism ASC LIMIT 30"
            )

    product_names = ", ".join([r["nomi"] for r in products if r.get("nomi")])
    client_names = ", ".join([r["ism"] for r in clients if r.get("ism")])

    return f"""Sen o'zbek tilida savdo ovozini matnga o'girayapsan.

KONTEKST: Sotuvchi bozorda klientga tovar yozyapti.

TOVAR NOMLARI (agar ovozda shunga o'xshash eshitsang, SHU NOMLARNI YOZ):
{product_names}

KLIENT ISMLARI:
{client_names}

QOIDALAR:
1. Timestamp QOSHMA
2. Faqat toza matn qaytar
3. Raqamlarni son shaklida yoz
4. O'lchov: karobka, dona, shtuk, paket"""


async def stt_prompt_yangilash(pool=None) -> None:
    """STT promptni DB ma'lumotlari bilan yangilash."""
    global STT_SYSTEM_PROMPT, _pool, _prompt_cache_ts
    if pool is not None:
        _pool = pool
    if _pool is None:
        return
    try:
        STT_SYSTEM_PROMPT = await build_stt_prompt(_pool)
        _prompt_cache_ts = time.time()
        log.info("STT prompt yangilandi (DB dan)")
    except Exception as e:
        log.warning("STT prompt DB dan yangilanmadi: %s", e)


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


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=3, max=30),
    retry=retry_if_exception_type(Exception),
    before_sleep=before_sleep_log(log, logging.WARNING),
    reraise=True,
)
def _gemini_sync(audio_bytes: bytes, mime: str) -> str:
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
                system_instruction=STT_SYSTEM_PROMPT,
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
                STT_SYSTEM_PROMPT + "\n\n" + _PROMPT_USER,
            ],
        )
    return (response.text or "").strip()


async def _gemini_async(audio_bytes: bytes, mime: str) -> str:
    sem = _semaphore or asyncio.Semaphore(MAX_PARALLEL)
    async with sem:
        loop = asyncio.get_event_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(None, _gemini_sync, audio_bytes, mime),
            timeout=TIMEOUT_S,
        )


async def ovoz_matn(fayl_yoli: str, uid: int = 0) -> Optional[str]:
    """Qisqa ovoz (< 30s) -> matn (+ tuzatish)"""
    if not _client:
        log.error("Gemini ishga tushirilmagan")
        return None
    try:
        if _pool is not None and (time.time() - _prompt_cache_ts) > _PROMPT_CACHE_TTL_S:
            await stt_prompt_yangilash()
        from services.bot.bot_services.audio_engine import process_short_audio
        audio_bytes, mime = await process_short_audio(fayl_yoli)
        natija = await _gemini_async(audio_bytes, mime)
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


async def ovoz_matn_uzun(fayl_yoli: str, progress_callback=None) -> Optional[str]:
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
        natijalar = []
        for i, chunk_path in enumerate(chunks):
            try:
                chunk_bytes = Path(chunk_path).read_bytes()
                matn = await _gemini_async(chunk_bytes, "audio/wav")
                if matn:
                    natijalar.append(matn)
                if progress_callback:
                    pct = 65 + int((i + 1) / len(chunks) * 25)
                    await progress_callback(pct, f"Chunk {i+1}/{len(chunks)}")
            except Exception as e:
                log.warning("Chunk %d xato: %s", i, e)
        if not natijalar:
            return None
        result = " ".join(natijalar)
        if progress_callback:
            await progress_callback(95, "Transkripsiya tayyor!")
        log.info("Uzun audio: %d chunk -> %d belgi", len(chunks), len(result))
        return result
    except Exception as e:
        log.error("Uzun audio xato: %s", e)
        return None
    finally:
        if temp_dir:
            cleanup_temp(temp_dir)


matnga_aylantir = ovoz_matn
