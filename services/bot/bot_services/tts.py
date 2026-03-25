"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — OVOZLI JAVOB (TTS) v1.0                          ║
║  Gemini API orqali matnni ovozga aylantirish                 ║
║  ✅ O'zbek tili (Gemini multilingual)                        ║
║  ✅ Qisqa javoblar uchun (chek, hisobot xulosa)             ║
║  ✅ OGG format (Telegram voice message)                      ║
║  ✅ Cache — bir xil matn qayta generatsiya qilinmaydi       ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import asyncio
import hashlib
import io
import logging
import os
import subprocess
import tempfile
from typing import Optional

log = logging.getLogger(__name__)

_TTS_ENABLED = False
_TTS_API_KEY = ""
_TTS_CACHE: dict[str, bytes] = {}
_TTS_CACHE_MAX = 50

# Max matn uzunligi (300 belgidan oshsa — ovozli javob berilmaydi)
MAX_MATN_UZUNLIGI = 300


def ishga_tushir(api_key: str) -> None:
    """TTS xizmatini ishga tushirish."""
    global _TTS_ENABLED, _TTS_API_KEY
    if not api_key:
        log.info("ℹ️ TTS o'chirilgan (GEMINI_API_KEY yo'q)")
        return
    _TTS_API_KEY = api_key
    _TTS_ENABLED = True
    log.info("✅ TTS ovozli javob tayyor")


def tts_tayyor() -> bool:
    """TTS ishlayaptimi?"""
    return _TTS_ENABLED


def _cache_key(matn: str) -> str:
    return hashlib.md5(matn.encode()).hexdigest()[:12]


async def matn_ovozga(matn: str) -> Optional[bytes]:
    """
    Matnni ovozga aylantirish → OGG bytes.
    
    Gemini TTS API orqali ishlaydi.
    Qisqa javoblar uchun (hisobot xulosa, chek jami).
    
    Returns:
        OGG audio bytes yoki None (xato/uzun matn)
    """
    if not _TTS_ENABLED:
        return None

    matn = matn.strip()
    if not matn or len(matn) > MAX_MATN_UZUNLIGI:
        return None

    # Cache tekshirish
    ck = _cache_key(matn)
    if ck in _TTS_CACHE:
        return _TTS_CACHE[ck]

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=_TTS_API_KEY)

        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model="gemini-2.5-pro",
                    contents=f"Quyidagi matnni o'zbek tilida o'qi: {matn}",
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name="Kore"
                                )
                            )
                        ),
                    ),
                )
            ),
            timeout=15,
        )

        # Audio data olish
        audio_data = None
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
                audio_data = part.inline_data.data
                break

        if not audio_data:
            log.debug("TTS: audio data yo'q")
            return None

        # WAV → OGG konvertatsiya (Telegram voice uchun)
        ogg_bytes = await _wav_to_ogg(audio_data)
        if ogg_bytes:
            # Cache saqlash
            if len(_TTS_CACHE) >= _TTS_CACHE_MAX:
                _TTS_CACHE.pop(next(iter(_TTS_CACHE)), None)
            _TTS_CACHE[ck] = ogg_bytes
            log.debug("TTS: %d belgi → %d bytes OGG", len(matn), len(ogg_bytes))

        return ogg_bytes

    except asyncio.TimeoutError:
        log.debug("TTS timeout (15s)")
        return None
    except Exception as e:
        log.debug("TTS xato: %s", e)
        return None


async def _wav_to_ogg(audio_bytes: bytes) -> Optional[bytes]:
    """Audio → OGG (Telegram voice message formati)."""
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as inp:
            inp.write(audio_bytes)
            inp_path = inp.name

        out_path = inp_path.replace(".wav", ".ogg")

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: subprocess.run(
                ["ffmpeg", "-y", "-i", inp_path,
                 "-c:a", "libopus", "-b:a", "32k",
                 "-vn", out_path],
                capture_output=True, timeout=10
            )
        )

        if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            with open(out_path, "rb") as f:
                return f.read()
        return audio_bytes  # Fallback — raw audio

    except Exception as e:
        log.debug("WAV→OGG: %s", e)
        return audio_bytes
    finally:
        for p in (inp_path, out_path):
            try:
                os.unlink(p)
            except Exception:
                pass


def hisobot_xulosa(d: dict) -> str:
    """Hisobot ma'lumotlaridan qisqa ovozli xulosa matni."""
    davr = d.get("davr", "kunlik")
    davr_nom = {"kunlik": "Bugungi", "haftalik": "Haftalik", "oylik": "Oylik"}
    dn = davr_nom.get(davr, "")

    jami = d.get("sotuv_jami", 0)
    foyda = d.get("foyda", 0)
    qarz = d.get("jami_qarz", 0)
    soni = d.get("sotuv_soni", 0)

    def _pul_soz(v):
        m = abs(v)
        if m >= 1_000_000:
            return f"{m / 1_000_000:.1f} million"
        elif m >= 1_000:
            return f"{m / 1_000:.0f} ming"
        return str(int(m))

    matn = f"{dn} natija. "
    matn += f"{soni} ta sotuv, jami {_pul_soz(jami)} so'm. "
    if foyda > 0:
        matn += f"Sof foyda {_pul_soz(foyda)} so'm. "
    elif foyda < 0:
        matn += f"Zarar {_pul_soz(foyda)} so'm. "
    if qarz > 0:
        matn += f"Jami qarz {_pul_soz(qarz)} so'm."
    return matn.strip()


def sotuv_xulosa(klient: str, tovarlar: list, jami: float, qarz: float = 0) -> str:
    """Sotuv ovozli xulosa matni."""
    def _ps(v):
        m = abs(v)
        if m >= 1_000_000: return f"{m / 1_000_000:.1f} million"
        elif m >= 1_000: return f"{m / 1_000:.0f} ming"
        return str(int(m))

    soni = len(tovarlar)
    matn = f"{klient}ga {soni} xil tovar sotildi, jami {_ps(jami)} so'm. "
    if qarz > 0:
        matn += f"Qarz {_ps(qarz)} so'm. "
    else:
        matn += "To'liq to'langan. "
    if soni <= 3:
        nomlar = ", ".join(t.get("nomi", "?") for t in tovarlar[:3])
        matn += f"Tovarlar: {nomlar}."
    return matn.strip()


def kirim_xulosa(tovarlar: list, jami: float, manba: str = "") -> str:
    """Kirim ovozli xulosa matni."""
    def _ps(v):
        m = abs(v)
        if m >= 1_000_000: return f"{m / 1_000_000:.1f} million"
        elif m >= 1_000: return f"{m / 1_000:.0f} ming"
        return str(int(m))

    soni = len(tovarlar)
    matn = f"{soni} xil tovar kirim qilindi"
    if manba:
        matn += f", {manba} dan"
    matn += f", jami {_ps(jami)} so'm. "
    if soni <= 3:
        nomlar = ", ".join(t.get("nomi", "?") for t in tovarlar[:3])
        matn += f"Tovarlar: {nomlar}. "
    matn += "Ombor yangilandi."
    return matn.strip()


def qarz_xulosa(klient: str, summa: float) -> str:
    """Qarz to'lash ovozli xulosa matni."""
    def _ps(v):
        m = abs(v)
        if m >= 1_000_000: return f"{m / 1_000_000:.1f} million"
        elif m >= 1_000: return f"{m / 1_000:.0f} ming"
        return str(int(m))
    return f"{klient} {_ps(summa)} so'm to'ladi. Qarz kamaydi."
