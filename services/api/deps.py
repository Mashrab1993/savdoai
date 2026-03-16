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
import hashlib
import logging
from typing import Optional

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


def jwt_tekshir(token: str) -> Optional[int]:
    """JWT tokenni tekshirib user_id qaytarish"""
    try:
        secret = _get_jwt_secret()
        parts = token.split(".")
        if len(parts) != 3:
            return None
        h64, p64, s64 = parts
        msg = f"{h64}.{p64}".encode()
        kutilgan = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), msg, "sha256").digest()
        ).rstrip(b"=").decode()
        if not hmac.compare_digest(s64, kutilgan):
            return None
        pad = p64 + "=" * (-len(p64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(pad))
        if payload.get("exp", 0) < time.time():
            return None
        return int(payload.get("sub", 0)) or None
    except Exception:
        return None


async def get_uid(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> int:
    """
    Rate limiting + JWT tekshirish → user_id.
    Barcha himoyalangan endpointlar shu dependency dan foydalanadi.
    """
    ip = request.client.host if request.client else "unknown"

    if not await rate_limit_tekshir(f"ip:{ip}", max_req=100, window_s=60):
        raise HTTPException(429, "Juda ko'p so'rov. 1 daqiqa kuting.")

    if not creds or not creds.credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token kerak")

    uid = jwt_tekshir(creds.credentials)
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
