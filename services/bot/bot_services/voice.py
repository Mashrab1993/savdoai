"""
╔══════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA — OVOZ XIZMATI  v21.3                   ║
║  Gemini 2.0 Flash-Lite                                  ║
║  ✅ Retry (3 urinish)                                   ║
║  ✅ Fayl hajm tekshiruvi (max 20MB)                     ║
║  ✅ Timeout (30 sekund)                                  ║
║  ✅ Audio preprocessing (pydub ixtiyoriy)               ║
║  ✅ Ko'p format: ogg, mp3, wav, m4a                     ║
╚══════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import asyncio, base64, logging, os, tempfile
from pathlib import Path
from typing import Optional
from tenacity import (
    retry, stop_after_attempt,
    wait_exponential, retry_if_exception_type,
    before_sleep_log
)

log = logging.getLogger(__name__)

_client    = None
MODEL      = __import__("os").getenv("GEMINI_MODEL", "gemini-2.0-flash")
MAX_MB     = 20
TIMEOUT_S  = 30

_PROMPT = (
    "Bu O'zbek tilida savdo haqida gapirilgan ovoz xabari. "
    "Faqat aytilganlarni so'zma-so'z aniq yoz. "
    "Raqamlar: 'o'ttiz besh' → 35, 'qirq besh ming' → 45000. "
    "Qo'shimcha izoh yozma. Faqat transkripsiya."
)


def ishga_tushir(api_key: str, model: str = "") -> None:
    global _client, MODEL
    if model:
        MODEL = model
    try:
        from google import genai
        _client = genai.Client(api_key=api_key)
        log.info("✅ Gemini ovoz xizmati ulandi (%s)", MODEL)
    except Exception as e:
        log.error("❌ Gemini ulanmadi: %s", e)


def _audio_tayyorla(fayl_yoli: str) -> tuple[bytes, str]:
    """
    Audio faylni o'qish va ixtiyoriy preprocessing.
    pydub mavjud bo'lsa: mono, 16kHz ga o'tkazish.
    Qaytaradi: (bytes, mime_type)
    """
    fayl = Path(fayl_yoli)
    sufiks = fayl.suffix.lower()

    mime_map = {
        ".ogg": "audio/ogg", ".oga": "audio/ogg",
        ".mp3": "audio/mpeg", ".wav": "audio/wav",
        ".m4a": "audio/mp4", ".flac": "audio/flac",
        ".webm": "audio/webm",
    }
    mime = mime_map.get(sufiks, "audio/ogg")

    # Fayl hajmini tekshirish
    hajm_mb = fayl.stat().st_size / (1024 * 1024)
    if hajm_mb > MAX_MB:
        raise ValueError(f"Ovoz fayli juda katta: {hajm_mb:.1f}MB (max {MAX_MB}MB)")

    # pydub bilan preprocessing (ixtiyoriy)
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(str(fayl))
        # Mono + 16kHz (Gemini uchun optimal)
        audio = audio.set_channels(1).set_frame_rate(16000)
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            audio.export(tmp.name, format="ogg",
                         codec="libopus", bitrate="32k")
            data = open(tmp.name, "rb").read()
            os.unlink(tmp.name)
            log.debug("Audio: %.1fMB → %.1fMB (preprocessing OK)",
                      hajm_mb, len(data)/1024/1024)
            return data, "audio/ogg"
    except ImportError:
        pass  # optional import
    except Exception as e:
        log.warning("pydub preprocessing xato: %s", e)

    return fayl.read_bytes(), mime


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    before_sleep=before_sleep_log(log, logging.WARNING),
    reraise=True,
)
def _gemini_chaqir_sync(audio_bytes: bytes, mime: str) -> str:
    """Gemini API sinxron chaqiruv (retry bilan)"""
    from google import genai
    from google.genai import types

    response = _client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=audio_bytes, mime_type=mime),
            _PROMPT,
        ],
    )
    return (response.text or "").strip()


async def ovoz_matn(fayl_yoli: str) -> Optional[str]:
    """
    Ovoz faylini matnga o'tkazish.
    Qaytaradi: O'zbek matni yoki None (xato bo'lsa)
    """
    if not _client:
        log.error("Gemini ishga tushirilmagan")
        return None

    try:
        audio_bytes, mime = _audio_tayyorla(fayl_yoli)
    except ValueError as e:
        log.warning("Audio xato: %s", e)
        return None
    except Exception as e:
        log.error("Audio o'qish xato: %s", e)
        return None

    try:
        loop   = asyncio.get_event_loop()
        natija = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: _gemini_chaqir_sync(audio_bytes, mime)
            ),
            timeout=TIMEOUT_S,
        )
        if natija:
            log.info("✅ Ovoz → matn (%d belgi): %s...",
                     len(natija), natija[:50])
            return natija
        log.warning("Gemini bo'sh javob qaytardi")
        return None

    except asyncio.TimeoutError:
        log.error("❌ Gemini timeout (%ds)", TIMEOUT_S)
        return None
    except Exception as e:
        log.error("❌ Gemini xato: %s", e)
        return None


# Alias: bot calls matnga_aylantir
matnga_aylantir = ovoz_matn
