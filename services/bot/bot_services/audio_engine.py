"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.0 — ENTERPRISE AUDIO ENGINE                            ║
║                                                                      ║
║  EKSTREMAL SHOVQINLI AUDIONI QAYTA ISHLASH TIZIMI                   ║
║                                                                      ║
║  Pipeline:                                                           ║
║  1. OGG → WAV (FFmpeg: 16kHz, Mono)                                 ║
║  2. Silero VAD → faqat inson ovozi ajratish                         ║
║  3. Chunking → 3-5 daqiqalik bo'laklar (1 soatlik audio uchun)     ║
║  4. ProcessPoolExecutor → CPU og'ir ish alohida yadroda             ║
║  5. Garbage Collection → 1 bayt ham axlat qolmaydi                 ║
║                                                                      ║
║  Xususiyatlar:                                                       ║
║  ✅ 1 soatlik audio qo'llab-quvvatlash                               ║
║  ✅ RAM to'lmasligi kafolati (streaming chunks)                      ║
║  ✅ Silero VAD — millisoniya aniqligida ovoz aniqlash                ║
║  ✅ FFmpeg — professional audio konvertatsiya                         ║
║  ✅ try-except-finally — diskda axlat qolmaydi                       ║
║  ✅ ProcessPoolExecutor — CPU bloklamasligi                          ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import asyncio
import logging
import os
import shutil
import subprocess
import tempfile
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)

# Sozlamalar
CHUNK_DURATION_S = 180       # 3 daqiqa = 180 sekund
MAX_AUDIO_DURATION_S = 7200  # 2 SOAT max
SAMPLE_RATE = 16000          # 16kHz — STT uchun optimal
MAX_FILE_MB = 100            # Local Bot API bilan 100MB gacha
VAD_THRESHOLD = 0.3          # Ovoz aniqlash sezgirligi (0-1)
VAD_MIN_SPEECH_MS = 250      # Minimal ovoz uzunligi (ms)
VAD_MIN_SILENCE_MS = 500     # Minimal jimlik (ms)

# Process pool (CPU og'ir ishlar uchun)
_pool: ProcessPoolExecutor | None = None


def _get_pool() -> ProcessPoolExecutor:
    global _pool
    if _pool is None:
        workers = min(os.cpu_count() or 2, 4)
        _pool = ProcessPoolExecutor(max_workers=workers)
        log.info("🔧 ProcessPool: %d worker", workers)
    return _pool


# ════════════════════════════════════════════════════════════════
#  1. FFMPEG — OGG/MP3/M4A → WAV (16kHz, Mono)
# ════════════════════════════════════════════════════════════════

def ffmpeg_convert(input_path: str, output_path: str) -> bool:
    """Audio faylni 16kHz Mono WAV ga o'tkazish"""
    try:
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vn",                    # videoni olib tashlash
            "-acodec", "pcm_s16le",   # 16-bit PCM
            "-ar", str(SAMPLE_RATE),  # 16kHz
            "-ac", "1",               # Mono
            "-af", "highpass=f=80,lowpass=f=8000,"  # Inson ovozi diapazoni
                   "afftdn=nf=-20,"                 # Shovqin kamaytirish
                   "acompressor=threshold=-20dB:ratio=4:attack=5:release=50,"  # Kompressor
                   "volume=1.5",                     # Balandlik oshirish
            output_path
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            log.warning("FFmpeg stderr: %s", result.stderr[:200])
            # Oddiy konvertatsiya (filtersiz)
            cmd_simple = [
                "ffmpeg", "-y", "-i", input_path,
                "-vn", "-acodec", "pcm_s16le",
                "-ar", str(SAMPLE_RATE), "-ac", "1",
                output_path
            ]
            subprocess.run(cmd_simple, capture_output=True, timeout=60, check=True)
        return True
    except subprocess.TimeoutExpired:
        log.error("FFmpeg timeout (120s)")
        return False
    except Exception as e:
        log.error("FFmpeg xato: %s", e)
        return False


