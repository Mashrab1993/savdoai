"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — PRINT STATUS OQIMI                         ║
║                                                                      ║
║  DIQQAT: Bu modul MATNLI chek oldindan ko'rish (preview) uchun.     ║
║  Haqiqiy ESC/POS chop etish uchun → print_session.py ishlatiladi.  ║
║                                                                      ║
║  print_status.py  = Telegram preview + job lifecycle (in-memory)    ║
║  print_session.py = ESC/POS binary + HMAC token + Redis (durable)  ║
║                                                                      ║
║  Mini printer lifecycle:                                             ║
║  PREVIEW → CONFIRMED → PRINTING → PRINTED → FAILED → REPRINT       ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from shared.services.thermal_receipt import format_thermal_receipt

log = logging.getLogger(__name__)


class PrintStatus(str, Enum):
    PREVIEW   = "preview"     # Oldindan ko'rish tayyor
    CONFIRMED = "confirmed"   # Operator tasdiqladi — chop etishga tayyor
    PRINTING  = "printing"    # Chop etish jarayonida
    PRINTED   = "printed"     # Muvaffaqiyatli chop etildi
    FAILED    = "failed"      # Chop etish xato
    REPRINT   = "reprint"     # Qayta chop kerak


@dataclass
class PrintJob:
    """Chop etish ishi — har bir receipt uchun"""
    job_id: str = ""
    user_id: int = 0
    doc_type: str = ""          # sotuv_chek, kirim_chek, nakladnoy, faktura
    status: PrintStatus = PrintStatus.PREVIEW
    content: str = ""           # Chop etiladigan matn
    width_mm: int = 80          # 80mm thermal (standart mini-printer)
    attempts: int = 0           # Necha marta urinildi
    max_attempts: int = 3       # Maksimal urinish
    created_at: float = 0
    confirmed_at: float = 0
    printed_at: float = 0
    failed_at: float = 0
    error_msg: str = ""
    reprint_count: int = 0
    original_job_id: str = ""   # Qayta chop bo'lsa, asl job
    meta: dict = field(default_factory=dict)  # Qo'shimcha ma'lumot


# ═══ PRINT JOB REGISTRY — xotiradan ═══
_jobs: dict[str, PrintJob] = {}
_job_counter: int = 0
_MAX_JOBS = 1000  # Xotira himoyasi


def _cleanup_old_jobs() -> None:
    """1 soatdan eski joblarni tozalash — memory leak oldini olish."""
    if len(_jobs) < _MAX_JOBS // 2:
        return
    now = time.time()
    expired = [jid for jid, j in _jobs.items() if now - j.created_at > 3600]
    for jid in expired:
        _jobs.pop(jid, None)


def _next_id(uid: int) -> str:
    global _job_counter
    _job_counter += 1
    return f"PJ-{uid}-{int(time.time())}-{_job_counter}"


def create_print_job(user_id: int, doc_type: str, content: str,
                      width_mm: int = 80, meta: dict = None) -> PrintJob:
    """Yangi print job yaratish — PREVIEW holatda"""
    _cleanup_old_jobs()
    job = PrintJob(
        job_id=_next_id(user_id),
        user_id=user_id,
        doc_type=doc_type,
        status=PrintStatus.PREVIEW,
        content=content,
        width_mm=width_mm,
        created_at=time.time(),
        meta=meta or {},
    )
    _jobs[job.job_id] = job
    log.info("🖨️ Print job yaratildi: %s (%s)", job.job_id, doc_type)
    return job


def confirm_print(job_id: str) -> PrintJob | None:
    """Operatorning tasdiqlashi — chop etishga tayyor"""
    job = _jobs.get(job_id)
    if not job:
        return None
    if job.status not in (PrintStatus.PREVIEW, PrintStatus.FAILED):
        log.warning("Print job %s holati noto'g'ri: %s", job_id, job.status)
        return job
    job.status = PrintStatus.CONFIRMED
    job.confirmed_at = time.time()
    log.info("✅ Print job tasdiqlandi: %s", job_id)
    return job


