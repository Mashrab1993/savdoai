"""Signed print session — HMAC token + Redis durable + in-memory fallback."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass
from typing import Optional

log = logging.getLogger(__name__)

_IS_PROD = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_SERVICE_ID"))


def _load_secret() -> tuple[str, str]:
    """
    HMAC print token uchun yagona secret.
    Production: faqat PRINT_SECRET (JWT_SECRET ga fallback yo'q — bot/API mismatch 502 emas, 401 bo'lmasin).
    Development: JWT_SECRET yoki zaif dev default.
    """
    raw = (os.getenv("PRINT_SECRET") or "").strip()
    if raw:
        return raw, "PRINT_SECRET"
    if _IS_PROD:
        raise RuntimeError(
            "PRINT_SECRET muhit o'zgaruvchisi productionda majburiy. "
            "Railway da bot va API servislariga bir xil PRINT_SECRET qo'ying. "
            "JWT_SECRET print token uchun ishlatilmaydi."
        )
    jwt = (os.getenv("JWT_SECRET") or "").strip()
    if jwt:
        log.warning(
            "PRINT_SECRET o'rnatilmagan — JWT_SECRET dan foydalanilmoqda (faqat development)."
        )
        return jwt, "JWT_SECRET_FALLBACK"
    log.warning(
        "PRINT_SECRET va JWT_SECRET bo'sh — savdoai-dev-print-secret ishlatilmoqda (faqat dev)."
    )
    return "savdoai-dev-print-secret-NOT-FOR-PRODUCTION", "dev-default"


# Lazy init: eager _load_secret() at import time crashed the whole API on Railway when
# PRINT_SECRET was unset (process never bound → edge 502). Secret loads on first use.
_pair: tuple[str, str] | None = None


def _secret_pair() -> tuple[str, str]:
    global _pair
    if _pair is None:
        _pair = _load_secret()
    return _pair


def get_secret_source() -> str:
    """HMAC secret manbai (log/trace; qiymat emas)."""
    return _secret_pair()[1]


TTL = int(os.getenv("PRINT_SESSION_TTL", "300"))

_rc: object | None = None


def _redis():
    global _rc
    if _rc is not None:
        return _rc if _rc else None
    url = os.environ.get("REDIS_URL")
    if not url:
        _rc = False
        return None
    try:
        import redis

        r = redis.from_url(url, decode_responses=False)
        r.ping()
        _rc = r
        return _rc
    except Exception as e:
        log.debug("Redis print session: %s", e)
        _rc = False
        return None


_mem: dict[str, PrintSession] = {}
_idemp: dict[str, str] = {}
# Idempotency lookup'ni atomik qilish uchun (thread-safe):
# get + load o'rtasida boshqa thread delete qila olmasligi kerak.
import threading
_session_lock = threading.Lock()


@dataclass
class PrintSession:
    job_id: str = ""
    user_id: int = 0
    sessiya_id: int = 0
    doc_type: str = "sotuv_chek"
    dokon: str = ""
    tel: str = ""
    klient: str = ""
    jami: float = 0.0
    width: int = 80
    status: str = "pending"
    token: str = ""
    idemp_key: str = ""
    created_at: float = 0.0
    expires_at: float = 0.0
    escpos_80: bytes = b""
    escpos_58: bytes = b""

    def expired(self) -> bool:
        return time.time() > self.expires_at

    def deep_link(self, use_https: bool = False) -> str:
        """use_https=True -> https://PRINT_DOMAIN/p/... ; False -> savdoai://print/..."""
        if use_https:
            d = os.environ.get("PRINT_DOMAIN", "print.savdoai.uz").strip().rstrip("/")
            return f"https://{d}/p/{self.job_id}?t={self.token}&w={self.width}"
        return f"savdoai://print/{self.job_id}?t={self.token}&w={self.width}"

    def to_json(self) -> dict:
        return {
            "v": 1,
            "job_id": self.job_id,
            "user_id": self.user_id,
            "sessiya_id": self.sessiya_id,
            "doc_type": self.doc_type,
            "dokon": self.dokon,
            "klient": self.klient,
            "jami": self.jami,
            "width": self.width,
            "token": self.token,
            "created_at": int(self.created_at),
            "expires_at": int(self.expires_at),
        }

    def _ser(self) -> bytes:
        d = self.to_json()
        d["status"] = self.status
        d["idemp_key"] = self.idemp_key
        d["tel"] = self.tel
        d["escpos_80_b64"] = base64.b64encode(self.escpos_80).decode() if self.escpos_80 else ""
        d["escpos_58_b64"] = base64.b64encode(self.escpos_58).decode() if self.escpos_58 else ""
        return json.dumps(d).encode()

    @classmethod
    def _deser(cls, raw: bytes) -> PrintSession:
        d = json.loads(raw)
        e80 = base64.b64decode(d.pop("escpos_80_b64", "") or "") if d.get("escpos_80_b64") else b""
        e58 = base64.b64decode(d.pop("escpos_58_b64", "") or "") if d.get("escpos_58_b64") else b""
        # legacy single field
        if not e80 and d.get("escpos_b64"):
            e80 = base64.b64decode(d.pop("escpos_b64", "") or "")
        return cls(
            job_id=d["job_id"],
            user_id=d["user_id"],
            sessiya_id=d["sessiya_id"],
            doc_type=d.get("doc_type", ""),
            dokon=d.get("dokon", ""),
            tel=d.get("tel", ""),
            klient=d.get("klient", ""),
            jami=d.get("jami", 0),
            width=d.get("width", 80),
            status=d.get("status", "pending"),
            token=d["token"],
            idemp_key=d.get("idemp_key", ""),
            created_at=d["created_at"],
            expires_at=d["expires_at"],
            escpos_80=e80,
            escpos_58=e58,
        )


