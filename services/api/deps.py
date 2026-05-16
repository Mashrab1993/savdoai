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
    """JWT tokenni PyJWT bilan tekshirib user_id qaytarish.

    PyJWT bilan to'g'ri tekshirish (algorithm whitelist, exp tekshirish):
    - HS256 algorithm whitelist (algorithm confusion himoya)
    - exp tekshiriladi (token muddati)
    - iat tekshiriladi (kelajak vaqt aldash himoya)
    - 10s leeway clock skew uchun
    - Eski custom-format tokenlar ham qabul qilinadi (PyJWT decode qiladi)
    """
    try:
        import jwt as _pyjwt
        from jwt import InvalidTokenError, ExpiredSignatureError, DecodeError

        secret = _get_jwt_secret()
        try:
            payload = _pyjwt.decode(
                token,
                secret,
                algorithms=["HS256"],  # algorithm whitelist (security)
                options={
                    "require": ["sub", "exp"],
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": False,  # eski tokenlarda iat yo'q
                    "verify_nbf": True,
                },
                leeway=10,  # 10 sekund clock skew tolerance
            )
        except ExpiredSignatureError:
            log.info("JWT reject: expired")
            return None
        except DecodeError as e:
            log.warning("JWT reject: decode_error %s", e)
            return None
        except InvalidTokenError as e:
            log.warning("JWT reject: invalid_token %s: %s", type(e).__name__, e)
            return None

        sub = payload.get("sub", 0)
        try:
            uid = int(sub)
        except (ValueError, TypeError):
            log.warning("JWT reject: sub_not_int %r", sub)
            return None
        return uid if uid > 0 else None

    except RuntimeError as e:
        # JWT_SECRET yo'q bo'lsa — deployment muammosi
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

    # 1. Bearer header — the ONLY accepted source. We previously allowed a
    # `?token=...` query param for browser download UX, but that put tokens
    # in proxy/CDN logs and in browser history → CSRF/exfil risk. Removed
    # in 2026-05-16 audit. Downloads must now use POST with Authorization
    # header (or a short-lived signed download URL — separate flow).
    token_str = creds.credentials if creds and creds.credentials else None

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
#  PLAN GATING — pro/enterprise feature himoyasi
# ════════════════════════════════════════════════════════════
#
# 2026-05-16 audit: Copilot, Anomaliya, AI Extras, SD Agent Gaps endi
# obuna talab qiladi. Free user'lar 402 (Payment Required) oladi.
# Sotuvga tayyor: pro $X/oy, enterprise $XX/oy — kuchaytirilgan modul.

_PLAN_RANK = {"free": 0, "pro": 1, "enterprise": 2}


async def _user_plan(uid: int) -> str:
    """User'ning joriy tarifini olish (cache → DB fallback)."""
    user = await cache_ol(k_user(uid))
    if user and "plan" in user:
        return str(user.get("plan") or "free").lower()
    # Cache miss — DB
    from shared.database.pool import get_pool
    async with get_pool().acquire() as c:
        plan = await c.fetchval("SELECT plan FROM users WHERE id=$1", uid)
    plan = (plan or "free").lower()
    # Cache yangilash (best-effort)
    try:
        u = user or {}
        u["plan"] = plan
        await cache_yoz(k_user(uid), u, TTL_USER)
    except Exception:
        pass
    return plan


def require_plan(min_plan: str = "pro"):
    """FastAPI Dependency factory — endpoint min plan talab qiladi.

    Foydalanish:
        @router.post("/ask", dependencies=[Depends(require_plan("pro"))])
        async def copilot_ask(...):
            ...

    Yoki to'g'ridan-to'g'ri:
        async def endpoint(uid: int = Depends(require_plan("pro"))):
            ...
            # uid hali ham mavjud
    """
    min_rank = _PLAN_RANK.get(min_plan.lower(), 1)

    async def _dep(uid: int = Depends(get_uid)) -> int:
        plan = await _user_plan(uid)
        user_rank = _PLAN_RANK.get(plan, 0)
        if user_rank < min_rank:
            log.info(
                "PLAN GATE: uid=%d plan=%s required=%s — 402",
                uid, plan, min_plan,
            )
            raise HTTPException(
                status_code=402,
                detail=(
                    f"Bu funksiya {min_plan.capitalize()} tarif talab qiladi. "
                    f"Joriy tarif: {plan.capitalize()}. "
                    "Tarif yangilash uchun admin bilan bog'laning."
                ),
            )
        return uid

    return _dep


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
