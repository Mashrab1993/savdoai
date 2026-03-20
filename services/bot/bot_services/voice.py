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
# STT uchun foydalanuvchi bo'yicha prompt keshi (RLS bilan); global pool ishlatilmaydi.
_STT_USER_PROMPT_CACHE: dict[int, tuple[float, str]] = {}
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


async def _build_stt_extra_for_user(uid: int) -> str:
    """RLS kontekstida shu foydalanuvchining top tovar/klientlari (STT uchun qo'shimcha blok)."""
    from shared.database.pool import rls_conn

    async with rls_conn(uid) as conn:
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

    return f"""
--- USHBU FOYDALANUVCHINING OMBORidan (agar ovoz shu nomlarga o'xshasa, SHU yozilishi) ---

TOVAR NOMLARI:
{product_names}

KLIENT ISMLARI:
{client_names}

QOIDALAR (qo'shimcha): Timestamp QOSHMA. Faqat toza matn. O'lchov: karobka, dona, shtuk, paket.
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
        full = STT_SYSTEM_PROMPT + "\n" + extra
        _STT_USER_PROMPT_CACHE[uid] = (now, full)
        log.debug("STT system prompt uid=%s yangilandi", uid)
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


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=3, max=30),
    retry=retry_if_exception_type(Exception),
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
        loop = asyncio.get_event_loop()
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
        natijalar = []
        for i, chunk_path in enumerate(chunks):
            try:
                chunk_bytes = Path(chunk_path).read_bytes()
                matn = await _gemini_async(chunk_bytes, "audio/wav", sys_prompt)
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