def _sign(job_id: str, uid: int, created_ts: float) -> str:
    return hmac.new(
        _secret_pair()[0].encode(),
        f"{job_id}:{uid}:{int(created_ts)}".encode(),
        hashlib.sha256,
    ).hexdigest()[:32]  # 128-bit entropy (yangi tokenlar)


def _verify_compat(token: str, job_id: str, uid: int, created_ts: float) -> bool:
    """Backward compatible verify: 16-char (eski) va 32-char (yangi) tokenlarni qo'llab-quvvatlaydi."""
    full_hex = hmac.new(
        _secret_pair()[0].encode(),
        f"{job_id}:{uid}:{int(created_ts)}".encode(),
        hashlib.sha256,
    ).hexdigest()
    # Yangi 32-char token
    if len(token) >= 32:
        return hmac.compare_digest(token, full_hex[:32])
    # Eski 16-char token (deploy vaqtida aktiv sessiyalar uchun)
    if len(token) >= 16:
        return hmac.compare_digest(token, full_hex[:16])
    return False


_MEM_SOFT_LIMIT = 2000  # xotira himoyasi — 2000'dan ko'p bo'lsa eskisini chiqarib tashlash


def _save(s: PrintSession) -> None:
    _mem[s.job_id] = s
    # Xotira himoyasi: agar _mem juda katta bo'lsa — eng eski sessiyani chiqarish.
    # Lazy cleanup (create() da ham bor), bu qo'shimcha xavfsizlik.
    if len(_mem) > _MEM_SOFT_LIMIT:
        now = time.time()
        # Eng eski muddati o'tgan 100 tani topib o'chirish
        expired = sorted(
            ((k, v) for k, v in _mem.items() if now > v.expires_at + 120),
            key=lambda kv: kv[1].expires_at,
        )[:100]
        for k, sv in expired:
            _mem.pop(k, None)
            if sv.idemp_key:
                _idemp.pop(sv.idemp_key, None)
        if expired:
            log.info("print_session: xotira tozalandi — %d ta expired sessiya chiqarildi (mem=%d)",
                     len(expired), len(_mem))
    r = _redis()
    if r:
        try:
            r.setex(f"ps:{s.job_id}", TTL + 120, s._ser())
        except Exception as e:
            log.debug("Redis save print session: %s", e)


