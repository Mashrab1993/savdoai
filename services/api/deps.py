"""
API Auth Dependencies — get_uid va rate limiting.
Kassa, WebSocket va boshqa route modullari shu moduldan import qiladi.
Circular import muammosini hal qiladi (main.py ↔ routes/).
"""
from __future__ import annotations
import os
import sys
import time
import json
import hmac
import base64
import logging

from fastapi import HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from shared.cache.redis_cache import rate_limit_tekshir, cache_ol, cache_yoz, k_user, TTL_USER

log = logging.getLogger(__name__)

_JWT_SECRET_RAW = os.getenv("JWT_SECRET", "")
_bearer = HTTPBearer(auto_error=False)


def _get_jwt_secret() -> str:
    """JWT secret — lazy load (env o'zgarishi mumkin)"""
    s = _JWT_SECRET_RAW or os.getenv("JWT_SECRET", "")
    if not s:
        raise RuntimeError("JWT_SECRET muhit o'zgaruvchisi o'rnatilmagan!")
    return s


def jwt_tekshir(token: str) -> int | None:
    """JWT tokenni tekshirib user_id qaytarish.

    Xato sabablari log'ga yozildi — brute-force yoki malformed token
    hujumlari monitoring'da ko'rinadi. Secret o'zi hech qachon log'ga
    chiqmaydi.
    """
    try:
        secret = _get_jwt_secret()
        parts = token.split(".")
        if len(parts) != 3:
            log.info("JWT reject: invalid_format parts=%d", len(parts))
            return None
        h64, p64, s64 = parts
        msg = f"{h64}.{p64}".encode()
        kutilgan = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), msg, "sha256").digest()
        ).rstrip(b"=").decode()
        if not hmac.compare_digest(s64, kutilgan):
            log.warning("JWT reject: signature_mismatch (brute-force xavfi?)")
            return None
        pad = p64 + "=" * (-len(p64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(pad))
        if payload.get("exp", 0) < time.time():
            log.info("JWT reject: expired sub=%s exp=%s", payload.get("sub"), payload.get("exp"))
            return None
        return int(payload.get("sub", 0)) or None
    except json.JSONDecodeError as e:
        log.warning("JWT reject: payload_not_json %s", e)
        return None
    except (ValueError, TypeError) as e:
        log.warning("JWT reject: decode_error %s", e)
        return None
    except RuntimeError as e:
        # JWT_SECRET yo'q bo'lsa — bu deployment muammosi, sirni yashirmaslik
        log.error("JWT reject: config_error %s", e)
        return None
    except Exception as e:
        log.warning("JWT reject: unexpected %s: %s", type(e).__name__, e)
        return None


async def get_uid(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> int:
    """
    Rate limiting + JWT tekshirish → user_id.
    Barcha himoyalangan endpointlar shu dependency dan foydalanadi.
    Token manbalari: 1) Authorization Bearer header, 2) ?token= query param (browser download)
    """
    ip = request.client.host if request.client else "unknown"

    if not await rate_limit_tekshir(f"ip:{ip}", max_req=100, window_s=60):
        raise HTTPException(429, "Juda ko'p so'rov. 1 daqiqa kuting.")

    # 1. Bearer header (asosiy)
    token_str = creds.credentials if creds and creds.credentials else None

    # 2. Query param fallback (browser download uchun)
    if not token_str:
        token_str = request.query_params.get("token", "").strip() or None

    if not token_str:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token kerak")

    uid = jwt_tekshir(token_str)
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token yaroqsiz")

    # User aktivligini tekshirish (cache)
    from shared.database.pool import get_pool
    user = await cache_ol(k_user(uid))
    if user is None:
        async with get_pool().acquire() as c:
            u = await c.fetchrow("SELECT id, faol FROM users WHERE id=$1", uid)
        if not u:
            raise HTTPException(404, "Foydalanuvchi topilmadi")
        if not u["faol"]:
            raise HTTPException(403, "Obuna faol emas")
        await cache_yoz(k_user(uid), dict(u), TTL_USER)

    return uid


# ════════════════════════════════════════════════════════════
#  LOGIN RATE LIMITING — brute-force himoya
# ════════════════════════════════════════════════════════════

_login_attempts: dict[str, list[float]] = {}
_LOGIN_MAX = 5          # 5 ta urinish
_LOGIN_WINDOW = 60.0    # 1 daqiqa ichida
_LOGIN_MAX_IPS = 5000   # xotira himoyasi


async def login_rate_check(request: Request) -> None:
    """Login endpointi uchun alohida rate limiter — 5 urinish/daqiqa."""
    ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Eski yozuvlar tozalash
    if ip in _login_attempts:
        _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < _LOGIN_WINDOW]
    else:
        _login_attempts[ip] = []

    # Xotira himoyasi
    if len(_login_attempts) > _LOGIN_MAX_IPS:
        expired = [k for k, v in _login_attempts.items() if not v or now - max(v) > _LOGIN_WINDOW * 2]
        for k in expired:
            _login_attempts.pop(k, None)

    if len(_login_attempts[ip]) >= _LOGIN_MAX:
        log.warning("LOGIN RATE LIMIT: %s — %d urinish/daqiqa", ip, len(_login_attempts[ip]))
        raise HTTPException(
            status_code=429,
            detail=f"Juda ko'p urinish. {int(_LOGIN_WINDOW)} sekund kutib qayta urinib ko'ring."
        )

    _login_attempts[ip].append(now)


# ════════════════════════════════════════════════════════════
#  ENDPOINT RATE LIMITING — export va sotuv himoyasi
# ════════════════════════════════════════════════════════════

_endpoint_buckets: dict[str, list[float]] = {}
_EP_MAX_IPS = 5000

# Endpoint-spesifik limitlar: (max_requests, window_seconds)
_EP_LIMITS: dict[str, tuple[int, float]] = {
    "export":  (3,  60.0),   # 3 req/min — server yukini kamaytirish
    "sotuv":   (30, 60.0),   # 30 req/min — spam himoya
    "import":  (5,  60.0),   # 5 req/min — og'ir operatsiya
}


async def endpoint_rate_check(request: Request, endpoint: str) -> None:
    """Endpoint-spesifik rate limiter."""
    if endpoint not in _EP_LIMITS:
        return

    max_req, window = _EP_LIMITS[endpoint]
    ip = request.client.host if request.client else "unknown"
    key = f"{endpoint}:{ip}"
    now = time.time()

    # Tozalash
    if key in _endpoint_buckets:
        _endpoint_buckets[key] = [t for t in _endpoint_buckets[key] if now - t < window]
    else:
        _endpoint_buckets[key] = []

    # Xotira himoyasi
    if len(_endpoint_buckets) > _EP_MAX_IPS:
        expired = [k for k, v in _endpoint_buckets.items() if not v or now - max(v) > window * 2]
        for k in expired:
            _endpoint_buckets.pop(k, None)

    if len(_endpoint_buckets[key]) >= max_req:
        log.warning("ENDPOINT RATE LIMIT [%s]: %s — %d req", endpoint, ip, len(_endpoint_buckets[key]))
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit: {endpoint} uchun {max_req} so'rov/{int(window)} sekund."
        )

    _endpoint_buckets[key].append(now)
