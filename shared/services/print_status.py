"""
╔══════════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.4 — PRINT STATUS OQIMI                         ║
║                                                                      ║
║  Mini printer lifecycle:                                             ║
║  PREVIEW → CONFIRMED → PRINTING → PRINTED → FAILED → REPRINT       ║
║                                                                      ║
║  🖨️ 58mm / 80mm thermal receipt                                    ║
║  📊 Print history — kim, qachon, necha marta                       ║
║  🛡️ Double-print himoya                                             ║
║  🔄 Reprint — xato bo'lsa qayta chop                               ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

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
    width_mm: int = 58          # 58mm yoki 80mm
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


def _next_id(uid: int) -> str:
    global _job_counter
    _job_counter += 1
    return f"PJ-{uid}-{int(time.time())}-{_job_counter}"


def create_print_job(user_id: int, doc_type: str, content: str,
                      width_mm: int = 58, meta: dict = None) -> PrintJob:
    """Yangi print job yaratish — PREVIEW holatda"""
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


def confirm_print(job_id: str) -> Optional[PrintJob]:
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


def mark_printing(job_id: str) -> Optional[PrintJob]:
    """Chop etish boshlandi"""
    job = _jobs.get(job_id)
    if not job:
        return None
    job.status = PrintStatus.PRINTING
    job.attempts += 1
    return job


def mark_printed(job_id: str) -> Optional[PrintJob]:
    """Muvaffaqiyatli chop etildi"""
    job = _jobs.get(job_id)
    if not job:
        return None
    job.status = PrintStatus.PRINTED
    job.printed_at = time.time()
    log.info("🖨️ Print job chop etildi: %s (urinish: %d)", job_id, job.attempts)
    return job


def mark_failed(job_id: str, error: str = "") -> Optional[PrintJob]:
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


def request_reprint(job_id: str) -> Optional[PrintJob]:
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


def get_job(job_id: str) -> Optional[PrintJob]:
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


# ═══ RECEIPT FORMATTING — 58mm thermal ═══

def format_receipt_58mm(data: dict, dokon: str = "") -> str:
    """58mm mini printer uchun chek formatlash"""
    W = 32  # 58mm = ~32 belgili
    SEP = "─" * W

    lines = []
    lines.append(dokon.center(W) if dokon else "MASHRAB MOLIYA".center(W))
    lines.append(SEP)

    # Sana
    import datetime, pytz
    tz = pytz.timezone("Asia/Tashkent")
    sana = datetime.datetime.now(tz).strftime("%d.%m.%Y %H:%M")
    lines.append(sana.center(W))
    lines.append(SEP)

    # Klient
    klient = data.get("klient", data.get("klient_ismi", ""))
    if klient:
        lines.append(f"Klient: {klient}")
        lines.append(SEP)

    # Tovarlar
    tovarlar = data.get("tovarlar", [])
    for i, t in enumerate(tovarlar, 1):
        nomi = t.get("nomi", "?")[:18]
        miq = t.get("miqdor", 0)
        narx = t.get("narx", 0)
        jami = t.get("jami", 0) or (float(miq) * float(narx))

        lines.append(f"{i}. {nomi}")
        right = f"{miq}x{narx:,.0f}={jami:,.0f}"
        lines.append(f"   {right}")

    lines.append(SEP)

    # Jami
    jami_s = data.get("jami_summa", 0)
    lines.append(f"{'JAMI:':>20} {float(jami_s):>10,.0f}")

    # To'langan / Qarz
    tolangan = float(data.get("tolangan", 0))
    qarz = float(data.get("qarz", 0))
    if tolangan > 0:
        lines.append(f"{'Tolangan:':>20} {tolangan:>10,.0f}")
    if qarz > 0:
        lines.append(f"{'QARZ:':>20} {qarz:>10,.0f}")

    lines.append(SEP)
    lines.append("@savdoai_mashrab_bot".center(W))

    return "\n".join(lines)