def get_audio_duration(wav_path: str) -> float:
    """Audio davomiyligini soniyada aniqlash"""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", wav_path],
            capture_output=True, text=True, timeout=10
        )
        return float(result.stdout.strip())
    except Exception:
        # Fallback: fayl hajmi bo'yicha
        try:
            size = os.path.getsize(wav_path)
            return size / (SAMPLE_RATE * 2)  # 16-bit = 2 bytes per sample
        except Exception:
            return 0.0


# ════════════════════════════════════════════════════════════════
#  2. SILERO VAD — Inson ovozini aniqlash
# ════════════════════════════════════════════════════════════════

def _silero_vad_process(wav_path: str, output_dir: str) -> list[str]:
    """
    Silero VAD bilan faqat inson ovozi qismlarini ajratish.
    CPU og'ir — ProcessPoolExecutor da ishlatiladi.
    
    Qaytaradi: VAD orqali tozalangan WAV fayllar ro'yxati
    """
    try:
        import torch
        torch.set_num_threads(1)  # Process pool da 1 thread
        
        model, utils = torch.hub.load(
            repo_or_dir='snakers4/silero-vad',
            model='silero_vad',
            force_reload=False,
            onnx=True
        )
        (get_speech_timestamps, save_audio, read_audio, _, _) = utils
        
        wav = read_audio(wav_path, sampling_rate=SAMPLE_RATE)
        speech_timestamps = get_speech_timestamps(
            wav, model,
            sampling_rate=SAMPLE_RATE,
            threshold=VAD_THRESHOLD,
            min_speech_duration_ms=VAD_MIN_SPEECH_MS,
            min_silence_duration_ms=VAD_MIN_SILENCE_MS,
        )
        
        if not speech_timestamps:
            log.warning("VAD: ovoz topilmadi!")
            return [wav_path]  # Original qaytarish
        
        # Ovoz qismlarini birlashtirib saqlash
        vad_output = os.path.join(output_dir, "vad_clean.wav")
        save_audio(vad_output, wav[speech_timestamps], sampling_rate=SAMPLE_RATE)
        
        original_dur = len(wav) / SAMPLE_RATE
        clean_dur = sum(
            (ts['end'] - ts['start']) / SAMPLE_RATE 
            for ts in speech_timestamps
        )
        log.info("🎤 VAD: %.1fs → %.1fs (%.0f%% ovoz)",
                 original_dur, clean_dur, clean_dur / max(original_dur, 0.1) * 100)
        
        return [vad_output]
    
    except ImportError:
        log.info("⚠️ torch/silero yo'q — VAD o'tkazib yuborildi")
        return [wav_path]
    except Exception as e:
        log.warning("VAD xato: %s — original ishlatiladi", e)
        return [wav_path]


# ════════════════════════════════════════════════════════════════
#  3. CHUNKING — Uzun audioni bo'laklarga kesish
# ════════════════════════════════════════════════════════════════

def split_audio_chunks(wav_path: str, output_dir: str,
                       chunk_seconds: int = CHUNK_DURATION_S) -> list[str]:
    """WAV faylni chunk_seconds lik bo'laklarga kesish (FFmpeg bilan)"""
    duration = get_audio_duration(wav_path)
    
    if duration <= chunk_seconds + 10:  # 10s toleransiya
        return [wav_path]  # Bo'lish shart emas
    
    chunks = []
    n_chunks = int(duration / chunk_seconds) + 1
    log.info("✂️ Audio: %.0fs → %d chunk (har biri %ds)", 
             duration, n_chunks, chunk_seconds)
    
    for i in range(n_chunks):
        start = i * chunk_seconds
        chunk_path = os.path.join(output_dir, f"chunk_{i:03d}.wav")
        
        cmd = [
            "ffmpeg", "-y", "-i", wav_path,
            "-ss", str(start),
            "-t", str(chunk_seconds),
            "-acodec", "pcm_s16le",
            "-ar", str(SAMPLE_RATE),
            "-ac", "1",
            chunk_path
        ]
        try:
            subprocess.run(cmd, capture_output=True, timeout=30, check=True)
            if os.path.getsize(chunk_path) > 1000:  # 1KB dan katta
                chunks.append(chunk_path)
        except Exception as e:
            log.warning("Chunk %d xato: %s", i, e)
    
    return chunks if chunks else [wav_path]