def _load(job_id: str) -> Optional[PrintSession]:
    if job_id in _mem:
        return _mem[job_id]
    r = _redis()
    if r:
        try:
            raw = r.get(f"ps:{job_id}")
            if raw:
                s = PrintSession._deser(raw)
                _mem[job_id] = s
                return s
        except Exception as e:
            log.debug("Redis load print session: %s", e)
    return None


def _escpos_for_width(s: PrintSession, width_mm: int) -> bytes:
    if width_mm <= 58:
        return s.escpos_58 or s.escpos_80
    return s.escpos_80 or s.escpos_58


def verify_token(job_id: str, token: str) -> bool:
    s = _load(job_id)
    if not s or not token:
        return False
    return _verify_compat(token, job_id, s.user_id, s.created_at)


def verify(job_id: str, uid: int, token: str) -> bool:
    s = _load(job_id)
    if not s or s.user_id != uid:
        return False
    return _verify_compat(token, job_id, uid, s.created_at)


def get(job_id: str) -> Optional[PrintSession]:
    return _load(job_id)


def create(
    uid: int,
    sid: int,
    dtype: str = "sotuv_chek",
    dokon: str = "",
    tel: str = "",
    klient: str = "",
    jami: float = 0.0,
    width: int = 80,
    escpos_80: bytes = b"",
    escpos_58: bytes = b"",
) -> PrintSession:
    now = time.time()
    # Memory cleanup: expired sessions + stale idempotency keys
    expired_jobs = [k for k, v in _mem.items() if now > v.expires_at + 120]
    for k in expired_jobs:
        s = _mem.pop(k, None)
        if s and s.idemp_key:
            _idemp.pop(s.idemp_key, None)

    # Safety: _idemp dan _mem da yo'q bo'lgan kalitlarni tozalash
    if len(_idemp) > 500:
        stale_keys = [ik for ik, jid in _idemp.items() if jid not in _mem]
        for ik in stale_keys:
            _idemp.pop(ik, None)

    ik = f"{dtype}_{sid}_{uid}"
    # Atomic get: lock ostida dict'dan job_id olish — keyin load alohida
    # (lock ushlab qolmasdan Redis'ga borish uchun)
    with _session_lock:
        existing_job_id = _idemp.get(ik)
    if existing_job_id:
        ex = _load(existing_job_id)
        if ex and not ex.expired() and ex.status not in ("done", "failed"):
            return ex

    job_id = uuid.uuid4().hex[:12]
    tok = _sign(job_id, uid, now)
    s = PrintSession(
        job_id=job_id,
        user_id=uid,
        sessiya_id=sid,
        doc_type=dtype,
        dokon=dokon,
        tel=tel,
        klient=klient,
        jami=jami,
        width=width,
        status="pending",
        token=tok,
        idemp_key=ik,
        created_at=now,
        expires_at=now + TTL,
        escpos_80=escpos_80,
        escpos_58=escpos_58 or escpos_80,
    )
    _save(s)
    _idemp[ik] = job_id
    return s


def mark_printing(job_id: str) -> bool:
    s = _load(job_id)
    if not s or s.status == "done":
        return False
    if s.status in ("pending", "failed"):
        s.status = "printing"
        _save(s)
    return True


def mark_done(job_id: str) -> bool:
    s = _load(job_id)
    if not s:
        return False
    if s.status == "done":
        return True
    s.status = "done"
    _save(s)
    return True


def mark_failed(job_id: str, reason: str = "") -> bool:
    s = _load(job_id)
    if not s:
        return False
    if s.status == "failed":
        return True
    if s.status == "done":
        return False
    s.status = "failed"
    _save(s)
    if reason:
        log.info("Print failed %s: %s", job_id, reason[:200])
    return True


def is_duplicate_fetch(job_id: str) -> bool:
    s = _load(job_id)
    return s is not None and s.status == "done"
