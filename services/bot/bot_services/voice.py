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
from pathlib import Path
from typing import Optional, Callable
from tenacity import (
    retry, stop_after_attempt,
    wait_exponential, retry_if_exception_type,
    before_sleep_log
)

log = logging.getLogger(__name__)

_client    = None
MODEL      = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
MAX_MB     = 100
TIMEOUT_S  = 60
MAX_PARALLEL = 3
_semaphore = None

_PROMPT_SYSTEM = (
    "Sen O'zbek tilining barcha shevalarini 100% tushunadigan professional Lingvistsan. "
    "Toshkent, Farg'ona, Samarqand, Buxoro, Xorazm, Qashqadaryo, Surxondaryo, Qoraqalpoq.\n\n"
    "QAT'IY QOIDALAR:\n"
    "1. Fon shovqinlarini MUTLAQO e'tiborsiz qoldir\n"
    "2. Faqat INSON GAPLARINI yoz\n"
    "3. RAQAMLARNI aniq: 'qirq besh ming' = 45000\n"
    "4. MAHSULOT NOMLARINI to'liq: Ariel, Tide, Fairy\n"
    "5. PUL SUMMALARINI aniq: 'besh yuz ming' = 500000\n"
    "6. KLIENT ISMLARINI bosh harfda: salimovga = Salimovga\n"
    "7. Hech narsani TUSHIRIB QOLDIRMA\n"
    "8. Natija FAQAT transkripsiya — izoh YOZMA"
)

_PROMPT_USER = (
    "Bu O'zbek tilida savdo haqida gapirilgan ovoz xabari. "
    "Faqat aytilganlarni so'zma-so'z ANIQ yoz. "
    "Raqamlar, mahsulotlar, ismlar, pullarni XATOSIZ yoz."
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
                system_instruction=_PROMPT_SYSTEM,
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
                _PROMPT_SYSTEM + "\n\n" + _PROMPT_USER,
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


async def ovoz_matn(fayl_yoli: str) -> Optional[str]:
    """Qisqa ovoz (< 30s) -> matn"""
    if not _client:
        log.error("Gemini ishga tushirilmagan")
        return None
    try:
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