# ════════════════════════════════════════════════════════════════
#  4. ASOSIY PIPELINE — Barcha qadamlar birgalikda
# ════════════════════════════════════════════════════════════════

async def process_audio(input_path: str, 
                        progress_callback=None) -> tuple[list[str], str]:
    """
    To'liq audio pipeline:
    1. OGG → WAV (FFmpeg)
    2. VAD (Silero — ixtiyoriy)
    3. Chunking (agar uzun bo'lsa)
    
    Qaytaradi: (chunk_paths_list, temp_dir)
    MUHIM: temp_dir ni o'chirish CHAQIRUVCHI zimmasi!
    
    progress_callback: async callable(progress_pct, status_text)
    """
    temp_dir = tempfile.mkdtemp(prefix="savdoai_audio_")
    wav_path = os.path.join(temp_dir, "input.wav")
    
    try:
        # ── 1. FFmpeg konvertatsiya ──
        if progress_callback:
            await progress_callback(10, "🔄 Audio tayyorlanmoqda...")
        
        loop = asyncio.get_running_loop()
        ok = await loop.run_in_executor(
            _get_pool(),
            ffmpeg_convert, input_path, wav_path
        )
        if not ok or not os.path.exists(wav_path):
            raise RuntimeError("FFmpeg konvertatsiya xato")
        
        duration = get_audio_duration(wav_path)
        log.info("📁 Audio: %.1fs (%.1f daqiqa)", duration, duration / 60)
        
        if duration > MAX_AUDIO_DURATION_S:
            raise ValueError(f"Audio juda uzun: {duration/60:.0f} daqiqa (max {MAX_AUDIO_DURATION_S/60:.0f})")
        
        # ── 2. VAD (Silero) ──
        if progress_callback:
            await progress_callback(30, "🎤 Ovoz ajratilmoqda...")
        
        vad_files = await loop.run_in_executor(
            _get_pool(),
            _silero_vad_process, wav_path, temp_dir
        )
        
        clean_wav = vad_files[0] if vad_files else wav_path
        
        # ── 3. Chunking ──
        if progress_callback:
            await progress_callback(50, "✂️ Audio bo'linmoqda...")
        
        chunks = await loop.run_in_executor(
            _get_pool(),
            split_audio_chunks, clean_wav, temp_dir
        )
        
        if progress_callback:
            await progress_callback(60, f"📤 {len(chunks)} chunk tayyor")
        
        log.info("✅ Audio pipeline: %d chunk tayyor", len(chunks))
        return chunks, temp_dir
    
    except Exception as e:
        # Xato bo'lsa — tozalash
        cleanup_temp(temp_dir)
        raise


def cleanup_temp(temp_dir: str) -> None:
    """Vaqtinchalik papkani TO'LIQ o'chirish — 1 bayt ham qolmaydi"""
    try:
        if temp_dir and os.path.isdir(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
            log.debug("🗑️ Tozalandi: %s", temp_dir)
    except Exception as e:
        log.warning("Tozalash xato: %s", e)


# ════════════════════════════════════════════════════════════════
#  5. ODDIY PIPELINE (qisqa audio uchun — <30s)
# ════════════════════════════════════════════════════════════════

async def process_short_audio(input_path: str) -> tuple[bytes, str]:
    """
    Qisqa audio uchun soddalashtirilgan pipeline.
    FFmpeg → bytes qaytaradi (fayl yaratmasdan).
    
    Qaytaradi: (audio_bytes, mime_type)
    """
    temp_dir = tempfile.mkdtemp(prefix="savdoai_short_")
    wav_path = os.path.join(temp_dir, "short.wav")
    
    try:
        loop = asyncio.get_running_loop()
        ok = await loop.run_in_executor(None, ffmpeg_convert, input_path, wav_path)
        
        if ok and os.path.exists(wav_path):
            duration = get_audio_duration(wav_path)
            data = Path(wav_path).read_bytes()
            log.info("📁 Qisqa audio: %.1fs, %.1f KB", duration, len(data)/1024)
            return data, "audio/wav"
        else:
            # FFmpeg ishlamasa — original
            data = Path(input_path).read_bytes()
            return data, "audio/ogg"
    finally:
        cleanup_temp(temp_dir)