def mark_printing(job_id: str) -> PrintJob | None:
    """Chop etish boshlandi"""
    job = _jobs.get(job_id)
    if not job:
        return None
    job.status = PrintStatus.PRINTING
    job.attempts += 1
    return job


def mark_printed(job_id: str) -> PrintJob | None:
    """Muvaffaqiyatli chop etildi"""
    job = _jobs.get(job_id)
    if not job:
        return None
    job.status = PrintStatus.PRINTED
    job.printed_at = time.time()
    log.info("🖨️ Print job chop etildi: %s (urinish: %d)", job_id, job.attempts)
    return job


def mark_failed(job_id: str, error: str = "") -> PrintJob | None:
    """Chop etish xato"""
    job = _jobs.get(job_id)
    if not job:
        return None
    job.status = PrintStatus.FAILED
    job.failed_at = time.time()
    job.error_msg = error
    log.warning("❌ Print job xato: %s — %s (urinish: %d/%d)",
                job_id, error, job.attempts, job.max_attempts)
    return job


def request_reprint(job_id: str) -> PrintJob | None:
    """Qayta chop so'rash"""
    job = _jobs.get(job_id)
    if not job:
        return None
    if job.status not in (PrintStatus.PRINTED, PrintStatus.FAILED):
        return job

    # Yangi reprint job yaratish
    new_job = PrintJob(
        job_id=_next_id(job.user_id),
        user_id=job.user_id,
        doc_type=job.doc_type,
        status=PrintStatus.CONFIRMED,  # Avval tasdiqlangan, qayta chop
        content=job.content,
        width_mm=job.width_mm,
        created_at=time.time(),
        confirmed_at=time.time(),
        reprint_count=job.reprint_count + 1,
        original_job_id=job.original_job_id or job.job_id,
        meta={**job.meta, "reprint_of": job.job_id},
    )
    _jobs[new_job.job_id] = new_job
    log.info("🔄 Reprint: %s → %s (reprint #%d)",
             job_id, new_job.job_id, new_job.reprint_count)
    return new_job


def get_job(job_id: str) -> PrintJob | None:
    return _jobs.get(job_id)


def user_jobs(user_id: int, limit: int = 10) -> list[PrintJob]:
    """Foydalanuvchining oxirgi print ishlari"""
    jobs = [j for j in _jobs.values() if j.user_id == user_id]
    jobs.sort(key=lambda j: j.created_at, reverse=True)
    return jobs[:limit]


def job_status_text(job: PrintJob) -> str:
    """Print job holati — Telegram uchun matn"""
    STATUS_MAP = {
        PrintStatus.PREVIEW:   "👁️ Oldindan ko'rish",
        PrintStatus.CONFIRMED: "✅ Tasdiqlangan — chop kutilmoqda",
        PrintStatus.PRINTING:  "🖨️ Chop etilmoqda...",
        PrintStatus.PRINTED:   "✅ Chop etildi",
        PrintStatus.FAILED:    "❌ Xato — qayta urinish mumkin",
        PrintStatus.REPRINT:   "🔄 Qayta chop",
    }
    status = STATUS_MAP.get(job.status, job.status.value)
    lines = [
        f"🖨️ *CHEK #{job.job_id[-6:]}*",
        f"📋 Tur: {job.doc_type}",
        f"📊 Holat: *{status}*",
    ]
    if job.attempts > 0:
        lines.append(f"🔄 Urinish: {job.attempts}/{job.max_attempts}")
    if job.reprint_count > 0:
        lines.append(f"📋 Qayta chop: #{job.reprint_count}")
    if job.error_msg:
        lines.append(f"⚠️ Xato: {job.error_msg}")
    return "\n".join(lines)


# ═══ RECEIPT FORMATTING — thermal (text-first, shared layout) ═══


def format_receipt_58mm(data: dict, dokon: str = "") -> str:
    """58mm mini printer — monospaced layout (32 ustun)."""
    return format_thermal_receipt(data, dokon, width_mm=58)


def format_receipt_80mm(data: dict, dokon: str = "") -> str:
    """80mm thermal (XP-P810 class) — 48 ustun."""
    return format_thermal_receipt(data, dokon, width_mm=80)
